
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/types/candidate";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CandidateManagement from "@/components/candidate-management";
import RankingOverview from "@/components/ranking-overview";
import VoteAnalytics from "@/components/vote-analytics";
import LogViewer from "@/components/log-viewer";
import DeviceTerminal from "./device-terminal";
import Settings from "./settings";
import { ThemeToggle } from "./theme-toggle";
import VoterManagement from "./voter-management";

export interface DisplayCandidate extends Candidate {
    voteCount: number;
    rank: number;
}

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
        description: "Latest candidates and votes have been loaded."
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch latest data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCandidatesAndVotes();
  }, [fetchCandidatesAndVotes]);
  
  if (isLoading) {
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="manage">Manage Candidates</TabsTrigger>
          <TabsTrigger value="voters">Manage Voters</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="terminal">Device Terminal</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2 ml-4">
          <ThemeToggle />
          <Button onClick={fetchCandidatesAndVotes} disabled={isLoading} variant="outline" className="shrink-0">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>
      <TabsContent value="manage">
        <CandidateManagement initialCandidates={candidates} initialVotes={votes} onDataChange={fetchCandidatesAndVotes} />
      </TabsContent>
      <TabsContent value="voters">
        <VoterManagement onDataChange={fetchCandidatesAndVotes} />
      </TabsContent>
      <TabsContent value="rankings">
        <RankingOverview candidates={candidates} votes={votes} />
      </TabsContent>
      <TabsContent value="analytics">
        <VoteAnalytics candidates={candidates} votes={votes} />
      </TabsContent>
      <TabsContent value="logs">
        <LogViewer />
      </TabsContent>
      <TabsContent value="terminal">
        <DeviceTerminal />
      </TabsContent>
      <TabsContent value="settings">
        <Settings />
      </TabsContent>
    </Tabs>
  );
}
