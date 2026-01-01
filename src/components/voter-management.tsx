
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { Badge } from "./ui/badge";

interface Voter {
  id: string;
  name: string;
  grade: string;
  track: string;
  strand: string;
}

interface VoterManagementProps {
  onDataChange: () => void;
  votes: Record<string, any>;
}

export default function VoterManagement({ onDataChange, votes }: VoterManagementProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVoters = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/voters");
      if (!res.ok) throw new Error("Failed to fetch voters");
      const data = await res.json();
      setVoters(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch voter list.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVoters();
  }, [fetchVoters]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            try {
                const newVoters = results.data as Voter[];

                if (!Array.isArray(newVoters) || !newVoters.every(v => v.id && v.name && v.grade)) {
                    throw new Error("Invalid CSV format. Expected columns: id, name, grade, track, strand.");
                }
                
                const res = await fetch('/api/voters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newVoters)
                });

                if (!res.ok) throw new Error("Failed to update voters on the server.");

                setVoters(newVoters);
                onDataChange();
                toast({
                  title: "Success!",
                  description: `Imported ${newVoters.length} voters.`,
                });

            } catch (error) {
                toast({
                  title: "Import Failed",
                  description: error instanceof Error ? error.message : "An unknown error occurred.",
                  variant: "destructive",
                });
            } finally {
                setIsProcessing(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        error: (error) => {
            toast({
              title: "Import Failed",
              description: error.message,
              variant: "destructive",
            });
            setIsProcessing(false);
        }
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveVoter = async (voterId: string) => {
    setIsProcessing(true);
    try {
        const updatedVoters = voters.filter(v => v.id !== voterId);
        
        const res = await fetch('/api/voters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedVoters)
        });

        if (!res.ok) throw new Error("Failed to remove voter on the server.");

        setVoters(updatedVoters);
        onDataChange();
        toast({
          title: "Success!",
          description: `Voter has been removed.`,
        });

    } catch (error) {
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Could not remove voter.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                 <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <>
      <div className="flex justify-end my-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv"
        />
        <Button onClick={handleImportClick} disabled={isProcessing}>
          <Upload className="mr-2" />
          {isProcessing ? "Processing..." : "Import Voters (CSV)"}
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voter ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Strand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell className="font-medium">{voter.id}</TableCell>
                <TableCell>{voter.name}</TableCell>
                <TableCell>{voter.grade}</TableCell>
                <TableCell>{voter.track}</TableCell>
                <TableCell>{voter.strand}</TableCell>
                <TableCell>
                  {votes[voter.id] ? (
                    <Badge className="bg-accent text-accent-foreground">Voted</Badge>
                  ) : (
                    <Badge variant="secondary">Not Voted</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                            variant="ghost"
                            size="icon"
                            disabled={isProcessing}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the voter "{voter.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveVoter(voter.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Yes, remove voter
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
             {voters.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        No voters found. Use the import button to add voters.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
