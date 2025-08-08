"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getElectionResults } from "@/ai/flows/vote-flow";
import type { Candidate } from "@/types/candidate";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function ResultsScreen({ onReset }: { onReset: () => void }) {
  const [results, setResults] = useState<{
    candidates: Candidate[];
    totalVotes: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setError(null);
    try {
      const data = await getElectionResults();
      // Sort candidates by votes in descending order
      data.candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setResults(data);
    } catch (err) {
      setError("Failed to fetch election results.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchResults();
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-center animate-fade-in">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Live Election Results
        </CardTitle>
        <CardDescription>
          Total Votes Cast: {results?.totalVotes ?? 0}
        </CardDescription>
      </CardHeader>

      <div className="h-64 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={results?.candidates}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend
              iconType="circle"
              formatter={(value) => <span className="capitalize">{value}</span>}
            />
            <Bar
              dataKey="votes"
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex w-full gap-2 pt-4">
        <Button onClick={onReset} variant="outline" className="w-full">
          Back to Start
        </Button>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full"
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
    </div>
  );
}
