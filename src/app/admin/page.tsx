
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Candidate } from "@/types/candidate";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import RankingOverview from "@/components/ranking-overview";
import VoteAnalytics from "@/components/vote-analytics";
import ElectionOverview from "@/components/election-overview";
import LatestLogs from "@/components/latest-logs";

export default function AdminPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [votes, setVotes] = useState<Record<string, Record<string, string>>>({});
    const [voters, setVoters] = useState<{ id: string }[]>([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [candidatesRes, votesRes, votersRes, logsRes] = await Promise.all([
                fetch("/api/candidates"),
                fetch("/api/votes"),
                fetch("/api/voters"),
                fetch("/api/logs"),
            ]);

            if (!candidatesRes.ok) throw new Error("Failed to fetch candidates");
            if (!votesRes.ok) throw new Error("Failed to fetch votes");
            if (!votersRes.ok) throw new Error("Failed to fetch voters");
            if (!logsRes.ok) throw new Error("Failed to fetch logs");

            const candidatesData = await candidatesRes.json();
            const votesData = await votesRes.json();
            const votersData = await votersRes.json();
            const logsData = await logsRes.json();

            setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
            setVotes(votesData || {});
            setVoters(Array.isArray(votersData) ? votersData : []);
            setLogs(Array.isArray(logsData) ? logsData : []);

        } catch (error) {
            toast({
                title: "Error",
                description: "Could not fetch latest dashboard data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="space-y-4 p-8">
                <Skeleton className="h-10 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="lg:col-span-4">
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="lg:col-span-3">
                         <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-8">
             <h1 className="text-3xl font-bold mb-4">Home</h1>
             <p className="text-muted-foreground mb-8">An overview of the current election status.</p>
             <ElectionOverview candidates={candidates} votes={votes} voters={voters} />
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
                <div className="lg:col-span-4">
                    <RankingOverview candidates={candidates} votes={votes} />
                </div>
                <div className="lg:col-span-3">
                    <LatestLogs logs={logs} />
                </div>
             </div>
        </div>
    );
}
