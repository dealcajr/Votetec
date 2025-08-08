import { Button } from "@/components/ui/button";
import type { Candidate } from "@/types/candidate";
import { CheckCircle2, BarChart2 } from "lucide-react";

interface VotedScreenProps {
  votedFor: Candidate;
  onShowResults: () => void;
  onReset: () => void;
}

export default function VotedScreen({
  votedFor,
  onShowResults,
  onReset,
}: VotedScreenProps) {
  return (
    <div className="space-y-8 text-center flex flex-col items-center animate-fade-in">
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
        <p className="text-sm text-muted-foreground pt-2">
          Your vote has been securely recorded on the blockchain.
        </p>
      </div>

      <div className="w-full space-y-3">
        <Button onClick={onShowResults} className="w-full" size="lg">
          <BarChart2 className="mr-2 h-5 w-5" />
          View Live Results
        </Button>
        <Button onClick={onReset} variant="outline" className="w-full">
          Cast Another Vote
        </Button>
      </div>
    </div>
  );
}
