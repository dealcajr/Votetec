import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WelcomeScreenProps {
  voterId: string;
  setVoterId: (id: string) => void;
  onStart: () => void;
}

export default function WelcomeScreen({
  voterId,
  setVoterId,
  onStart,
}: WelcomeScreenProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && voterId.trim()) {
      onStart();
    }
  };

  return (
    <div className="space-y-6 text-center animate-fade-in w-full max-w-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome, Voter!</h2>
        <p className="text-muted-foreground">
          Please enter your unique Voter ID to proceed.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="voterId">Voter ID</Label>
          <Input
            id="voterId"
            placeholder="e.g., VOTE-12345"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-center text-lg h-12"
            autoFocus
          />
        </div>
        <Button
          onClick={onStart}
          disabled={!voterId.trim()}
          className="w-full"
          size="lg"
        >
          Start Voting
        </Button>
      </div>
      <p className="text-xs text-muted-foreground pt-4">
        Your vote is anonymous and secure. Once submitted, the system will lock
        to prevent multiple entries.
      </p>
    </div>
  );
}
