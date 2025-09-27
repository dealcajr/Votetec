
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Usb, CheckCircle, Wifi, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

interface SecurityCheckProps {
    onDeviceConnected: () => void;
}

export default function SecurityCheck({ onDeviceConnected }: SecurityCheckProps) {
    const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const { toast } = useToast();

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
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            
            // You can add logic here to listen for data from the device
            // For now, we'll just assume connection is successful.
            
            setStatus("connected");
            toast({
                title: "Device Connected",
                description: "The ESP32 security device has been connected successfully.",
            });
            setTimeout(onDeviceConnected, 1500); // Wait a bit before proceeding
            
        } catch (error) {
            let message = "Failed to connect to the device.";
            if (error instanceof Error) {
                if(error.name === 'NotFoundError') {
                    message = "No device was selected. Please choose a device from the list.";
                } else {
                    message = error.message;
                }
            }
            setErrorMessage(message);
            setStatus("error");
            toast({
                title: "Connection Failed",
                description: message,
                variant: "destructive",
            });
        }
    };

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
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
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
                        <p className="text-muted-foreground">Proceeding to voter verification...</p>
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
                        <Button onClick={() => setStatus('idle')}>
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
