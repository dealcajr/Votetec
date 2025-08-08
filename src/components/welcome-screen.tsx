"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Fingerprint,
  Loader2,
  AlertTriangle,
  Camera,
  CheckCircle,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Voter } from "@/types/voter";
import type { Candidate } from "@/types/candidate";
import { verifyVoter, VerifyVoterOutput } from "@/ai/flows/vote-flow";

interface WelcomeScreenProps {
  onVerificationComplete: (
    voter: Voter,
    candidates: Candidate[]
  ) => void;
}

type VerificationStep = "start" | "camera" | "verifying" | "verified";

export default function WelcomeScreen({
  onVerificationComplete,
}: WelcomeScreenProps) {
  const [step, setStep] = useState<VerificationStep>("start");
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<VerifyVoterOutput | null>(
    null
  );
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (step === "camera") {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          setHasCameraPermission(false);
          setError(
            "Camera access denied. Please enable camera permissions in your browser settings."
          );
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description:
              "Please enable camera permissions to verify your identity.",
          });
          setStep("start");
        }
      };
      getCameraPermission();
    } else {
      // Stop camera stream when not in camera step
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [step, toast]);

  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoDataUri = canvas.toDataURL("image/jpeg");

    setStep("verifying");
    setError(null);

    try {
      const result = await verifyVoter({ photoDataUri });
      if (result.voter) {
        setVerifiedData(result);
        setStep("verified");
      } else {
        throw new Error("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification failed:", err);
      setError(
        err.message || "An unexpected error occurred during verification."
      );
      setStep("camera");
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description:
          "Could not verify your identity. Please ensure your face is clear and well-lit.",
      });
    }
  };

  const renderContent = () => {
    switch (step) {
      case "start":
        return (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-center"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Identity Verification
              </h2>
              <p className="text-muted-foreground">
                Please use your device's camera to verify your identity.
              </p>
            </div>
            <div className="flex justify-center items-center h-48">
              <Button
                variant="ghost"
                className="h-40 w-40 rounded-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all duration-300"
                onClick={() => setStep("camera")}
              >
                <Fingerprint className="h-16 w-16 text-primary/80" />
                <span className="text-muted-foreground">Start Verification</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-4">
              Your vote is anonymous and secure.
            </p>
          </motion.div>
        );

      case "camera":
        return (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-4"
          >
            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleCaptureAndVerify}
              disabled={hasCameraPermission !== true}
              className="w-full"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Capture and Verify
            </Button>
          </motion.div>
        );

      case "verifying":
        return (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">
              Verifying your identity...
            </p>
          </motion.div>
        );

      case "verified":
        if (!verifiedData || !verifiedData.voter)
          return <div>Error</div>;
        return (
          <motion.div
            key="verified"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 w-full text-center"
          >
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-20 w-20 text-accent animate-scale-in" />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Verification Complete
                </h2>
                <p className="text-muted-foreground">
                  Welcome, {verifiedData.voter.name}!
                </p>
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
                  <span className="font-medium">{verifiedData.voter.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voter ID:</span>
                  <span className="font-medium">{verifiedData.voter.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade:</span>
                  <span className="font-medium">
                    {verifiedData.voter.grade}
                  </span>
                </div>
                {verifiedData.voter.track && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Track:</span>
                    <span className="font-medium">
                      {verifiedData.voter.track}
                    </span>
                  </div>
                )}
                {verifiedData.voter.strand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strand:</span>
                    <span className="font-medium">
                      {verifiedData.voter.strand}
                    </span>
                  </div>
                )}
                 {verifiedData.voter.section && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section:</span>
                    <span className="font-medium">
                      {verifiedData.voter.section}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={() =>
                onVerificationComplete(
                  verifiedData.voter!,
                  verifiedData.candidates!
                )
              }
              className="w-full"
              size="lg"
            >
              Proceed to Vote
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-sm">
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
    </div>
  );
}
