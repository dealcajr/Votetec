
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/types/candidate";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CandidateManagement from "@/components/candidate-management";
import VoteAnalytics from "@/components/vote-analytics";
import RankingOverview from "@/components/ranking-overview";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCandidatesAndVotes = useCallback(async () => {
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
      toast({
        title: "Data Refreshed",
        description: "The latest election data has been loaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not fetch data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCandidatesAndVotes();
  }, [fetchCandidatesAndVotes]);

  if (isLoading && !candidates.length) { // Prevent full-screen loader on refresh
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="manage" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Candidates</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <Button onClick={fetchCandidatesAndVotes} disabled={isLoading} variant="outline" className="ml-4 shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      <TabsContent value="manage" className="mt-4">
        <CandidateManagement 
            initialCandidates={candidates}
            initialVotes={votes}
            onDataChange={fetchCandidatesAndVotes}
        />
      </TabsContent>
      <TabsContent value="rankings" className="mt-4">
        <RankingOverview candidates={candidates} votes={votes} />
      </TabsContent>
      <TabsContent value="analytics" className="mt-4">
        <VoteAnalytics candidates={candidates} votes={votes} />
      </TabsContent>
    </Tabs>
  );
}
