
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Usb, CheckCircle, Wifi, AlertTriangle, Fingerprint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

interface SecurityCheckProps {
    onVoterVerified: (voterId: string) => void;
}

export default function SecurityCheck({ onVoterVerified }: SecurityCheckProps) {
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "scanning" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const { toast } = useToast();

    // Use refs to hold port, reader, and state to avoid issues with stale closures
    const portRef = useRef<SerialPort | null>(null);
    const keepReadingRef = useRef(true);
    const isCleaningUpRef = useRef(false);

    const cleanup = async () => {
        if (isCleaningUpRef.current) return;
        isCleaningUpRef.current = true;
        
        keepReadingRef.current = false;
        
        const port = portRef.current;
        if (!port) {
            isCleaningUpRef.current = false;
            return;
        }

        // The reader is automatically released when the port is closed.
        // Explicitly canceling can sometimes help speed up the process.
        if (port.readable && port.readable.locked) {
            try {
                await port.readable.getReader().cancel();
            } catch (error) {
                // Ignore errors, as we are closing anyway
            }
        }
        
        try {
            await port.close();
        } catch (error) {
            // Ignore errors if the port is already closing or closed.
            if (!(error instanceof DOMException && error.name === 'InvalidStateError')) {
                console.error("Error closing port:", error);
            }
        }
        
        portRef.current = null;
        isCleaningUpRef.current = false;
    };


    const listenForData = async () => {
        const port = portRef.current;
        if (!port || !port.readable) return;
        
        setStatus("scanning");
        keepReadingRef.current = true;
        const textDecoder = new TextDecoder();
        
        while (port.readable && keepReadingRef.current) {
            const reader = port.readable.getReader();
            let buffer = '';
            try {
                while (keepReadingRef.current) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    
                    buffer += textDecoder.decode(value, { stream: true });
                    
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, newlineIndex).trim();
                        buffer = buffer.slice(newlineIndex + 1);

                        // Clean non-printable characters and trim whitespace
                        const cleanedVoterId = line.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();

                        if (cleanedVoterId) {
                            onVoterVerified(cleanedVoterId);
                            // No need to call cleanup here, the component will unmount and trigger it.
                            return; 
                        }
                    }
                }
            } catch (error) {
                 if (!keepReadingRef.current) {
                    // This error is expected if we're intentionally cleaning up
                    break;
                }
                if (error instanceof DOMException && error.name === 'NetworkError') {
                    setErrorMessage("Device disconnected. Please reconnect and try again.");
                } else {
                    console.error("Read error:", error);
                    setErrorMessage("An error occurred while reading from the device.");
                }
                setStatus("error");
                break;
            } finally {
                try {
                    reader.releaseLock();
                } catch (e) {
                   // Reader might already be released, ignore
                }
            }
        }
         // If we exit the loop because of an error, ensure cleanup happens
        if (status !== 'error') {
            await cleanup();
        }
    };
    
    const handleConnect = async () => {
        if (!("serial" in navigator)) {
            setErrorMessage("Web Serial API is not supported in this browser. Please use a compatible browser like Chrome or Edge.");
            setStatus("error");
            toast({
                title: "Browser Not Supported",
                description: "Web Serial API is not supported in this browser.",
                variant: "destructive",
            });
            return;
        }

        setStatus("connecting");
        try {
            // @ts-ignore
            portRef.current = await navigator.serial.requestPort();
            await portRef.current.open({ baudRate: 9600 });
            
            setStatus("connected");
            toast({
                title: "Device Connected",
                description: "The ESP32 security device has been connected successfully.",
            });
            
            setTimeout(() => {
                listenForData();
            }, 1000);
            
        } catch (error) {
            let message = "Failed to connect to the device.";
            if (error instanceof Error) {
                if(error.name === 'NotFoundError') {
                    message = "No device was selected. Please choose a device from the list.";
                } else if (error.name === 'InvalidStateError') {
                    message = "The device is already in use. Please close other connections.";
                }
                else {
                    message = error.message;
                }
            }
            setErrorMessage(message);
            setStatus("error");
            await cleanup();
        }
    };

    const handleRetry = () => {
        setStatus('idle');
        setErrorMessage('');
        cleanup(); // Ensure everything is reset before trying again
    }
    
    useEffect(() => {
        // This is a cleanup function that runs when the component unmounts
        return () => {
            cleanup();
        };
    }, []);

    const renderContent = () => {
        switch (status) {
            case "idle":
                return (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6 text-center"
                    >
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Security Device Check
                            </h2>
                            <p className="text-muted-foreground">
                                Please connect the ESP32 security device to continue.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Usb className="h-20 w-20 text-primary/30" />
                        </div>
                        <Button onClick={handleConnect} size="lg">
                            <Wifi className="mr-2" /> Connect to Device
                        </Button>
                    </motion.div>
                );
            case "connecting":
                return (
                     <motion.div
                        key="connecting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-4 text-center"
                    >
                        <Loader2 className="animate-spin h-16 w-16 text-primary" />
                        <h2 className="text-xl font-semibold">Connecting...</h2>
                        <p className="text-muted-foreground">Please select the device from the browser prompt.</p>
                    </motion.div>
                );
            case "connected":
                 return (
                    <motion.div
                        key="connected"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4 text-center"
                    >
                        <CheckCircle className="h-20 w-20 text-accent animate-scale-in"/>
                        <h2 className="text-2xl font-semibold">Device Connected!</h2>
                        <p className="text-muted-foreground">Preparing for fingerprint scan...</p>
                    </motion.div>
                );
            case "scanning":
                 return (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6 text-center"
                    >
                        <div className="space-y-2">
                             <h2 className="text-2xl font-semibold tracking-tight">
                                Awaiting Scan
                            </h2>
                            <p className="text-muted-foreground">
                                Please place your finger on the scanner.
                            </p>
                        </div>
                        <div className="flex justify-center items-center h-40">
                             <Fingerprint className="h-24 w-24 text-primary/80 animate-pulse" />
                        </div>
                    </motion.div>
                 );
            case "error":
                 return (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6 text-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <AlertTriangle className="h-20 w-20 text-destructive animate-scale-in" />
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight text-destructive">
                                    Connection Failed
                                </h2>
                                <p className="text-muted-foreground max-w-xs">{errorMessage}</p>
                            </div>
                        </div>
                        <Button onClick={handleRetry}>
                            Try Again
                        </Button>
                    </motion.div>
                );
        }
    }

    return (
        <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
        </div>
    );
}
