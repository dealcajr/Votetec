
"use client";

import VoterManagement from "@/components/voter-management";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";

export default function VotersPage() {
    const [votes, setVotes] = useState<Record<string, Record<string, string>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const votesRes = await fetch("/api/votes");
            if (!votesRes.ok) throw new Error("Failed to fetch votes");
            const votesData = await votesRes.json();
            setVotes(votesData || {});
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not fetch vote data.",
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
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Manage Voters</h1>
            <p className="text-muted-foreground mb-8">Import and manage the list of eligible voters.</p>
            <VoterManagement votes={votes} onDataChange={fetchData} />
        </div>
    );
}
