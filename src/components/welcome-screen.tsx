
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, AlertTriangle, Loader2, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { SelectedVotes } from "./vote-app";
import { postLog } from "./vote-app";
import { useRouter } from "next/navigation";

interface Voter {
  id: string;
  name: string;
  grade: string;
  track: string;
  strand: string;
}

interface WelcomeScreenProps {
  voterId: string;
  onStart: () => void;
  onReset: () => void;
  votes: Record<string, SelectedVotes>;
}

export default function WelcomeScreen({ voterId, onStart, onReset, votes }: WelcomeScreenProps) {
  const [status, setStatus] = useState<"loading" | "verified" | "alreadyVoted" | "notFound" | "admin" >("loading");
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setStatus("loading");

    const verifyVoter = async () => {
      try {
        if (voterId === 'VOTER-001') {
          postLog('Admin access initiated by VOTER-001.', 'INFO');
          setStatus('admin');
          return;
        }

        const res = await fetch('/api/voters');
        if (!res.ok) {
          throw new Error('Could not fetch voter list');
        }
        const allVoters: Voter[] = await res.json();
        
        const voter = allVoters.find((v: Voter) => v.id === voterId);
        
        if (voter) {
            setCurrentVoter(voter);
            if (votes[voter.id]) {
                postLog(`Scan check: Voter ${voterId} (${voter.name}) has already voted.`, 'ERROR');
                setStatus("alreadyVoted");
            } else {
                postLog(`Scan check: Voter ${voterId} (${voter.name}) verified successfully.`, 'SUCCESS');
                setStatus("verified");
            }
        } 
        else {
            postLog(`Scan check: Failed to find voter with ID ${voterId}.`, 'ERROR');
            setStatus("notFound");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        toast({
            title: "Error",
            description: "Could not load voter list.",
            variant: "destructive",
        });
        postLog(`Scan check: Failed to fetch voter list to verify ID ${voterId}. Error: ${errorMessage}`, 'ERROR');
        setStatus("notFound");
      }
    };
    
    verifyVoter();

  }, [voterId, votes, toast]);


  const handleProceed = () => {
    if(currentVoter) {
        onStart();
    }
  };
  
  const handleGoToAdmin = () => {
    router.push("/admin/login");
  };
  
  const voter = currentVoter;

  return (
    <div className="animate-fade-in w-full max-w-sm text-center">
      <AnimatePresence mode="wait">
        {status === "loading" && (
            <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 text-center"
            >
                <Loader2 className="animate-spin h-16 w-16 text-primary" />
                <h2 className="text-xl font-semibold">Verifying Voter...</h2>
                <p className="text-muted-foreground">Checking database for ID: {voterId}</p>
            </motion.div>
        )}
        
        {status === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
             <div className="flex flex-col items-center space-y-4">
              <KeyRound className="h-20 w-20 text-primary animate-scale-in" />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Admin Access
                </h2>
                <p className="text-muted-foreground">Welcome, Administrator.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
               <Button onClick={handleGoToAdmin} className="w-full" size="lg">
                 Go to Admin Login
               </Button>
               <Button onClick={onReset} variant="outline" className="w-full">
                 Scan Another Fingerprint
               </Button>
            </div>
          </motion.div>
        )}

        {status === "verified" && voter && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-20 w-20 text-accent animate-scale-in" />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Verification Complete
                </h2>
                <p className="text-muted-foreground">Welcome, {voter.name}!</p>
              </div>
            </div>

            <Card className="text-left bg-muted/50">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <User className="w-6 h-6 text-primary" />
                <CardTitle className="text-lg">Voter Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{voter.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voter ID:</span>
                  <span className="font-medium">{voter.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade:</span>
                  <span className="font-medium">{voter.grade}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Track:</span>
                  <span className="font-medium">{voter.track}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strand:</span>
                  <span className="font-medium">{voter.strand}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleProceed} className="w-full" size="lg">
              Proceed to Vote
            </Button>
          </motion.div>
        )}

        {(status === "alreadyVoted" || status === "notFound") && (
          <motion.div
            key="errorStatus"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center space-y-4">
                <AlertTriangle className="h-20 w-20 text-destructive animate-scale-in" />
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-destructive">
                      {status === 'alreadyVoted' ? 'Already Voted' : 'Voter Not Found'}
                    </h2>
                    <p className="text-muted-foreground">
                      {status === 'alreadyVoted' && voter ?
                        <>Our records show that <strong className="text-primary/90">{voter.name}</strong> (ID: {voter.id}) has already cast a vote.</> :
                        <>No match found for voter with ID <strong className="text-primary/90">{voterId}</strong>.</>
                      }
                    </p>
                </div>
            </div>
             <Button onClick={onReset} variant="outline" className="w-full">
              Scan Another Fingerprint
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

    