"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";

export default function AdminPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for the authentication token in localStorage
    const isAuthenticated = localStorage.getItem("admin-auth") === "true";
    if (!isAuthenticated) {
      router.replace("/admin/login");
    } else {
      setIsVerified(true);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading || !isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Lock className="h-12 w-12 text-primary/50 mb-4 animate-pulse" />
        <h1 className="text-xl font-semibold text-muted-foreground">
          Verifying access...
        </h1>
        <div className="w-full max-w-md mt-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-background min-h-screen w-full">
      <main className="container mx-auto p-4 sm:p-8 md:p-12">
        <h1 className="text-3xl font-bold text-primary/90 mb-4">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage candidates, view rankings, and analyze election results.</p>
        <AdminDashboard />
      </main>
    </div>
  );
}
