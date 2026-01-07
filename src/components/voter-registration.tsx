
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { postLog } from "./vote-app";
import { useRouter } from "next/navigation";

const registrationSchema = z.object({
  id: z.string().min(1, "Voter ID is required"),
  name: z.string().min(1, "Full Name is required"),
  grade: z.string().min(1, "Grade Level is required"),
  strand: z.string().min(1, "Strand/Section is required"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function VoterRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    postLog(`New voter registration attempt for ID: ${data.id}`, "INFO");
    try {
      const res = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to register voter.");
      }

      toast({
        title: "Registration Successful!",
        description: `Welcome, ${data.name}! You can now log in to vote.`,
      });
      postLog(`Voter ${data.name} (${data.id}) successfully registered.`, "SUCCESS");
      reset();
      router.push("/"); // Redirect to login page after successful registration
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      postLog(`Voter registration failed for ID ${data.id}. Error: ${errorMessage}`, "ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl animate-fade-in">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary/90">
            Voter Registration
          </CardTitle>
          <CardDescription>
            Fill out the form to create your voting account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">Voter ID (e.g., LRN)</Label>
            <Input
              id="id"
              {...register("id")}
              disabled={isSubmitting}
              placeholder="Your unique ID"
            />
            {errors.id && (
              <p className="text-sm text-destructive mt-1">{errors.id.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register("name")}
              disabled={isSubmitting}
              placeholder="e.g., Juan Dela Cruz"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">Grade Level</Label>
            <Input
              id="grade"
              {...register("grade")}
              disabled={isSubmitting}
              placeholder="e.g., 12"
            />
            {errors.grade && (
              <p className="text-sm text-destructive mt-1">{errors.grade.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="strand">Strand / Section</Label>
            <Input
              id="strand"
              {...register("strand")}
              disabled={isSubmitting}
              placeholder="e.g., STEM-A"
            />
            {errors.strand && (
              <p className="text-sm text-destructive mt-1">{errors.strand.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <UserPlus className="mr-2" />
            )}
            {isSubmitting ? "Registering..." : "Create Account"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/" className="underline text-primary hover:text-primary/80">
              Sign in here
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
