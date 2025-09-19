"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const positions: Candidate['position'][] = [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Auditor',
    'Public Information Officer',
];

interface DisplayCandidate extends Candidate {
    voteCount: number;
    rank: number;
}

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();

  const fetchCandidatesAndVotes = async () => {
    setIsLoading(true);
    try {
      const [candidatesRes, votesRes] = await Promise.all([
        fetch("/api/candidates"),
        fetch("/api/votes"),
      ]);
      
      if (!candidatesRes.ok) throw new Error("Failed to fetch candidates");
      if (!votesRes.ok) throw new Error("Failed to fetch votes");

      const candidatesData = await candidatesRes.json();
      const votesData = await votesRes.json();

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setVotes(votesData || {});

    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatesAndVotes();
  }, []);

  const processedCandidates = useMemo<DisplayCandidate[]>(() => {
    const voteCounts = Object.values(votes).flat().reduce((acc, candidateId) => {
        acc[candidateId] = (acc[candidateId] || 0) + 1;
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

    return candidatesWithVotes.map(c => {
        const rank = groupedByPosition[c.position].findIndex(rankedC => rankedC.id === c.id) + 1;
        return { ...c, rank };
    });

  }, [candidates, votes]);


  const handleEditClick = (candidate: Candidate) => {
    setEditingCandidate({ ...candidate });
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingCandidate({
      id: `candidate-${Date.now()}`,
      name: "",
      description: "",
      icon: "User",
      position: "President", // Default position
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (candidateId: string) => {
    const originalCandidates = [...candidates];
    const updatedCandidates = candidates.filter((c) => c.id !== candidateId);
    setCandidates(updatedCandidates);

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
      setCandidates(originalCandidates);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSave = async () => {
    if (!editingCandidate) return;

    if (!editingCandidate.name || !editingCandidate.description || !editingCandidate.position) {
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

    const originalCandidates = [...candidates];
    setCandidates(updatedCandidates);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCandidates),
      });

      if (!res.ok) {
        throw new Error("Failed to save candidate");
      }

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
        setCandidates(originalCandidates);
    } finally {
        setIsSaving(false);
    }
  };

  const onFieldChange = (field: keyof Omit<Candidate, 'position'>, value: string) => {
    if (editingCandidate) {
      setEditingCandidate({ ...editingCandidate, [field]: value });
    }
  };

  const onPositionChange = (value: Candidate['position']) => {
    if (editingCandidate) {
        setEditingCandidate({ ...editingCandidate, position: value });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNewClick} disabled={isSaving}>
            <PlusCircle className="mr-2" />
            Add New Candidate
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>{candidate.description}</TableCell>
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
                <Label htmlFor="description">
                  Description
                </Label>
                <Input
                  id="description"
                  value={editingCandidate.description}
                  onChange={(e) => onFieldChange("description", e.target.value)}
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
