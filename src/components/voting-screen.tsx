
"use client";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@/types/candidate";
import { User, Vote, ShieldCheck, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { SelectedVotes } from "./vote-app";
import { Checkbox } from "./ui/checkbox";

const iconMap = {
  User: <User className="h-6 w-6 text-primary/80" />,
  Vote: <Vote className="h-6 w-6 text-primary/80" />,
  ShieldCheck: <ShieldCheck className="h-6 w-6 text-primary/80" />,
  Rocket: <Rocket className="h-6 w-6 text-primary/80" />,
};

interface VotingScreenProps {
  candidates: Candidate[];
  isLoading: boolean;
  selectedVotes: SelectedVotes;
  onSelectVote: (votes: SelectedVotes) => void;
  onVote: () => void;
  isVoteDisabled: boolean;
}

export default function VotingScreen({
  candidates,
  isLoading,
  selectedVotes,
  onSelectVote,
  onVote,
  isVoteDisabled,
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

  const groupedCandidates = candidates.reduce((acc, candidate) => {
    (acc[candidate.position] = acc[candidate.position] || []).push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);
  
  const positions: Candidate['position'][] = [
    'President',
    'Senior High School Vice President',
    'Junior High School Vice President',
    'Secretary',
    'Treasurer',
    'Auditor',
    'Public Information Officer',
    'Protocol Officer',
    'Grade 8 Representative',
    'Grade 9 Representative',
    'Grade 10 Representative',
    'Grade 11 Representative',
    'Grade 12 Representative',
  ];

  const handleSingleSelect = (position: Candidate['position'], candidateId: string) => {
    onSelectVote({
        ...selectedVotes,
        [position]: candidateId,
    });
  };

  const handleMultiSelect = (position: string, candidateId: string) => {
    const currentSelection = (selectedVotes[position] as string[]) || [];
    let newSelection;

    if (currentSelection.includes(candidateId)) {
        newSelection = currentSelection.filter(id => id !== candidateId);
    } else {
        if (currentSelection.length < 2) {
            newSelection = [...currentSelection, candidateId];
        } else {
            // Optional: Show a toast or message that they can only select 2
            return;
        }
    }
     onSelectVote({
        ...selectedVotes,
        [position]: newSelection,
    });
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Cast Your Vote</h2>
        <p className="text-muted-foreground">
          Select one candidate for each position, and up to two for Representatives.
        </p>
      </div>
      <Accordion type="multiple" className="w-full space-y-3" defaultValue={positions}>
        {positions.map((position) => {
          const isRepresentative = position.includes('Representative');

          return groupedCandidates[position] && (
            <AccordionItem value={position} key={position} className="border rounded-lg">
              <AccordionTrigger className="p-4 hover:no-underline">
                <h3 className="text-lg font-semibold text-primary/90">{position}</h3>
              </AccordionTrigger>
              <AccordionContent className="p-1">
                {isRepresentative ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3">
                        {groupedCandidates[position].map((candidate) => {
                            const isSelected = ((selectedVotes[position] as string[]) || []).includes(candidate.id);
                            const isDisabled = !isSelected && ((selectedVotes[position] as string[]) || []).length >= 2;
                            return (
                                <Label
                                    key={candidate.id}
                                    htmlFor={`${position}-${candidate.id}`}
                                    className={cn(
                                    "flex flex-col items-center justify-center space-y-3 rounded-lg border p-4 cursor-pointer transition-all duration-300 text-center",
                                    "hover:bg-primary/10",
                                     isSelected && "ring-2 ring-primary border-primary bg-primary/20",
                                     isDisabled && "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                                    {iconMap[candidate.icon as keyof typeof iconMap] || (
                                        <User className="h-6 w-6 text-primary" />
                                    )}
                                    </div>
                                    <div className="flex-grow">
                                    <p className="font-semibold text-card-foreground text-sm">
                                        {candidate.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {candidate.partylist}
                                    </p>
                                    </div>
                                    <Checkbox 
                                        id={`${position}-${candidate.id}`} 
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onCheckedChange={() => handleMultiSelect(position, candidate.id)}
                                        className="h-5 w-5"
                                     />
                                </Label>
                            )
                        })}
                     </div>
                ) : (
                    <RadioGroup
                        value={selectedVotes[position] as string ?? ""}
                        onValueChange={(candidateId) => handleSingleSelect(position, candidateId)}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3"
                    >
                        {groupedCandidates[position].map((candidate) => (
                        <Label
                            key={candidate.id}
                            htmlFor={`${position}-${candidate.id}`}
                            className={cn(
                            "flex flex-col items-center justify-center space-y-3 rounded-lg border p-4 cursor-pointer transition-all duration-300 text-center",
                            "hover:bg-primary/10",
                            selectedVotes[position] === candidate.id &&
                                "ring-2 ring-primary border-primary bg-primary/20"
                            )}
                        >
                            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                            {iconMap[candidate.icon as keyof typeof iconMap] || (
                                <User className="h-6 w-6 text-primary" />
                            )}
                            </div>
                            <div className="flex-grow">
                            <p className="font-semibold text-card-foreground text-sm">
                                {candidate.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {candidate.partylist}
                            </p>
                            </div>
                            <RadioGroupItem value={candidate.id} id={`${position}-${candidate.id}`} className="h-5 w-5" />
                        </Label>
                        ))}
                    </RadioGroup>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
      <Button
        onClick={onVote}
        disabled={isVoteDisabled}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        Cast Your Vote
      </Button>
    </div>
  );
}
