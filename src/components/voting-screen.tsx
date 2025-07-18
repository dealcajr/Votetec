import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@/types/candidate";
import { User, Vote, ShieldCheck, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  User: <User className="h-8 w-8 text-primary/80" />,
  Vote: <Vote className="h-8 w-8 text-primary/80" />,
  ShieldCheck: <ShieldCheck className="h-8 w-8 text-primary/80" />,
  Rocket: <Rocket className="h-8 w-8 text-primary/80" />,
};

interface VotingScreenProps {
  candidates: Candidate[];
  isLoading: boolean;
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
  onVote: () => void;
}

export default function VotingScreen({
  candidates,
  isLoading,
  selectedCandidateId,
  onSelectCandidate,
  onVote,
}: VotingScreenProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 rounded-md border p-4"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Cast Your Vote</h2>
        <p className="text-muted-foreground">
          Select one candidate from the list below.
        </p>
      </div>
      <RadioGroup
        value={selectedCandidateId ?? ""}
        onValueChange={onSelectCandidate}
        className="space-y-3"
      >
        {candidates.map((candidate) => (
          <Label
            key={candidate.id}
            htmlFor={candidate.id}
            className={cn(
              "flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all duration-300",
              "hover:bg-primary/10",
              selectedCandidateId === candidate.id &&
                "ring-2 ring-primary border-primary bg-primary/20"
            )}
          >
            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
              {iconMap[candidate.icon as keyof typeof iconMap] || (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-grow">
              <p className="font-semibold text-card-foreground">
                {candidate.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {candidate.description}
              </p>
            </div>
            <RadioGroupItem value={candidate.id} id={candidate.id} className="h-6 w-6" />
          </Label>
        ))}
      </RadioGroup>
      <Button
        onClick={onVote}
        disabled={!selectedCandidateId}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        Cast Your Vote
      </Button>
    </div>
  );
}
