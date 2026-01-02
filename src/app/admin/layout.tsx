
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Bot, LayoutDashboard, Lock, Settings, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AdminSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigation = (path: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-sidebar-border shadow-sm",
        "group-data-[collapsed=icon]:w-[4.5rem]"
      )}
    >
      <SidebarHeader className="h-14">
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="size-5" />
            </div>
            <span className="text-lg font-semibold text-foreground group-data-[collapsed=icon]:hidden">
                Admin
            </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/admin/assistant"
              isActive={pathname.startsWith("/admin/assistant")}
              onClick={() => handleNavigation("/admin/assistant")}
              tooltip={{
                children: "AI Assistant",
              }}
            >
              <Bot />
              <span>AI Assistant</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="/admin/dashboard"
              isActive={pathname.startsWith("/admin/dashboard")}
              onClick={() => handleNavigation("/admin/dashboard")}
              tooltip={{
                children: "Dashboard",
              }}
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem("admin-auth") === "true";
      if (!isAuthenticated) {
        router.replace("/admin/login");
      } else {
        setIsVerified(true);
      }
    } catch (e) {
      router.replace("/admin/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading || !isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Lock className="h-12 w-12 text-primary/50 mb-4 animate-pulse" />
        <h1 className="text-xl font-semibold text-muted-foreground">
          Verifying access...
        </h1>
        <div className="w-full max-w-4xl mt-8 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
