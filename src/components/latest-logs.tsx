
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface LogEntry {
  message: string;
  type: 'INFO' | 'ERROR' | 'SUCCESS';
  timestamp: string;
}

const LogIcon = ({ type }: { type: LogEntry['type'] }) => {
    switch (type) {
        case 'ERROR':
            return <AlertCircle className="h-4 w-4 text-destructive" />;
        case 'SUCCESS':
            return <CheckCircle className="h-4 w-4 text-accent" />;
        case 'INFO':
        default:
            return <Info className="h-4 w-4 text-primary" />;
    }
};

const LogBadge = ({ type }: { type: LogEntry['type'] }) => {
    switch (type) {
        case 'ERROR':
            return <Badge variant="destructive">ERROR</Badge>;
        case 'SUCCESS':
            return <Badge className="bg-accent text-accent-foreground">SUCCESS</Badge>;
        case 'INFO':
        default:
            return <Badge variant="secondary">INFO</Badge>;
    }
}

interface LatestLogsProps {
    logs: LogEntry[];
}

export default function LatestLogs({ logs }: LatestLogsProps) {
  const router = useRouter();
  const latestLogs = logs.slice(0, 10);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A brief overview of the latest system events.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 w-full pr-4">
           {latestLogs.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Info className="h-8 w-8 mb-2" />
                <p>No log activity found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 pt-1">
                        <LogIcon type={log.type} />
                    </span>
                    <div className="flex-grow">
                        <p className="text-sm leading-tight">{log.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/admin/logs')}>
            View All Logs
        </Button>
      </CardContent>
    </Card>
  );
}
