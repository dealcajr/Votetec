
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import type { AppSettings } from "@/app/api/settings/route";
import { ThemeToggle } from "./theme-toggle";

export type SelectedVotes = Record<Candidate['position'], string | null>;
export type SecurityStatus = "idle" | "connecting" | "connected" | "scanning" | "error" | "success";

export async function postLog(message: string, type: 'INFO' | 'ERROR' | 'SUCCESS') {
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
  const [step, setStep] = useState<"security" | "welcome" | "voting" | "voted">("security");
  const [voterId, setVoterId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allVotes, setAllVotes] = useState<Record<string, SelectedVotes>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
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
  
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>('idle');
  const [securityError, setSecurityError] = useState("");

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);

  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [candidatesRes, votesRes, settingsRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
        fetch("/api/settings"),
      ]);
      
      if (!candidatesRes.ok) throw new Error("Could not load candidates.");
      if (!votesRes.ok) throw new Error("Could not load votes.");
      if (!settingsRes.ok) throw new Error("Could not load settings.");

      const candidatesData = await candidatesRes.json();
      const votesData = await votesRes.json();
      const settingsData = await settingsRes.json();
      
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setAllVotes(votesData || {});
      setAppSettings(settingsData);

    } catch (err) {
       if (err instanceof Error) {
        setSecurityError(err.message);
        setSecurityStatus("error");
        postLog(`Data fetch error: ${err.message}`, 'ERROR');
       } else {
        setSecurityError("An unknown error occurred.");
        setSecurityStatus("error");
        postLog("An unknown error occurred during data fetch.", 'ERROR');
       }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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

  const handleReset = useCallback(() => {
    postLog("Session reset. Ready for new voter.", 'INFO');
    setSelectedVotes({
      President: null,
      'Vice President': null,
      Secretary: null,
      Treasurer: null,
      Auditor: null,
      'Public Information Officer': null,
    });
    setStep("security");
    setSecurityStatus("idle");
    setSecurityError("");
    setVoterId("");
    if (portRef.current) {
      handleDisconnect();
    }
    fetchData();
  }, []);

  const handleConnect = useCallback(async () => {
    if (!("serial" in navigator)) {
      setSecurityError("Web Serial API not supported by this browser.");
      setSecurityStatus("error");
      postLog("Web Serial API not supported.", "ERROR");
      return;
    }

    setSecurityStatus("connecting");
    postLog("Attempting to connect to serial device.", "INFO");

    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setSecurityStatus("connected");
      toast({ title: "Device Connected", description: "Serial connection established." });
      postLog("Serial device connected successfully.", "SUCCESS");

      keepReadingRef.current = true;
      listenForData();
      
      // Now that we are connected, ask the device to scan.
      setTimeout(() => {
        sendCommand("SCAN_VOTER");
        setSecurityStatus("scanning");
        postLog("Requested fingerprint scan from device.", "INFO");
      }, 1000); // Wait a moment for the device to be ready

    } catch (err) {
      const message = (err instanceof Error && err.name === 'NotFoundError') 
        ? "No device was selected." 
        : "Failed to connect to the device. Please ensure it's plugged in and not in use by another program.";
      setSecurityError(message);
      setSecurityStatus("error");
      postLog(`Device connection failed: ${message}`, "ERROR");
    }
  }, [toast]);
  
  const handleDisconnect = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (err) { /* Ignore cancel errors */ }
    }
    if (portRef.current?.readable) {
      // It's good practice to ensure the reader is released
      // before closing the port.
       readerRef.current?.releaseLock();
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (err) { /* Ignore errors if port is already closing */ }
      portRef.current = null;
    }
    postLog("Serial device disconnected.", "INFO");
  }, []);
  
  const sendCommand = async (command: string) => {
    if (!portRef.current?.writable) return;
    try {
      const writer = portRef.current.writable.getWriter();
      const textEncoder = new TextEncoder();
      await writer.write(textEncoder.encode(command + "\n"));
      writer.releaseLock();
    } catch (err) {
      const message = `Failed to send command to device: ${(err as Error).message}`;
      setSecurityError(message);
      setSecurityStatus("error");
      postLog(message, 'ERROR');
    }
  };

  const listenForData = useCallback(async () => {
    if (!portRef.current?.readable) return;
    
    const textDecoder = new TextDecoder();
    let partialData = "";

    while (portRef.current.readable && keepReadingRef.current) {
      readerRef.current = portRef.current.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            readerRef.current.releaseLock();
            break;
          }
          
          partialData += textDecoder.decode(value, { stream: true });
          
          const lines = partialData.split('\n');
          partialData = lines.pop() || ""; // Keep the last, possibly incomplete, line
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("VOTER_ID:")) {
              const id = trimmedLine.split(":")[1];
              setVoterId(id);
              setStep("welcome");
              keepReadingRef.current = false; // Stop listening
              break;
            } else if (trimmedLine === "unregistered") {
              setSecurityError("This fingerprint is not registered in the system.");
              setSecurityStatus("error");
              postLog("Fingerprint scan resulted in 'unregistered'.", "ERROR");
              keepReadingRef.current = false; // Stop listening
              break;
            } else if (trimmedLine.startsWith("STATUS:") || trimmedLine.startsWith("ERROR:") || trimmedLine.startsWith("WARNING:")) {
              postLog(`Device: ${trimmedLine}`, 'INFO'); // Log device status messages
            }
          }
          if (!keepReadingRef.current) break;
        }
      } catch (err) {
        if (keepReadingRef.current) {
          const message = `Error reading from device: ${(err as Error).message}`;
          setSecurityError(message);
          setSecurityStatus("error");
          postLog(message, 'ERROR');
        }
      }
    }
  }, []);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
        if(portRef.current) {
            handleDisconnect();
        }
    }
  }, [handleDisconnect]);
  
  const isVoteButtonDisabled = useMemo(() => {
    return Object.values(selectedVotes).every(v => v === null);
  }, [selectedVotes]);

  const renderContent = () => {
    if (isLoading && !appSettings) {
        return <p>Loading settings...</p>
    }

    switch (step) {
      case "security":
        return <SecurityCheck status={securityStatus} errorMessage={securityError} onConnect={handleConnect} onRetry={handleReset} />;
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
        <CardHeader className="text-center relative">
          <CardTitle className="text-3xl font-bold text-primary/90">
            {appSettings?.appName || "VoteChain"}
          </CardTitle>
          <CardDescription>
            {appSettings?.appDescription || "A simulated, secure and transparent voting system."}
          </CardDescription>
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
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
