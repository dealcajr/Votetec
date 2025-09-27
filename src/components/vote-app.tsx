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
import SecurityCheck from "@/components/security-check";
import type { Candidate } from "@/types/candidate";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export type SelectedVotes = Record<Candidate['position'], string | null>;

export function VoteApp() {
  const [step, setStep] = useState<"security-check" | "welcome" | "voting" | "voted" | "edit">("security-check");
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
       } else {
        setError("An unknown error occurred.");
       }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (step === 'edit') {
      setStep('voting');
    }
  }, [step]);
  
  const handleSecurityDeviceConnected = () => {
    setStep("welcome");
  };

  const handleStartVoting = (verifiedVoterId: string) => {
    setVoterId(verifiedVoterId);
    setStep("voting");
  };

  const handleVote = () => {
    if (Object.values(selectedVotes).some(v => v !== null)) {
      setIsConfirming(true);
    }
  };

  const handleConfirmVote = async () => {
    setIsSubmitting(true);
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

    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
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
    fetchData();
  };
  
  const handleEdit = () => {
    setStep('edit');
  }

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
        return <SecurityCheck onDeviceConnected={handleSecurityDeviceConnected} />;
      case "welcome":
        return <WelcomeScreen onStart={handleStartVoting} votes={allVotes} />;
      case "voting":
      case "edit":
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
        return <VotedScreen onReset={handleReset} onEdit={handleEdit} />;
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
            <AlertDialogDescription>
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
