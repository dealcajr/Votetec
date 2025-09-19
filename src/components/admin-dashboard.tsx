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
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/types/candidate";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/candidates.json")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);
        setIsLoading(false);
      });
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
      icon: "User", // Default icon
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (candidateId: string) => {
    setCandidates(candidates.filter((c) => c.id !== candidateId));
  };
  
  const handleSave = async () => {
    if (!editingCandidate) return;

    if (!editingCandidate.name || !editingCandidate.description) {
        toast({
            title: "Error",
            description: "Please fill out all fields.",
            variant: "destructive",
        });
        return;
    }

    const isNew = !candidates.some(c => c.id === editingCandidate.id);
    let updatedCandidates;

    if (isNew) {
        updatedCandidates = [...candidates, editingCandidate];
    } else {
        updatedCandidates = candidates.map((c) =>
            c.id === editingCandidate.id ? editingCandidate : c
        );
    }

    setCandidates(updatedCandidates);
    setIsDialogOpen(false);
    setEditingCandidate(null);
    toast({
        title: "Success!",
        description: `Candidate has been ${isNew ? 'added' : 'updated'}.`,
    });
  };

  const onFieldChange = (field: keyof Candidate, value: string) => {
    if (editingCandidate) {
      setEditingCandidate({ ...editingCandidate, [field]: value });
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
        <Button onClick={handleAddNewClick}>
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
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(candidate.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Note: Changes are not persisted in this demo. The candidate list will reset on page refresh.
      </p>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
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
