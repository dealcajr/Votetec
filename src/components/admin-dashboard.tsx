
"use client";

import { useState, useEffect } from "react";
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

const positions: Candidate['position'][] = [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Auditor',
    'Public Information Officer',
];
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CandidateManagement from "@/components/candidate-management";
import VoteAnalytics from "@/components/vote-analytics";
import RankingOverview from "@/components/ranking-overview";

export interface DisplayCandidate extends Candidate {
    voteCount: number;
    rank: number;
}

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
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
              <TableHead>Icon</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>{candidate.description}</TableCell>
                <TableCell>{candidate.icon}</TableCell>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingCandidate.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                  className="col-span-3"
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={editingCandidate.description}
                  onChange={(e) => onFieldChange("description", e.target.value)}
                  className="col-span-3"
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon" className="text-right">
                  Icon
                </Label>
                <Input
                  id="icon"
                  value={editingCandidate.icon}
                  onChange={(e) => onFieldChange("icon", e.target.value)}
                  className="col-span-3"
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

    