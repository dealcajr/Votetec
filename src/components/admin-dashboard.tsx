"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/types/candidate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CandidateManagement from "@/components/candidate-management";
import VoteAnalytics from "@/components/vote-analytics";
import RankingOverview from "@/components/ranking-overview";
import { Skeleton } from "./ui/skeleton";

export interface DisplayCandidate extends Candidate {
    voteCount: number;
    rank: number;
}

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCandidatesAndVotes = async () => {
    setIsLoading(true);
    try {
      const [candidatesRes, votesRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
      ]);

      if (!candidatesRes.ok) throw new Error("Failed to fetch candidates");
      if (!votesRes.ok) throw new Error("Failed to fetch votes");

      const candidatesData = await candidatesRes.json();
      const votesData = await votesRes.json();

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setVotes(votesData || {});
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatesAndVotes();
  }, []);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  return (
    <Tabs defaultValue="candidates" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="candidates">Candidates</TabsTrigger>
        <TabsTrigger value="rankings">Rankings</TabsTrigger>
        <TabsTrigger value="analytics">Vote Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="candidates">
        <CandidateManagement
          initialCandidates={candidates}
          initialVotes={votes}
          onDataChange={fetchCandidatesAndVotes}
        />
      </TabsContent>
      <TabsContent value="rankings">
        <RankingOverview candidates={candidates} votes={votes} />
      </TabsContent>
      <TabsContent value="analytics">
        <VoteAnalytics candidates={candidates} votes={votes} />
      </TabsContent>
    </Tabs>
  );
}
