
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Vote } from "lucide-react";

export default function PollsClosedScreen() {
  return (
    <div className="space-y-6 text-center flex flex-col items-center animate-fade-in">
      <div className="relative">
        <Vote className="h-24 w-24 text-primary/50 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          The Polls Are Closed
        </h2>
        <p className="text-muted-foreground">
          Thank you for your interest. The voting period for this election has ended.
        </p>
      </div>
      <div className="flex items-center space-x-2 rounded-md bg-muted p-4 w-full justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">
          No further votes can be accepted.
        </p>
      </div>
    </div>
  );
}
