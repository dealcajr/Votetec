
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
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

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let newVoters: Voter[];

        if (file.type === "application/json") {
            newVoters = JSON.parse(text);
        } else {
             toast({
                title: "Invalid File Type",
                description: "Please upload a JSON file.",
                variant: "destructive",
            });
            setIsUploading(false);
            return;
        }

        // Basic validation
        if (!Array.isArray(newVoters) || !newVoters.every(v => v.id && v.name && v.grade)) {
            throw new Error("Invalid JSON format. Expected an array of voters with id, name, and grade.");
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
        setIsUploading(false);
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
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
          accept=".json"
        />
        <Button onClick={handleImportClick} disabled={isUploading}>
          <Upload className="mr-2" />
          {isUploading ? "Uploading..." : "Import Voters (JSON)"}
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
              </TableRow>
            ))}
             {voters.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
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
