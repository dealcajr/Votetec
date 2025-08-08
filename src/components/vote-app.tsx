"use client";

import { useState, useEffect, useMemo } from "react";
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
import SecurityDeviceMissing from "@/components/security-device-missing";
import type { Candidate } from "@/types/candidate";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "./ui/skeleton";

export function VoteApp() {
  const [step, setStep] = useState<"welcome" | "voting" | "voted">("welcome");
  const [voterId, setVoterId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityDeviceDetected, setSecurityDeviceDetected] = useState(false);
  const [checkingDevice, setCheckingDevice] = useState(true);

  useEffect(() => {
    // Simulate checking for the security device
    const deviceCheckTimeout = setTimeout(() => {
      // Set to true to simulate device found, false to show error
      setSecurityDeviceDetected(true);
      setCheckingDevice(false);
    }, 2000);

    fetch("/candidates.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data: Candidate[]) => {
        setCandidates(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch candidates:", error);
        setError("Could not load candidates. Please try again later.");
        setIsLoading(false);
      });

    return () => clearTimeout(deviceCheckTimeout);
  }, []);

  const handleStartVoting = (verifiedVoterId: string) => {
    setVoterId(verifiedVoterId);
    setStep("voting");
  };

  const handleVote = () => {
    if (selectedCandidateId) {
      setIsConfirming(true);
    }
  };

  const handleConfirmVote = () => {
    console.log(`Voter ${voterId} voted for ${selectedCandidateId}`);
    setStep("voted");
    setIsConfirming(false);
  };

  const handleReset = () => {
    setVoterId("");
    setSelectedCandidateId(null);
    setStep("welcome");
    setError(null);
  };

  const handleRetryDeviceCheck = () => {
    setCheckingDevice(true);
    // Simulate checking for the security device again
    const deviceCheckTimeout = setTimeout(() => {
      setSecurityDeviceDetected(true); // You can change this to `false` to test the failure case again
      setCheckingDevice(false);
    }, 2000);
    return () => clearTimeout(deviceCheckTimeout);
  };

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId),
    [candidates, selectedCandidateId]
  );

  const renderContent = () => {
    if (checkingDevice) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      );
    }

    if (!securityDeviceDetected) {
      return <SecurityDeviceMissing onRetry={handleRetryDeviceCheck} />;
    }

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
      case "welcome":
        return <WelcomeScreen onStart={handleStartVoting} />;
      case "voting":
        return (
          <VotingScreen
            candidates={candidates}
            isLoading={isLoading}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={setSelectedCandidateId}
            onVote={handleVote}
          />
        );
      case "voted":
        return <VotedScreen votedFor={selectedCandidate!} onReset={handleReset} />;
      default:
        return null;
    }
  };

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
            <AlertDialogDescription>
              Are you sure you want to cast your vote for{" "}
              <strong className="text-primary/90">
                {selectedCandidate?.name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVote}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Confirm Vote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
