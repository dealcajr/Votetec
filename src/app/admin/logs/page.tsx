
"use client";
import LogViewer from "@/components/log-viewer";

export default function LogsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">System Logs</h1>
            <p className="text-muted-foreground mb-8">Review a real-time feed of system events and actions.</p>
            <LogViewer />
        </div>
    );
}
