
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppSettings } from "@/app/api/settings/route";
import { Save } from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const themeSchema = z.object({
    background: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
    foreground: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
    primary: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
    accent: z.string().regex(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/, "Must be a valid HSL string 'H S% L%'"),
});

const settingsSchema = z.object({
  appName: z.string().min(1, "App Name is required"),
  appDescription: z.string(),
  theme: themeSchema,
});

type SettingsFormData = z.infer<typeof settingsSchema>;

function HSLColorPicker({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    const [h, s, l] = value.split(" ").map(v => parseInt(v));

    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(`${e.target.value} ${s}% ${l}%`);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: `hsl(${value})` }}></div>
            <Input type="range" min="0" max="360" value={h} onChange={handleHueChange} className="w-full" />
        </div>
    );
}

function GeneralSettingsTab({ control, errors, watch, isSaving }: { control: any, errors: any, watch: any, isSaving: boolean }) {
  const { theme } = useTheme();
  const currentTheme = watch("theme");

   const previewStyle = theme === 'dark' ? {
    backgroundColor: `hsl(var(--background-dark))`,
    color: `hsl(var(--foreground-dark))`,
  } : {
    backgroundColor: `hsl(${currentTheme.background})`,
    color: `hsl(${currentTheme.foreground})`,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interface Settings</CardTitle>
        <CardDescription>
          Customize the appearance and text of the main voting application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Controller
                name="appName"
                control={control}
                render={({ field }) => <Input {...field} id="appName" disabled={isSaving} />}
              />
              {errors.appName && <p className="text-sm text-destructive mt-1">{errors.appName.message}</p>}
            </div>
            <div>
              <Label htmlFor="appDescription">App Description</Label>
              <Controller
                name="appDescription"
                control={control}
                render={({ field }) => <Textarea {...field} id="appDescription" disabled={isSaving} />}
              />
              {errors.appDescription && <p className="text-sm text-destructive mt-1">{errors.appDescription.message}</p>}
            </div>
            <div>
              <Label>Primary Color</Label>
              <Controller
                name="theme.primary"
                control={control}
                render={({ field }) => <HSLColorPicker {...field} />}
              />
              {errors.theme?.primary && <p className="text-sm text-destructive mt-1">{errors.theme.primary.message}</p>}
            </div>
            <div>
              <Label>Accent Color</Label>
              <Controller
                name="theme.accent"
                control={control}
                render={({ field }) => <HSLColorPicker {...field} />}
              />
              {errors.theme?.accent && <p className="text-sm text-destructive mt-1">{errors.theme.accent.message}</p>}
            </div>
            <div>
              <Label>Light Theme Background</Label>
              <Controller
                name="theme.background"
                control={control}
                render={({ field }) => <HSLColorPicker {...field} />}
              />
              {errors.theme?.background && <p className="text-sm text-destructive mt-1">{errors.theme.background.message}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <Label>Live Preview</Label>
            <div className="rounded-lg border p-6 text-center" style={previewStyle}>
              <h2 className="text-2xl font-bold" style={{ color: `hsl(${currentTheme.primary})` }}>
                {watch("appName") || "App Name"}
              </h2>
              <p className="text-sm">{watch("appDescription") || "App Description"}</p>
              <div className="mt-6 flex justify-center gap-4">
                <Button style={{ backgroundColor: `hsl(${currentTheme.primary})`, color: 'hsl(var(--primary-foreground))' }}>Primary Button</Button>
                <Button style={{ backgroundColor: `hsl(${currentTheme.accent})`, color: 'hsl(var(--accent-foreground))' }}>Accent Button</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: "",
      appDescription: "",
      theme: {
        background: "0 0% 100%",
        foreground: "240 10% 3.9%",
        primary: "216 100% 74%",
        accent: "120 60% 45%",
      }
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data: AppSettings = await res.json();
        reset(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save settings");
      }

      toast({
        title: "Settings Saved!",
        description: "Your changes have been saved. The page will now reload to apply them.",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground mb-8">Configure system-wide settings for the application.</p>
        <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="general">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <GeneralSettingsTab control={control} errors={errors} watch={watch} isSaving={isSaving} />
                </TabsContent>
                <TabsContent value="security">
                    <Card>
                        <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Security settings will be configured here.</p></CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="network">
                     <Card>
                        <CardHeader><CardTitle>Network Settings</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Network settings will be configured here.</p></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <div className="mt-8">
                <Button type="submit" disabled={isSaving}>
                    <Save className="mr-2"/>
                    {isSaving ? "Saving..." : "Save All Settings"}
                </Button>
            </div>
        </form>
    </div>
  );
}
