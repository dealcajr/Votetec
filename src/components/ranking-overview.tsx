"use client";

import { useMemo } from "react";
import type { Candidate } from "@/types/candidate";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Badge } from "./ui/badge";

interface RankingOverviewProps {
  candidates: Candidate[];
  votes: Record<string, Record<string, string>>;
}

const positions: Candidate["position"][] = [
    'President',
    'Senior High School Vice President',
    'Junior High School Vice President',
    'Secretary',
    'Treasurer',
    'Auditor',
    'Public Information Officer',
    'Protocol Officer',
    'Grade 8 Representative',
    'Grade 9 Representative',
    'Grade 10 Representative',
    'Grade 11 Representative',
    'Grade 12 Representative',
];

export default function RankingOverview({
  candidates,
  votes,
}: RankingOverviewProps) {
  const chartData = useMemo(() => {
    const voteCounts = Object.values(votes)
      .flatMap((voterVotes) => Object.values(voterVotes))
      .reduce((acc, candidateId) => {
        if (candidateId) {
          acc[candidateId] = (acc[candidateId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    return positions.map((position) => {
      const candidatesForPosition = candidates
        .filter((c) => c.position === position)
        .map((c) => ({
          ...c,
          votes: voteCounts[c.id] || 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      return {
        position,
        candidates: candidatesForPosition,
      };
    });
  }, [candidates, votes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rankings Overview</CardTitle>
        <CardDescription>
          Live ranking of candidates based on vote counts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {chartData.map(({ position, candidates }) => (
          <div key={position}>
            <h3 className="text-lg font-semibold mb-4 text-primary/90">
              {position}
            </h3>
            {candidates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {candidates.map((c, index) => (
                        <div key={c.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Badge variant={index === 0 ? "default" : "secondary"} className="text-lg w-10 h-10 flex items-center justify-center">
                                    #{index + 1}
                                </Badge>
                                <div>
                                    <p className="font-medium">{c.name}</p>
                                    <p className="text-sm text-muted-foreground">{c.votes} vote(s)</p>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={candidates}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" hide/>
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Candidate
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                        {payload[0].payload.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Votes
                                                        </span>
                                                        <span className="font-bold">
                                                        {payload[0].value}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="name" position="insideRight" offset={8} className="fill-background" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">No candidates for this position.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
