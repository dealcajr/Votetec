
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, Loader2, XCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { postLog } from "./vote-app";
import { SelectedVotes } from "./vote-app";

type SecurityStatus = "idle" | "connecting" | "scanning" | "error" | "success" | "loading";

// In a real app, this would be a list of trusted teacher fingerprint templates
const TRUSTED_FINGERPRINT_DATA = "VOTER-001"; 

export default function ElectionActions() {
  const [status, setStatus] = useState<SecurityStatus>("loading");
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
        try {
            const res = await fetch("/api/election-status");
            if (!res.ok) throw new Error("Could not check status");
            const data = await res.json();
            if (data.status === 'closed') {
                setStatus('success');
            } else {
                setStatus('idle');
            }
        } catch (e) {
            setStatus('error');
            setError("Could not verify election status. Please refresh.")
        }
    };
    checkStatus();
  }, []);

  const cleanup = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
        try {
            await readerRef.current.cancel();
            readerRef.current.releaseLock();
        } catch (err) { /* Ignore cancel errors */ }
        readerRef.current = null;
    }
    if (portRef.current?.readable) {
        try {
            await portRef.current.close();
        } catch(e) { /* Ignore errors if already closing */ }
        portRef.current = null;
    }
  }, []);

  const generateAndSaveResults = async () => {
    try {
      const [candidatesRes, votesRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
      ]);

      if (!candidatesRes.ok || !votesRes.ok) {
        throw new Error("Failed to fetch all data for report generation.");
      }

      const candidates = await candidatesRes.json();
      const votes: Record<string, SelectedVotes> = await votesRes.json();

      const voteCounts = Object.values(votes).flatMap(voterVotes => Object.values(voterVotes).flat()).reduce((acc, candidateId) => {
          if (candidateId) {
              acc[candidateId] = (acc[candidateId] || 0) + 1;
          }
          return acc;
      }, {} as Record<string, number>);

      const finalResults = candidates.map((c: any) => ({
        ...c,
        voteCount: voteCounts[c.id] || 0,
      })).sort((a: any, b: any) => b.voteCount - a.voteCount);
      
      const totalVoters = Object.keys(votes).length;

      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalVotersWhoVoted: totalVoters,
        },
        results: finalResults,
      };

      const saveRes = await fetch("/api/save-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save the final results file.");
      }
      
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      postLog(`Error generating final report: ${errorMessage}`, "ERROR");
      toast({
        title: "Report Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }

  const listenForData = useCallback(async () => {
    if (!portRef.current?.readable) return;
    
    const textDecoder = new TextDecoder();
    let receivedData = "";

    while (portRef.current.readable && keepReadingRef.current) {
      readerRef.current = portRef.current.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            readerRef.current.releaseLock();
            break;
          }
          const decodedChunk = textDecoder.decode(value, { stream: true });
          receivedData += decodedChunk;
          
          if (receivedData.includes('\n')) {
              const lines = receivedData.split('\n');
              receivedData = lines.pop() || ''; 
              
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('VOTER-')) {
                  if (trimmedLine === TRUSTED_FINGERPRINT_DATA) {
                    
                    const reportGenerated = await generateAndSaveResults();

                    if (reportGenerated) {
                        setStatus("success");
                        postLog("Election closing authorized by teacher. Final report generated.", "SUCCESS");
                        toast({ title: "Authorized & Results Saved", description: "The final report (final-results.json) has been generated."});
                    } else {
                        setError("Authorization succeeded, but failed to generate the report.");
                        setStatus("error");
                    }
                    cleanup();

                  } else {
                    setError("Unauthorized fingerprint. Please use a registered teacher's finger.");
                    setStatus("error");
                    postLog(`Unauthorized attempt to close election. Scanned ID: ${trimmedLine}`, "ERROR");
                    cleanup();
                  }
                  return; 
                }
              }
          }
        }
      } catch (err) {
        if (keepReadingRef.current) {
           setError("An error occurred while reading from the device.");
           setStatus("error");
           postLog(`Error reading from serial device: ${(err as Error).message}`, "ERROR");
           cleanup();
        }
        break;
      }
    }
  }, [toast, cleanup]);

  const handleStartSecurityCheck = useCallback(async () => {
    if (!("serial" in navigator)) {
      setError("Web Serial API is not supported in this browser.");
      setStatus("error");
      return;
    }
    
    setStatus("connecting");
    setError("");

    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      
      keepReadingRef.current = true;
      listenForData();

      const writer = port.writable.getWriter();
      const textEncoder = new TextEncoder();
      await writer.write(textEncoder.encode("SCAN_VOTER\n"));
      writer.releaseLock();
      
      setStatus("scanning");
      postLog("Teacher fingerprint scan initiated for closing election.", "INFO");

    } catch (err) {
        const errorMessage = (err instanceof Error && err.name === 'NotFoundError') ? "No device selected." : "Failed to connect to the device.";
        setError(errorMessage);
        setStatus("error");
        postLog(`Failed to connect for security check: ${errorMessage}`, 'ERROR');
        cleanup();
    }
  }, [listenForData, cleanup]);
  
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleAlertClose = (open: boolean) => {
    if (!open) {
      cleanup();
      // If we were in a final state (success/error), reset to idle, otherwise check status again
      if (status === 'success' || status === 'error') {
        setStatus('idle');
        const checkStatusOnClose = async () => {
            const res = await fetch("/api/election-status");
            const data = await res.json();
             if (data.status === 'closed') {
                setStatus('success');
            } else {
                setStatus('idle');
            }
        }
        checkStatusOnClose();
      }
    }
    setIsDialogOpen(open);
  }

  const renderStatus = () => {
    switch (status) {
      case "loading":
        return <div className="flex items-center gap-2 text-lg text-muted-foreground"><Loader2 className="animate-spin" /> Checking election status...</div>;
      case "connecting":
        return <div className="flex items-center gap-2 text-lg text-muted-foreground"><Loader2 className="animate-spin" /> Connecting to device...</div>;
      case "scanning":
        return <div className={cn("flex flex-col items-center gap-4 p-6 rounded-lg")}>
            <Fingerprint className="h-24 w-24 text-primary animate-pulse" />
            <h3 className="text-2xl font-semibold text-primary">Scan Fingerprint</h3>
            <p className="text-muted-foreground">Place the authorized teacher's finger on the scanner to finalize the results.</p>
        </div>;
      case "error":
        return <div className="flex flex-col items-center gap-4 text-destructive animate-shake">
            <XCircle className="h-24 w-24" />
            <h3 className="text-2xl font-semibold">Verification Failed</h3>
            <p className="max-w-md text-center">{error || "An unknown error occurred."}</p>
        </div>;
      case "success":
        return <div className="flex flex-col items-center gap-4 text-accent">
            <CheckCircle className="h-24 w-24 animate-scale-in" />
            <h3 className="text-2xl font-semibold">Election Closed & Report Saved</h3>
            <p className="max-w-md text-center text-muted-foreground">The final results have been saved to <code className="bg-muted px-1 py-0.5 rounded">public/final-results.json</code>.</p>
        </div>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Election Actions</CardTitle>
        <CardDescription>
          Perform secure, high-privilege actions related to the election.
          These actions require fingerprint authorization.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <AlertDialog open={isDialogOpen} onOpenChange={handleAlertClose}>
             {status === 'idle' && (
                <AlertDialogTrigger asChild>
                    <Button size="lg" className="w-full min-h-[300px] flex-col text-lg">
                        <ShieldAlert className="h-16 w-16 mb-4" />
                        Close Vote & Save Results
                    </Button>
                </AlertDialogTrigger>
             )}
              {status === 'success' && (
                 <div className="flex items-center justify-center min-h-[300px] p-4 bg-muted/30 rounded-lg">
                    {renderStatus()}
                 </div>
              )}
               {status === 'loading' && (
                 <div className="flex items-center justify-center min-h-[300px] p-4 bg-muted/30 rounded-lg">
                    {renderStatus()}
                 </div>
              )}

            <AlertDialogContent>
              {status === 'idle' || status === 'connecting' || status === 'scanning' || status === 'error' ? (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                        {status === 'idle' && 'Are you absolutely sure?'}
                        {status === 'connecting' && 'Connecting...'}
                        {status === 'scanning' && 'Awaiting Scan...'}
                        {status === 'error' && 'Error'}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>
                             {status === 'idle' && 'This action will close the election for all voters, generate the final results file, and cannot be undone without resetting all vote data.'}
                             {status === 'connecting' && 'Please select the serial device from the popup window.'}
                             {status === 'scanning' && <div className="flex justify-center">{renderStatus()}</div>}
                             {status === 'error' && <div className="flex justify-center">{renderStatus()}</div>}
                        </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {status === 'idle' && (
                      <AlertDialogAction onClick={handleStartSecurityCheck}>
                        Yes, Close Election
                      </AlertDialogAction>
                    )}
                    {status === 'error' && (
                      <AlertDialogAction onClick={handleStartSecurityCheck}>
                        Try Again
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </>
              ) : (
                <div className="p-6">
                    {renderStatus()}
                </div>
              )}
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
