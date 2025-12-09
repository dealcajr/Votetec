
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Usb, XCircle, Send, Loader2, Plug, PlugZap } from "lucide-react";
import { Badge } from "./ui/badge";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export default function DeviceTerminal() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [output, setOutput] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef(false);
  const { toast } = useToast();

  const handleConnect = useCallback(async () => {
    if (!("serial" in navigator)) {
      setError("Web Serial API not supported. Please use a compatible browser like Chrome or Edge.");
      setStatus("error");
      return;
    }
    setStatus("connecting");
    setOutput(prev => [...prev, "Trying to connect..."]);

    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setStatus("connected");
      toast({ title: "Device Connected", description: "Serial connection established." });
      setOutput(prev => [...prev, "✅ Connection successful!"]);
      keepReadingRef.current = true;
      listenForData();
    } catch (err) {
      const message = (err instanceof Error && err.name === 'NotFoundError') ? "No device selected." : "Failed to connect.";
      setError(message);
      setStatus("error");
      setOutput(prev => [...prev, `❌ ${message}`]);
    }
  }, [toast]);

  const handleDisconnect = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
        try {
            await readerRef.current.cancel();
        } catch (err) {
            // Ignore cancel errors
        }
    }
    if (portRef.current) {
        try {
            await portRef.current.close();
        } catch (err) {
            // Ignore errors if port is already closing
        }
        portRef.current = null;
    }
    setStatus("disconnected");
    toast({ title: "Device Disconnected", description: "Serial connection has been closed." });
    setOutput(prev => [...prev, "🔌 Connection closed."]);
  }, [toast]);
  
  const listenForData = useCallback(async () => {
    if (!portRef.current?.readable) return;
    
    const textDecoder = new TextDecoder();

    while (portRef.current.readable && keepReadingRef.current) {
      readerRef.current = portRef.current.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            readerRef.current.releaseLock();
            break;
          }
          const decodedText = textDecoder.decode(value).trim();
          setOutput(prev => [...prev, `[DEVICE]: ${decodedText}`]);
        }
      } catch (err) {
        if (keepReadingRef.current) {
            setOutput(prev => [...prev, `[ERROR]: ${(err as Error).message}`]);
        }
      }
    }
  }, []);

  const handleSendCommand = async () => {
    if (!portRef.current?.writable || command.trim() === "") return;

    try {
      const writer = portRef.current.writable.getWriter();
      const textEncoder = new TextEncoder();
      await writer.write(textEncoder.encode(command + "\n"));
      writer.releaseLock();
      setOutput(prev => [...prev, `[SENT]: ${command}`]);
      setCommand("");
    } catch (err) {
      setOutput(prev => [...prev, `[ERROR]: Failed to send command: ${(err as Error).message}`]);
    }
  };
  
  useEffect(() => {
    return () => {
        if(portRef.current) {
            handleDisconnect();
        }
    }
  }, [handleDisconnect]);

  const renderStatusBadge = () => {
    switch (status) {
        case "connected":
            return <Badge className="bg-accent text-accent-foreground">Connected</Badge>;
        case "connecting":
            return <Badge variant="secondary">Connecting...</Badge>;
        case "error":
            return <Badge variant="destructive">Error</Badge>;
        case "disconnected":
        default:
            return <Badge variant="outline">Disconnected</Badge>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Device Terminal</CardTitle>
                <CardDescription>
                    Interact directly with the connected serial device.
                </CardDescription>
            </div>
            {renderStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
            {status !== "connected" ? (
                <Button onClick={handleConnect} disabled={status === "connecting"}>
                    {status === 'connecting' ? <Loader2 className="animate-spin mr-2" /> : <Plug className="mr-2"/>}
                    Connect to Device
                </Button>
            ) : (
                <Button onClick={handleDisconnect} variant="destructive">
                    <PlugZap className="mr-2"/>
                    Disconnect
                </Button>
            )}
        </div>
        
        {error && <p className="text-sm text-destructive">{error}</p>}

        <ScrollArea className="h-72 w-full rounded-md border bg-muted/20 p-4 font-mono text-sm">
          {output.map((line, index) => (
            <p key={index} className="whitespace-pre-wrap break-all">{line}</p>
          ))}
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter command..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
            disabled={status !== "connected"}
          />
          <Button onClick={handleSendCommand} disabled={status !== "connected"}>
            <Send className="mr-2" /> Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
