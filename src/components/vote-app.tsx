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
import type { Candidate } from "@/types/candidate";

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

  useEffect(() => {
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
  }, []);

  const handleStartVoting = () => {
    if (voterId.trim()) {
      setStep("voting");
    }
  };

  const handleVote = () => {
    if (selectedCandidateId) {
      setIsConfirming(true);
    }
  };

  const handleConfirmVote = () => {
    // Here you would normally send the vote to a server
    // e.g., fetch('/api/vote', { method: 'POST', body: JSON.stringify({ voterId, candidateId: selectedCandidateId }) });
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

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId),
    [candidates, selectedCandidateId]
  );

  const renderStep = () => {
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
        return (
          <WelcomeScreen
            voterId={voterId}
            setVoterId={setVoterId}
            onStart={handleStartVoting}
          />
        );
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
            {renderStep()}
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
