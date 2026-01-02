
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import VoterLoginScreen from "@/components/voter-login-screen";
import WelcomeScreen from "@/components/welcome-screen";
import VotingScreen from "@/components/voting-screen";
import VotedScreen from "@/components/voted-screen";
import PollsClosedScreen from "@/components/polls-closed-screen";
import type { Candidate } from "@/types/candidate";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import type { AppSettings } from "@/app/api/settings/route";
import { ThemeToggle } from "./theme-toggle";
import { Skeleton } from "./ui/skeleton";

export type SelectedVotes = Record<Candidate['position'], string | null>;

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
  const [step, setStep] = useState<"login" | "welcome" | "voting" | "voted">("login");
  const [electionStatus, setElectionStatus] = useState<'open' | 'closed' | 'loading'>('loading');
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

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setElectionStatus('loading');
    try {
      const [candidatesRes, votesRes, settingsRes, statusRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
        fetch("/api/settings"),
        fetch("/api/election-status"),
      ]);
      
      if (!candidatesRes.ok) throw new Error("Could not load candidates.");
      if (!votesRes.ok) throw new Error("Could not load votes.");
      if (!settingsRes.ok) throw new Error("Could not load settings.");
      if (!statusRes.ok) throw new Error("Could not check election status.");

      const candidatesData = await candidatesRes.json();
      const votesData = await votesRes.json();
      const settingsData = await settingsRes.json();
      const statusData = await statusRes.json();
      
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setAllVotes(votesData || {});
      setAppSettings(settingsData);
      setElectionStatus(statusData.status);

    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
       toast({
         title: "Error",
         description: errorMessage,
         variant: "destructive",
       });
       postLog(`Data fetch error: ${errorMessage}`, 'ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogin = (id: string) => {
    setVoterId(id);
    setStep("welcome");
  };

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
    setStep("login");
    setVoterId("");
    fetchData();
  }, [fetchData]);

  const isVoteButtonDisabled = useMemo(() => {
    return Object.values(selectedVotes).every(v => v === null);
  }, [selectedVotes]);

  const renderContent = () => {
    if (isLoading || electionStatus === 'loading') {
        return (
          <div className="w-full max-w-sm space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        );
    }

    if (electionStatus === 'closed') {
      return <PollsClosedScreen />;
    }

    switch (step) {
      case "login":
        return <VoterLoginScreen onLogin={handleLogin} />;
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
