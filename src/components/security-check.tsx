
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Usb, CheckCircle, Wifi, AlertTriangle, Fingerprint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

interface SecurityCheckProps {
    onVoterVerified: (voterId: string) => void;
}

// We'll keep the port and reader in a global scope to persist them across re-renders.
let port: SerialPort | null = null;
let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;


export default function SecurityCheck({ onVoterVerified }: SecurityCheckProps) {
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "scanning" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const { toast } = useToast();

    // Cleanup function to close the port and reader
    const cleanup = async () => {
        if (reader) {
            try {
                // The reader must be cancelled before it can be released.
                await reader.cancel();
                reader.releaseLock();
            } catch (error) {
                // It's okay if cancel or releaseLock throws an error, e.g., if the port is already closed.
                console.error("Error cancelling or releasing reader lock:", error);
            } finally {
                reader = null;
            }
        }
        
        // Only try to close the port if it's open (i.e., readable is not null)
        if (port?.readable) {
            try {
                await port.close();
            } catch (error) {
                 // This can happen if the device is unplugged, which also closes the port.
                console.error("Error closing port:", error);
            }
        }
        port = null;
    };


    const listenForData = async () => {
        if (!port || !port.readable) return;
        
        setStatus("scanning");

        try {
            while (port.readable) {
                reader = port.readable.getReader();
                let receivedData = '';
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) {
                           // This happens when the reader is cancelled.
                            break;
                        }
                        const text = new TextDecoder().decode(value).trim();
                        receivedData += text;
                        // The device should send a newline character after the ID
                        if (receivedData.includes('\n')) {
                            const lines = receivedData.split('\n');
                            const voterId = lines[0].trim(); // Get the first complete line
                            if(voterId) {
                                onVoterVerified(voterId);
                                await cleanup();
                                return; // Exit after successful verification
                            }
                            // Keep any partial data for the next read
                            receivedData = lines.slice(1).join('\n'); 
                        }
                    }
                } catch (error) {
                    if (error instanceof DOMException && error.name === 'NetworkError') {
                        setErrorMessage("Device disconnected. Please reconnect and try again.");
                    } else {
                        console.error("Read error:", error);
                        setErrorMessage("An error occurred while reading from the device.");
                    }
                    setStatus("error");
                    break; // Exit the listening loop on error
                } finally {
                     if (reader) {
                        reader.releaseLock();
                        reader = null;
                    }
                }
            }
        } catch(e) {
             console.error("Outer listen loop error:", e);
             setStatus("error");
             setErrorMessage("Device connection lost.");
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
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            
            setStatus("connected");
            toast({
                title: "Device Connected",
                description: "The ESP32 security device has been connected successfully.",
            });
            
            // Give the "Connected" message a moment to display before scanning
            setTimeout(() => {
                listenForData();
            }, 1500);
            
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
        cleanup();
    }
    
    // Cleanup on component unmount
    useEffect(() => {
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
