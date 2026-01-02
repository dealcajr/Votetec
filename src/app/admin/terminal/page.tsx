"use client";
import DeviceTerminal from "@/components/device-terminal";

export default function TerminalPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Device Terminal</h1>
            <p className="text-muted-foreground mb-8">Interact directly with any connected serial device.</p>
            <DeviceTerminal />
        </div>
    );
}