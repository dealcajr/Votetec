
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import WelcomeScreen from "@/components/welcome-screen";
import VotingScreen from "@/components/voting-screen";
import VotedScreen from "@/components/voted-screen";
import SecurityCheck from "@/components/security-check";
import type { Candidate } from "@/types/candidate";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export type SelectedVotes = Record<Candidate['position'], string | null>;
export type SecurityStatus = "idle" | "connecting" | "connected" | "scanning" | "error";

async function postLog(message: string, type: 'INFO' | 'ERROR' | 'SUCCESS') {
    try {
        await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, type }),
        });
    } catch (error) {
        console.error('Failed to post log:', error);
    }
}


export function VoteApp() {
  const [step, setStep] = useState<"security-check" | "welcome" | "voting" | "voted">("security-check");
  const [voterId, setVoterId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allVotes, setAllVotes] = useState<Record<string, SelectedVotes>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVotes, setSelectedVotes] = useState<SelectedVotes>({
    President: null,
    'Vice President': null,
    Secretary: null,
    Treasurer: null,
    Auditor: null,
    'Public Information Officer': null,
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>("idle");
  const [securityError, setSecurityError] = useState("");
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);

  const cleanupSerial = useCallback(async (isError = false) => {
    if (!portRef.current) return;
  
    keepReadingRef.current = false;
  
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (err) {
        // Ignore cancel errors
      } finally {
        readerRef.current = null;
      }
    }
  
    if (portRef.current.readable) {
      // The reader is automatically released when the port is closed.
    }
  
    try {
      await portRef.current.close();
    } catch (err) {
      // Ignore errors if the port is already closing or closed.
    }
  
    portRef.current = null;
    if (!isError) {
      setSecurityStatus("idle");
    }
  }, []);

  const listenForData = useCallback(async () => {
    if (!portRef.current || !portRef.current.readable) return;
  
    setSecurityStatus("scanning");
    postLog('Device is now scanning for fingerprints.', 'INFO');
    keepReadingRef.current = true;
    const textDecoder = new TextDecoder();
  
    while (portRef.current.readable && keepReadingRef.current) {
      readerRef.current = portRef.current.readable.getReader();
      let buffer = '';
      try {
        while (keepReadingRef.current) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            break;
          }
  
          const decodedChunk = textDecoder.decode(value, { stream: true });
          console.log('Raw data from ESP32:', decodedChunk);
          buffer += decodedChunk;
          
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            const cleanedVoterId = line.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();

            if (cleanedVoterId.startsWith('VOTER-')) {
              postLog(`Fingerprint scan successful. Received ID: ${cleanedVoterId}`, 'SUCCESS');
              setVoterId(cleanedVoterId);
              setStep("welcome");
              keepReadingRef.current = false; // Stop listening but keep port open
            } else if (cleanedVoterId) {
               postLog(`Received non-voter ID data from ESP32: "${cleanedVoterId}"`, 'INFO');
            }
          }
        }
      } catch (error) {
        if (!keepReadingRef.current) break; // Expected when cleaning up
        const errorMessage = "Device disconnected during scan.";
        setSecurityError(errorMessage);
        postLog(errorMessage, 'ERROR');
        setSecurityStatus("error");
        await cleanupSerial(true);
        break;
      } finally {
        if (readerRef.current) {
          readerRef.current.releaseLock();
          readerRef.current = null;
        }
      }
    }
  }, [cleanupSerial]);

  const handleConnect = useCallback(async () => {
    if (!("serial" in navigator)) {
      const errorMessage = "Web Serial API not supported. Please use a compatible browser like Chrome or Edge.";
      setSecurityError(errorMessage);
      postLog(errorMessage, 'ERROR');
      setSecurityStatus("error");
      return;
    }
  
    setSecurityStatus("connecting");
    postLog('Attempting to connect to serial device.', 'INFO');
    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setSecurityStatus("connected");
      const successMessage = "Serial device connected successfully.";
      toast({ title: "Device Connected", description: "Ready to scan for fingerprints." });
      postLog(successMessage, 'SUCCESS');
      
      listenForData();

    } catch (error) {
      let message = "Failed to connect to the device.";
      if (error instanceof Error && error.name === 'NotFoundError') {
        message = "No device was selected by the user.";
      }
      setSecurityError(message);
      postLog(message, 'ERROR');
      setSecurityStatus("idle"); 
      await cleanupSerial();
    }
  }, [cleanupSerial, listenForData, toast]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [candidatesRes, votesRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
      ]);
      
      if (!candidatesRes.ok) throw new Error("Could not load candidates.");
      if (!votesRes.ok) throw new Error("Could not load votes.");

      const candidatesData = await candidatesRes.json();
      const votesData = await votesRes.json();
      
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setAllVotes(votesData || {});

    } catch (err) {
       if (err instanceof Error) {
        setError(err.message);
        postLog(`Data fetch error: ${err.message}`, 'ERROR');
       } else {
        setError("An unknown error occurred.");
        postLog("An unknown error occurred during data fetch.", 'ERROR');
       }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    postLog("Voting application initialized.", "INFO");
    fetchData();
  }, []);

  const handleStartVoting = () => {
    postLog(`Voter ${voterId} started the voting process.`, 'INFO');
    setStep("voting");
  };

  const handleVote = () => {
    if (Object.values(selectedVotes).some(v => v !== null)) {
      setIsConfirming(true);
    }
  };

  const handleConfirmVote = async () => {
    setIsSubmitting(true);
    postLog(`Voter ${voterId} is submitting their vote.`, 'INFO');
    try {
      const votesRes = await fetch("/api/votes");
      if (!votesRes.ok) throw new Error("Failed to fetch current votes.");
      const currentVotes = await votesRes.json();
      
      const updatedVotes = {
        ...currentVotes,
        [voterId]: selectedVotes,
      };

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVotes, null, 2),
      });

      if (!res.ok) {
        throw new Error("Failed to submit vote");
      }
      
      setAllVotes(updatedVotes);
      setStep("voted");
      postLog(`Voter ${voterId} successfully submitted their vote.`, 'SUCCESS');

    } catch (error) {
       const errorMessage = "Failed to submit vote.";
       toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
      postLog(`${errorMessage} Voter: ${voterId}. Error: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    postLog("Session reset. Ready for new voter.", 'INFO');
    setSelectedVotes({
      President: null,
      'Vice President': null,
      Secretary: null,
      Treasurer: null,
      Auditor: null,
      'Public Information Officer': null,
    });
    setStep("security-check");
    setError(null);
    setVoterId("");
    
    // If connected, start listening again
    if (portRef.current) {
      listenForData();
    }
    // Re-fetch data in case it has changed
    fetchData();
  };
  
  const isVoteButtonDisabled = useMemo(() => {
    return Object.values(selectedVotes).every(v => v === null);
  }, [selectedVotes]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center text-destructive">
          <p>{error}</p>
          <button onClick={handleReset} className="mt-4 text-primary underline">
            Try again
          </button>
        </div>
      );
    }

    switch (step) {
      case "security-check":
        return <SecurityCheck status={securityStatus} errorMessage={securityError} onConnect={handleConnect} onRetry={handleConnect} />;
      case "welcome":
        return <WelcomeScreen voterId={voterId} onStart={handleStartVoting} onReset={handleReset} votes={allVotes} />;
      case "voting":
        return (
          <VotingScreen
            candidates={candidates}
            isLoading={isLoading}
            selectedVotes={selectedVotes}
            onSelectVote={setSelectedVotes}
            onVote={handleVote}
            isVoteDisabled={isVoteButtonDisabled}
          />
        );
      case "voted":
        return <VotedScreen onReset={handleReset} />;
      default:
        return null;
    }
  };
  
  const confirmationDetails = useMemo(() => {
    if (!isConfirming) return [];
    
    return Object.entries(selectedVotes)
      .filter(([, candidateId]) => candidateId !== null)
      .map(([position, candidateId]) => {
        const candidate = candidates.find(c => c.id === candidateId);
        return { position, name: candidate?.name || 'Unknown' };
      });
  }, [selectedVotes, candidates, isConfirming]);


  return (
    <>
      <Toaster />
      <Card className="w-full max-w-lg shadow-2xl animate-fade-in border-0 sm:border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary/90">
            VoteChain
          </CardTitle>
          <CardDescription>
            A simulated, secure and transparent voting system.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 py-4">
          <div className="min-h-[300px] flex items-center justify-center">
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to cast your votes? This action cannot be
                undone.
                <ul className="mt-4 space-y-2">
                  {confirmationDetails.map(({ position, name }) => (
                    <li key={position}>
                      <span className="font-semibold text-muted-foreground">
                        {position}:
                      </span>{" "}
                      <strong className="text-primary/90">{name}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVote}
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? "Submitting..." : "Confirm Vote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
