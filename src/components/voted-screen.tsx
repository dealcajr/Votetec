import { Button } from "@/components/ui/button";
import type { Candidate } from "@/types/candidate";
import { CheckCircle2, Lock } from "lucide-react";

interface VotedScreenProps {
  votedFor: Candidate;
  onReset: () => void;
}

export default function VotedScreen({ votedFor, onReset }: VotedScreenProps) {
  return (
    <div className="space-y-6 text-center flex flex-col items-center animate-fade-in">
      <div className="relative">
        <CheckCircle2 className="h-24 w-24 text-accent animate-scale-in" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Vote Submitted!
        </h2>
        <p className="text-muted-foreground">
          Thank you for voting for{" "}
          <span className="font-bold text-primary/90">
            {votedFor?.name || "your candidate"}
          </span>
          .
        </p>
      </div>
      <div className="flex items-center space-x-2 rounded-md bg-muted p-4 w-full justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">
          System Locked. Please contact an administrator to reset.
        </p>
      </div>
      <Button onClick={onReset} variant="outline" className="w-full">
        Cast Another Vote (Demo Only)
      </Button>
    </div>
  );
}
