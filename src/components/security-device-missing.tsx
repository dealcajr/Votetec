import { Button } from "@/components/ui/button";
import { AlertTriangle, WifiOff } from "lucide-react";

interface SecurityDeviceMissingProps {
  onRetry: () => void;
}

export default function SecurityDeviceMissing({ onRetry }: SecurityDeviceMissingProps) {
  return (
    <div className="space-y-6 text-center flex flex-col items-center animate-fade-in">
      <div className="relative">
        <AlertTriangle className="h-24 w-24 text-destructive animate-scale-in" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-destructive">
          Security Device Missing
        </h2>
        <p className="text-muted-foreground">
          The ESP32 security device could not be detected. Please ensure it is
          connected and powered on.
        </p>
      </div>
      <div className="flex items-center space-x-2 rounded-md bg-muted p-4 w-full justify-center">
        <WifiOff className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">
          System Unsecured. Voting is disabled.
        </p>
      </div>
      <Button onClick={onRetry} variant="destructive" className="w-full">
        Retry Connection
      </Button>
    </div>
  );
}
