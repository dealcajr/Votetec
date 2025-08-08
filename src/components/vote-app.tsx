"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import WelcomeScreen from "@/components/welcome-screen";
import VotingScreen from "@/components/voting-screen";
import VotedScreen from "@/components/voted-screen";
import ResultsScreen from "@/components/results-screen";
import type { Candidate } from "@/types/candidate";
import type { Voter } from "@/types/voter";

export type Step = "welcome" | "voting" | "voted" | "results";

export function VoteApp() {
  const [step, setStep] = useState<Step>("welcome");
  const [voter, setVoter] = useState<Voter | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  const handleVerificationComplete = (
    verifiedVoter: Voter,
    fetchedCandidates: Candidate[]
  ) => {
    setVoter(verifiedVoter);
    setCandidates(fetchedCandidates);
    setStep("voting");
  };

  const handleVoteConfirmed = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setStep("voted");
  };

  const handleShowResults = () => {
    setStep("results");
  };

  const handleReset = () => {
    setVoter(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setStep("welcome");
  };

  const renderContent = () => {
    switch (step) {
      case "welcome":
        return (
          <WelcomeScreen onVerificationComplete={handleVerificationComplete} />
        );
      case "voting":
        return (
          <VotingScreen
            voter={voter!}
            candidates={candidates}
            onVoteConfirmed={handleVoteConfirmed}
          />
        );
      case "voted":
        return (
          <VotedScreen
            votedFor={selectedCandidate!}
            onShowResults={handleShowResults}
            onReset={handleReset}
          />
        );
      case "results":
        return <ResultsScreen onReset={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl animate-fade-in border-0 sm:border">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary/90">
          VoteChain
        </CardTitle>
        <CardDescription>
          A secure and transparent voting system.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 py-4">
        <div className="min-h-[450px] flex items-center justify-center">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}
