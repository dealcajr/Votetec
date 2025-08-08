"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@/types/candidate";
import type { Voter } from "@/types/voter";
import { User, Vote, ShieldCheck, Rocket, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { castVote } from "@/ai/flows/vote-flow";
import { useToast } from "@/hooks/use-toast";

const iconMap = {
  User: <User className="h-8 w-8 text-primary/80" />,
  Vote: <Vote className="h-8 w-8 text-primary/80" />,
  ShieldCheck: <ShieldCheck className="h-8 w-8 text-primary/80" />,
  Rocket: <Rocket className="h-8 w-8 text-primary/80" />,
};

interface VotingScreenProps {
  voter: Voter;
  candidates: Candidate[];
  onVoteConfirmed: (candidate: Candidate) => void;
}

export default function VotingScreen({
  voter,
  candidates,
  onVoteConfirmed,
}: VotingScreenProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    try {
      await castVote({
        voterId: voter.id,
        candidateId: selectedCandidate.id,
      });
      onVoteConfirmed(selectedCandidate);
    } catch (error) {
      console.error("Failed to cast vote:", error);
      toast({
        variant: "destructive",
        title: "Vote Failed",
        description: "Your vote could not be submitted. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className="space-y-6 w-full animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Cast Your Vote, {voter.name.split(" ")[0]}
          </h2>
          <p className="text-muted-foreground">
            Select one candidate from the list below.
          </p>
        </div>
        <RadioGroup
          value={selectedCandidate?.id ?? ""}
          onValueChange={(id) =>
            setSelectedCandidate(candidates.find((c) => c.id === id) || null)
          }
          className="space-y-3"
          disabled={isSubmitting}
        >
          {candidates.map((candidate) => (
            <Label
              key={candidate.id}
              htmlFor={candidate.id}
              className={cn(
                "flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all duration-300",
                "hover:bg-primary/10",
                selectedCandidate?.id === candidate.id &&
                  "ring-2 ring-primary border-primary bg-primary/20",
                isSubmitting && "opacity-50 cursor-not-allowed"
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
              <RadioGroupItem
                value={candidate.id}
                id={candidate.id}
                className="h-6 w-6"
              />
            </Label>
          ))}
        </RadioGroup>
        <Button
          onClick={() => setIsConfirming(true)}
          disabled={!selectedCandidate || isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Vote className="mr-2 h-5 w-5" />
          )}
          Cast Your Vote
        </Button>
      </div>
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cast your vote for{" "}
              <strong className="text-primary/90">
                {selectedCandidate?.name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVote}
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Vote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
