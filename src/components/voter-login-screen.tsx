
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";


interface VoterLoginScreenProps {
  onLogin: (voterId: string) => void;
}

export default function VoterLoginScreen({ onLogin }: VoterLoginScreenProps) {
  const [voterId, setVoterId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterId.trim()) {
      onLogin(voterId.trim());
    }
  };

  const isInvalidLrn = voterId.length > 0 && /^\d+$/.test(voterId) && voterId.length !== 12;

  return (
    <div className="w-full max-w-sm animate-fade-in">
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center p-0 pb-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Voter Verification
                </h2>
                <p className="text-muted-foreground">
                    Please enter your Learner Reference Number (LRN) or scan your ID.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="voterId" className="sr-only">Voter ID</Label>
                    <div className="relative">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="voterId"
                            type="text"
                            value={voterId}
                            onChange={(e) => setVoterId(e.target.value)}
                            required
                            placeholder="Enter your LRN or scan ID"
                            className={cn("pl-10", isInvalidLrn && "border-destructive ring-destructive ring-1")}
                        />
                    </div>
                     {isInvalidLrn && (
                        <div className="flex items-center text-xs text-destructive">
                           <AlertTriangle className="h-4 w-4 mr-1" />
                           LRN must be exactly 12 digits.
                        </div>
                    )}
                </div>
                <Button type="submit" className="w-full" disabled={!voterId.trim()}>
                    <LogIn className="mr-2" />
                    Verify and Proceed
                </Button>
            </CardContent>
        </form>
    </div>
  );
}
