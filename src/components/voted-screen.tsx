
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock } from "lucide-react";

interface VotedScreenProps {
  onReset: () => void;
}

export default function VotedScreen({ onReset }: VotedScreenProps) {
  return (
    <div className="space-y-6 text-center flex flex-col items-center animate-fade-in w-full max-w-md mx-auto">
      <div className="relative">
        <CheckCircle2 className="h-16 w-16 text-accent animate-scale-in" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Vote Submitted!
        </h2>
        <p className="text-muted-foreground max-w-sm">
          Thank you for participating. Your vote has been securely recorded.
        </p>
      </div>
      
      <div className="w-full pt-4">
        <Button onClick={onReset} variant="outline" className="w-full h-12 text-base">
            Finish & Start New Session
        </Button>
      </div>

       <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-4">
        <Lock className="h-4 w-4" />
        <p>This session is now closed.</p>
      </div>
    </div>
  );
}
