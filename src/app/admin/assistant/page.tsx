
"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUp, Plus, Sparkles } from "lucide-react";

export default function AssistantPage() {

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Morning";
        if (hour < 18) return "Afternoon";
        return "Evening";
    }

    return (
        <div className="flex h-full flex-col items-center justify-center bg-background p-4">
            <div className="flex-1"></div>
            <div className="w-full max-w-3xl flex-grow flex flex-col items-center justify-center">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">Free plan</span>
                    <Button variant="link" size="sm" className="text-sm">Upgrade</Button>
                </div>
                <div className="flex items-center gap-4 text-5xl font-bold text-foreground/80 mb-8">
                   <Sparkles className="size-12 text-amber-500" />
                   <span>{getGreeting()}, Admin</span>
                </div>
                <div className={cn(
                    "relative w-full rounded-2xl border border-border bg-muted/20 p-4 transition-all",
                    "focus-within:border-primary/50 focus-within:shadow-lg"
                    )}>
                    <Textarea
                        placeholder="How can I help you today?"
                        className="min-h-[60px] w-full resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
                    />
                    <div className="mt-2 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <Plus />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select defaultValue="gemini-pro">
                                <SelectTrigger className="w-auto border-none bg-transparent text-sm focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                                    <SelectItem value="claude-3">Claude 3</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="icon" className="h-8 w-8 bg-orange-500 hover:bg-orange-600">
                                <ArrowUp />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 text-center text-xs text-muted-foreground/50 pt-16">
                The AI can make mistakes. Consider checking important information.
            </div>
        </div>
    );
}
