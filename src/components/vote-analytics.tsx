
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, Vote, CheckSquare } from "lucide-react";

interface VoteAnalyticsProps {
  candidates: Candidate[];
  votes: Record<string, Record<string, string>>;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const positions: Candidate["position"][] = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Public Information Officer",
];

export default function VoteAnalytics({ candidates, votes }: VoteAnalyticsProps) {
  const analyticsData = useMemo(() => {
    const totalVotersWhoVoted = Object.keys(votes).length;
    
    const votesPerPosition = positions.map((position) => {
      const candidatesForPosition = candidates.filter(
        (c) => c.position === position
      );
      const votesForPosition = Object.values(votes).filter(voterVotes => 
        voterVotes[position] && candidatesForPosition.some(c => c.id === voterVotes[position])
      ).length;

      return { name: position, value: votesForPosition };
    });

    const totalCandidates = candidates.length;
    const totalCastedVotes = votesPerPosition.reduce((sum, item) => sum + item.value, 0);

    return { totalVotersWhoVoted, totalCastedVotes, totalCandidates, votesPerPosition };
  }, [candidates, votes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Analytics</CardTitle>
        <CardDescription>
          An overview of the election statistics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voters Participated</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalVotersWhoVoted}</div>
              <p className="text-xs text-muted-foreground">
                voters have submitted ballots
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalCastedVotes}</div>
              <p className="text-xs text-muted-foreground">
                votes cast across all positions
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">
                candidates are running
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Vote Distribution per Position</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analyticsData.votesPerPosition}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {analyticsData.votesPerPosition.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-bold">{`${payload[0].name}: ${payload[0].value} votes`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
