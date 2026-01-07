
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { User, LogIn, AlertTriangle, Usb, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { postLog } from "./vote-app";

interface VoterLoginScreenProps {
  onLogin: (voterId: string) => void;
}

export default function VoterLoginScreen({ onLogin }: VoterLoginScreenProps) {
  const [voterId, setVoterId] = useState("");
  const [deviceStatus, setDeviceStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterId.trim()) {
      onLogin(voterId.trim());
    }
  };
  
  const cleanup = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
        try {
            await readerRef.current.cancel();
            readerRef.current.releaseLock();
        } catch (err) { /* Ignore cancel errors */ }
        readerRef.current = null;
    }
    if (portRef.current?.readable) {
        try {
            await portRef.current.close();
        } catch(e) { /* Ignore errors if already closing */ }
        portRef.current = null;
    }
    setDeviceStatus("disconnected");
  }, []);

  const listenForData = useCallback(async (port: SerialPort) => {
    const textDecoder = new TextDecoder();
    let receivedData = "";

    while (port.readable && keepReadingRef.current) {
      readerRef.current = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            readerRef.current.releaseLock();
            break;
          }
          receivedData += textDecoder.decode(value, { stream: true });
          if (receivedData.includes('\n')) {
              const lines = receivedData.split('\n');
              const completeLine = lines[0].trim();
              if (completeLine) {
                  postLog(`Received ID from device: ${completeLine}`, 'INFO');
                  setVoterId(completeLine);
                  // Auto-submit on receive
                  onLogin(completeLine);
                  // Clean up after successful read
                  cleanup();
                  return;
              }
              receivedData = lines.slice(1).join('\n');
          }
        }
      } catch (err) {
        if (keepReadingRef.current) {
           toast({ title: "Device Error", description: "Lost connection to the device.", variant: "destructive" });
           cleanup();
        }
        break;
      }
    }
  }, [toast, onLogin, cleanup]);


  const handleConnectDevice = useCallback(async () => {
    if (!("serial" in navigator)) {
      toast({
        title: "Unsupported Browser",
        description: "Web Serial API not supported. Please use Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }
    
    setDeviceStatus("connecting");
    postLog('Attempting to connect to smart key scanner.', 'INFO');
    
    try {
        // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setDeviceStatus("connected");
      toast({ title: "Device Connected", description: "Ready to scan ID." });
      
      keepReadingRef.current = true;
      listenForData(port);

    } catch (err) {
        const errorMessage = (err instanceof Error && err.name === 'NotFoundError') ? "No device selected." : "Failed to connect to device.";
        toast({ title: "Connection Failed", description: errorMessage, variant: "destructive"});
        setDeviceStatus("disconnected");
    }

  }, [toast, listenForData]);

  useEffect(() => {
    return () => {
        cleanup();
    }
  }, [cleanup]);

  const isInvalidLrn = voterId.length > 0 && /^\d+$/.test(voterId) && voterId.length !== 12;

  return (
    <div className="w-full max-w-md animate-fade-in mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader className="text-center p-0 pb-6">
          <h1 className="text-2xl font-bold tracking-tight">Sign in to Vote</h1>
          <CardDescription>Enter your voter ID or use a connected device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voterId" className="sr-only">Voter ID</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="voterId"
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                required
                placeholder="Enter Voter ID"
                className={cn("pl-10 h-12 text-base", isInvalidLrn && "border-destructive ring-destructive ring-1")}
              />
            </div>
            {isInvalidLrn && (
              <div className="flex items-center text-xs text-destructive px-1">
                <AlertTriangle className="h-4 w-4 mr-1" />
                LRN must be exactly 12 digits.
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
             <Button type="button" variant="outline" className="w-full h-12 text-base" onClick={handleConnectDevice} disabled={deviceStatus !== 'disconnected'}>
                {deviceStatus === 'connecting' && <Loader2 className="animate-spin mr-2" />}
                {deviceStatus === 'connected' && <Usb className="mr-2 text-accent" />}
                {deviceStatus === 'disconnected' && <Usb className="mr-2" />}
                {deviceStatus === 'connecting' ? 'Connecting...' : deviceStatus === 'connected' ? 'Device Connected' : 'Use Smart Key'}
            </Button>
            <Button type="submit" className="w-full h-12 text-base" disabled={!voterId.trim() || deviceStatus === 'connecting'}>
              <LogIn className="mr-2" />
              Continue
            </Button>
          </div>
        </CardContent>
      </form>
    </div>
  );
}
