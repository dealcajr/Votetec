
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

type SecurityStatus = "idle" | "connecting" | "scanning" | "error" | "success";

// In a real app, this would be a list of trusted teacher fingerprint templates
const TRUSTED_FINGERPRINT_DATA = "VOTER-001"; 

export default function ElectionActions() {
  const [status, setStatus] = useState<SecurityStatus>("idle");
  const [error, setError] = useState("");

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);
  const { toast } = useToast();

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
            // It's important to close the port to release it.
            await portRef.current.close();
        } catch(e) { /* Ignore errors if already closing */ }
        portRef.current = null;
    }
  }, []);

  const generateAndSaveResults = async () => {
    try {
      // 1. Fetch all necessary data
      const [candidatesRes, votesRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
      ]);

      if (!candidatesRes.ok || !votesRes.ok) {
        throw new Error("Failed to fetch all data for report generation.");
      }

      const candidates = await candidatesRes.json();
      const votes = await votesRes.json();

      // 2. Calculate final results
      const voteCounts = Object.values(votes).flatMap(voterVotes => Object.values(voterVotes)).reduce((acc, candidateId) => {
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

      // 3. Save the report to a file by calling a new API route
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
              receivedData = lines.pop() || ''; // Keep the last, potentially incomplete line
              
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('VOTER-')) {
                  // This is the data we're waiting for
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
                  return; // Stop listening
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
    // Ensure cleanup is called when the component unmounts
    return () => {
      cleanup();
    };
  }, [cleanup]);


  const renderStatus = () => {
    switch (status) {
      case "idle":
        return <Button onClick={handleStartSecurityCheck} size="lg"><ShieldAlert className="mr-2" />Close Vote & Save Results</Button>;
      case "connecting":
        return <div className="flex items-center gap-2 text-lg text-muted-foreground"><Loader2 className="animate-spin" /> Connecting to device...</div>;
      case "scanning":
        return <div className={cn("flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-dashed", status === 'scanning' && "border-primary")}>
            <Fingerprint className="h-24 w-24 text-primary animate-pulse" />
            <h3 className="text-2xl font-semibold text-primary">Scan Fingerprint</h3>
            <p className="text-muted-foreground">Place the authorized teacher's finger on the scanner to finalize the results.</p>
        </div>;
      case "error":
        return <div className="flex flex-col items-center gap-4 text-destructive animate-shake">
            <XCircle className="h-24 w-24" />
            <h3 className="text-2xl font-semibold">Verification Failed</h3>
            <p className="max-w-md text-center">{error || "An unknown error occurred."}</p>
            <Button onClick={handleStartSecurityCheck} variant="secondary">Try Again</Button>
        </div>;
      case "success":
        return <div className="flex flex-col items-center gap-4 text-accent">
            <CheckCircle className="h-24 w-24 animate-scale-in" />
            <h3 className="text-2xl font-semibold">Election Closed & Report Saved</h3>
            <p className="max-w-md text-center text-muted-foreground">The final results have been saved to <code className="bg-muted px-1 py-0.5 rounded">public/final-results.json</code>.</p>
            <Button onClick={() => setStatus('idle')} variant="secondary">Perform Another Action</Button>
        </div>;
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
        <div className="flex items-center justify-center min-h-[300px] p-4 bg-muted/30 rounded-lg">
          {renderStatus()}
        </div>
      </CardContent>
    </Card>
  );
}
