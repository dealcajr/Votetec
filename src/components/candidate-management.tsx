
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/types/candidate";
import { PlusCircle, Edit, Trash2, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DisplayCandidate extends Candidate {
    voteCount: number;
    rank: number;
}


const positions: Candidate['position'][] = [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Auditor',
    'Public Information Officer',
];

interface CandidateManagementProps {
    initialCandidates: Candidate[];
    initialVotes: Record<string, Record<string, string>>;
    onDataChange: () => void;
}

export default function CandidateManagement({ initialCandidates, initialVotes, onDataChange }: CandidateManagementProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);


  const processedCandidatesByPartylist = useMemo<{ [key: string]: DisplayCandidate[] }>(() => {
    const voteCounts = Object.values(initialVotes).flatMap(voterVotes => Object.values(voterVotes)).reduce((acc, candidateId) => {
        if (candidateId) {
            acc[candidateId] = (acc[candidateId] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const candidatesWithVotes = candidates.map(c => ({
        ...c,
        voteCount: voteCounts[c.id] || 0,
    }));

    const groupedByPosition = candidatesWithVotes.reduce((acc, c) => {
        (acc[c.position] = acc[c.position] || []).push(c);
        return acc;
    }, {} as Record<Candidate['position'], (typeof candidatesWithVotes)>);

    for (const position in groupedByPosition) {
        groupedByPosition[position as Candidate['position']].sort((a, b) => b.voteCount - a.voteCount);
    }
    
    const candidatesWithRank = candidatesWithVotes.map(c => {
        const rank = groupedByPosition[c.position].findIndex(rankedC => rankedC.id === c.id) + 1;
        return { ...c, rank };
    });

    return candidatesWithRank.reduce((acc, candidate) => {
      const { partylist } = candidate;
      if (!acc[partylist]) {
        acc[partylist] = [];
      }
      acc[partylist].push(candidate);
      acc[partylist].sort((a,b) => positions.indexOf(a.position) - positions.indexOf(b.position));
      return acc;
    }, {} as { [key: string]: DisplayCandidate[] });

  }, [candidates, initialVotes]);


  const handleEditClick = (candidate: Candidate) => {
    setEditingCandidate({ ...candidate });
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingCandidate({
      id: `candidate-${Date.now()}`,
      name: "",
      partylist: "",
      icon: "User",
      position: "President", // Default position
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (candidateId: string) => {
    const updatedCandidates = candidates.filter((c) => c.id !== candidateId);
    
    try {
      setIsSaving(true);
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCandidates),
      });

      if (!res.ok) {
        throw new Error("Failed to delete candidate");
      }
      
      setCandidates(updatedCandidates);
      onDataChange();

      toast({
        title: "Success!",
        description: "Candidate has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSave = async () => {
    if (!editingCandidate) return;

    if (!editingCandidate.name || !editingCandidate.partylist || !editingCandidate.position) {
        toast({
            title: "Error",
            description: "Please fill out all fields.",
            variant: "destructive",
        });
        return;
    }
    
    setIsSaving(true);

    const isNew = !candidates.some(c => c.id === editingCandidate.id);
    let updatedCandidates;

    if (isNew) {
        updatedCandidates = [...candidates, editingCandidate];
    } else {
        updatedCandidates = candidates.map((c) =>
            c.id === editingCandidate.id ? editingCandidate : c
        );
    }

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCandidates),
      });

      if (!res.ok) {
        throw new Error("Failed to save candidate");
      }
      
      setCandidates(updatedCandidates);
      onDataChange();
      setIsDialogOpen(false);
      setEditingCandidate(null);
      toast({
          title: "Success!",
          description: `Candidate has been ${isNew ? 'added' : 'updated'}.`,
      });

    } catch(error) {
        toast({
            title: "Error",
            description: "Failed to save candidate. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const onFieldChange = (field: keyof Omit<Candidate, 'position' | 'id'>, value: string) => {
    if (editingCandidate) {
      setEditingCandidate({ ...editingCandidate, [field]: value });
    }
  };

  const onPositionChange = (value: Candidate['position']) => {
    if (editingCandidate) {
        setEditingCandidate({ ...editingCandidate, position: value });
    }
  };
  
  const handleResetVotes = async () => {
    setIsSaving(true);
    try {
      const [votesRes, resultsRes] = await Promise.all([
          fetch("/api/votes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}), // Sending an empty object will clear the votes
          }),
          fetch("/api/delete-results", {
              method: 'DELETE',
          })
      ]);

      if (!votesRes.ok) {
        throw new Error("Failed to reset votes");
      }
      if (!resultsRes.ok) {
        // This is not a critical failure if the file didn't exist, so just log it.
        console.warn("Could not delete final results file, it may not have existed.");
      }
      
      onDataChange();
      toast({
        title: "Success!",
        description: "All votes have been reset and the election is re-opened.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset votes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-end my-4 gap-2">
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isSaving}>
              <Trash className="mr-2" />
              Reset All Votes
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all casted votes, remove the final results file, and re-open the election.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetVotes} className="bg-destructive hover:bg-destructive/90">
                Yes, reset election
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={handleAddNewClick} disabled={isSaving}>
            <PlusCircle className="mr-2" />
            Add New Candidate
        </Button>
      </div>
      <div className="space-y-6">
        {Object.entries(processedCandidatesByPartylist).sort(([a], [b]) => a.localeCompare(b)).map(([partylist, candidates]) => (
            <Card key={partylist}>
                <CardHeader>
                    <CardTitle>{partylist}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.map((candidate) => (
                        <TableRow key={candidate.id} className={candidate.rank === 1 ? 'bg-primary/10' : ''}>
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell>{candidate.position}</TableCell>
                            <TableCell>{candidate.voteCount}</TableCell>
                            <TableCell>
                            <Badge variant={candidate.rank === 1 ? 'default' : 'secondary'}>
                                #{candidate.rank}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(candidate)}
                                disabled={isSaving}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(candidate.id)}
                                className="text-destructive hover:text-destructive"
                                disabled={isSaving}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
        {Object.keys(processedCandidatesByPartylist).length === 0 && (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No candidates have been added yet. Click "Add New Candidate" to begin.
                </CardContent>
            </Card>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isSaving && setIsDialogOpen(isOpen)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCandidate?.id.startsWith('candidate-') && !candidates.some(c => c.id === editingCandidate.id) ? "Add New Candidate" : "Edit Candidate"}</DialogTitle>
            <DialogDescription>
              Modify the candidate's details below.
            </DialogDescription>
          </DialogHeader>
          {editingCandidate && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingCandidate.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partylist">
                  Partylist Group
                </Label>
                <Input
                  id="partylist"
                  value={editingCandidate.partylist}
                  onChange={(e) => onFieldChange("partylist", e.target.value)}
                  disabled={isSaving}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="position">
                    Position
                </Label>
                 <Select
                    value={editingCandidate.position}
                    onValueChange={onPositionChange}
                    disabled={isSaving}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                        {positions.map(pos => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">
                  Icon
                </Label>
                <Input
                  id="icon"
                  value={editingCandidate.icon}
                  onChange={(e) => onFieldChange("icon", e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
