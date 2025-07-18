import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, User, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";

interface WelcomeScreenProps {
  onStart: (voterId: string) => void;
}

const seniorHighVoter = {
  id: "VOTE-SH-67890",
  name: "Alex Reyes",
  grade: "12",
  track: "Academic",
  strand: "STEM",
};

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [step, setStep] = useState<"verify" | "verified">("verify");
  const [isVerifying, setIsVerifying] = useState(false);

  const voter = seniorHighVoter;

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep("verified");
    }, 1500);
  };

  const handleProceed = () => {
    onStart(voter.id);
  };

  return (
    <div className="animate-fade-in w-full max-w-sm text-center">
      <AnimatePresence mode="wait">
        {step === "verify" && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Identity Verification
              </h2>
              <p className="text-muted-foreground">
                Please use your fingerprint to verify your identity.
              </p>
            </div>
            <div className="flex justify-center items-center h-48">
              <Button
                variant="ghost"
                className="h-40 w-40 rounded-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all duration-300"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Verifying...</span>
                  </div>
                ) : (
                  <>
                    <Fingerprint className="h-16 w-16 text-primary/80" />
                    <span className="text-muted-foreground">Tap to Scan</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-4">
              Your vote is anonymous and secure.
            </p>
          </motion.div>
        )}

        {step === "verified" && (
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
      </AnimatePresence>
    </div>
  );
}
