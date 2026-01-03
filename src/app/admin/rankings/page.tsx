
"use client";

import RankingOverview from "@/components/ranking-overview";
import type { Candidate } from "@/types/candidate";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { SelectedVotes } from "@/components/vote-app";

export default function RankingsPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [votes, setVotes] = useState<Record<string, SelectedVotes>>({});
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
            <div className="space-y-4 p-8">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Rankings</h1>
            <p className="text-muted-foreground mb-8">View the live rankings of all candidates.</p>
            <RankingOverview candidates={candidates} votes={votes} />
        </div>
    );
}
