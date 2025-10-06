
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

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

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) {
        throw new Error("Failed to fetch logs");
      }
      const data = await res.json();
      setLogs(data);
      toast({
        title: "Logs refreshed",
        description: "Latest logs have been loaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not fetch logs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Logs</CardTitle>
        <Button onClick={fetchLogs} disabled={isLoading} variant="outline" size="icon">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Info className="h-8 w-8 mb-2" />
                <p>No logs found.</p>
                <p className="text-sm">Activity from the voting app will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-4">
                    <span className="flex-shrink-0 pt-1">
                        <LogIcon type={log.type} />
                    </span>
                    <div className="flex-grow">
                        <p className="text-sm">{log.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                             <LogBadge type={log.type} />
                            <span>{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}</span>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
