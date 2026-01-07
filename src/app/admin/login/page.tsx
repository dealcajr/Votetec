
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, LogIn, Loader2 } from "lucide-react";
import { postLog } from "@/components/vote-app";
import { AppSettings } from "@/app/api/settings/route";

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [adminPasscode, setAdminPasscode] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const settings: AppSettings = await res.json();
        setAdminPasscode(settings.adminPasscode);
      } catch (e) {
        setError("Could not load login settings. Please try again.");
      } finally {
        setIsSettingsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    postLog("Admin login attempt.", "INFO");

    // Simulate a network request
    setTimeout(() => {
      if (passcode === adminPasscode) {
        try {
          localStorage.setItem("admin-auth", "true");
          postLog("Admin login successful.", "SUCCESS");
          router.replace("/admin");
        } catch (e) {
          setError("Your browser does not support local storage. Please use a modern browser.");
          setIsLoading(false);
        }
      } else {
        postLog("Admin login failed: Invalid passcode.", "ERROR");
        setError("Invalid passcode. Please try again.");
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary/90">Admin Access</CardTitle>
            <CardDescription>Enter the passcode to manage the election.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSettingsLoading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passcode">Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || isSettingsLoading}>
              {isLoading ? "Verifying..." : "Login"}
              {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
