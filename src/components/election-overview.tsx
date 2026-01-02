
"use client";

import { useMemo } from "react";
import type { Candidate } from "@/types/candidate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Vote, CheckSquare, BarChart } from "lucide-react";

interface ElectionOverviewProps {
  candidates: Candidate[];
  votes: Record<string, Record<string, string>>;
  voters: { id: string }[];
}

export default function ElectionOverview({ candidates, votes, voters }: ElectionOverviewProps) {
    const stats = useMemo(() => {
        const totalVoters = voters.length;
        const votersWhoVoted = Object.keys(votes).length;
        const turnout = totalVoters > 0 ? (votersWhoVoted / totalVoters) * 100 : 0;

        return {
            totalCandidates: candidates.length,
            totalVoters,
            votersWhoVoted,
            turnout: turnout.toFixed(1),
        };
    }, [candidates, votes, voters]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVoters}</div>
              <p className="text-xs text-muted-foreground">registered voters</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votes Submitted</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.votersWhoVoted}</div>
               <p className="text-xs text-muted-foreground">out of {stats.totalVoters} voters</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voter Turnout</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.turnout}%</div>
              <p className="text-xs text-muted-foreground">participation rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">
                candidates running for office
              </p>
            </CardContent>
          </Card>
        </div>
    );
}
