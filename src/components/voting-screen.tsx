
"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@/types/candidate";
import { User, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { SelectedVotes } from "./vote-app";
import { Avatar, AvatarFallback } from "./ui/avatar";

const iconMap = {
  User: User,
  Users: Users,
};


interface VotingScreenProps {
  candidates: Candidate[];
  isLoading: boolean;
  selectedVotes: SelectedVotes;
  onSelectVote: (votes: SelectedVotes) => void;
  onVote: () => void;
  isVoteDisabled: boolean;
}

const CandidateListItem = ({ candidate, isSelected, onSelect, disabled = false }: { candidate: Candidate, isSelected: boolean, onSelect: () => void, disabled?: boolean }) => {
    const Icon = iconMap[candidate.icon as keyof typeof iconMap] || User;
    return (
        <button
            onClick={onSelect}
            disabled={disabled}
            className={cn(
                "w-full text-left p-2 rounded-lg flex items-center gap-4 transition-colors duration-200",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
                isSelected ? "bg-primary/10" : "bg-transparent",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <Avatar className="h-10 w-10">
                <AvatarFallback className={cn("bg-muted", isSelected && "bg-primary/20")}>
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <p className="font-semibold text-card-foreground">{candidate.name}</p>
                <p className="text-sm text-muted-foreground">{candidate.partylist}</p>
            </div>
            {isSelected && <Check className="h-5 w-5 text-primary" />}
        </button>
    );
};


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
          <div key={i} className="flex items-center space-x-4 p-4">
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
        <h1 className="text-2xl font-bold tracking-tight">Choose your candidates</h1>
        <p className="text-muted-foreground">
          Select one for each position, and up to two for Representatives.
        </p>
      </div>
      <Accordion type="multiple" className="w-full space-y-1" defaultValue={positions}>
        {positions.map((position) => {
          const isRepresentative = position.includes('Representative');
          const candidatesForPosition = groupedCandidates[position] || [];

          return candidatesForPosition.length > 0 && (
            <AccordionItem value={position} key={position} className="border-b">
              <AccordionTrigger className="py-3 hover:no-underline">
                <h3 className="text-md font-semibold text-foreground">{position}</h3>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                 <div className="flex flex-col gap-1">
                    {candidatesForPosition.map((candidate) => {
                        const isSelected = isRepresentative 
                            ? ((selectedVotes[position] as string[]) || []).includes(candidate.id)
                            : selectedVotes[position] === candidate.id;
                        
                        const isDisabled = isRepresentative && !isSelected && ((selectedVotes[position] as string[]) || []).length >= 2;

                        return (
                           <CandidateListItem 
                                key={candidate.id}
                                candidate={candidate}
                                isSelected={isSelected}
                                onSelect={() => isRepresentative ? handleMultiSelect(position, candidate.id) : handleSingleSelect(position, candidate.id)}
                                disabled={isDisabled}
                           />
                        )
                    })}
                 </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
      <div className="pt-4">
        <Button
          onClick={onVote}
          disabled={isVoteDisabled}
          className="w-full h-12 text-base"
        >
          Review & Cast Your Vote
        </Button>
      </div>
    </div>
  );
}
