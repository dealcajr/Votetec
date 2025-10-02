
"use client";

import { Button } from "@/components/ui/button";
import { Usb, CheckCircle, Wifi, AlertTriangle, Fingerprint, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { SecurityStatus } from "./vote-app";

interface SecurityCheckProps {
    status: SecurityStatus;
    errorMessage: string;
    onConnect: () => void;
    onRetry: () => void;
}

export default function SecurityCheck({ status, errorMessage, onConnect, onRetry }: SecurityCheckProps) {

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
                        <Button onClick={onConnect} size="lg">
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
                        <Button onClick={onRetry}>
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

    