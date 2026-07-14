"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "./auth-store";
import { isFirebaseConfigured } from "@/lib/firebase/app";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export function LoginView() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const { signInEmail, signUpEmail, signInGoogle, signInDemo, loading } =
    useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === "signup") {
        await signUpEmail(values.name || "Operator", values.email, values.password);
      } else {
        await signInEmail(values.email, values.password);
      }
      toast({ title: "Welcome to PULSE", variant: "success" });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Authentication failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const enterDemo = () => {
    signInDemo();
    toast({
      title: "Demo mode active",
      description: "Signed in as Amara Osei, Safety Operations Director.",
      variant: "success",
    });
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pulse-aurora" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-strong relative z-10 w-full max-w-md rounded-lg p-8 shadow-2xl shadow-black/40"
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Activity className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="font-semibold text-foreground">PULSE</span>
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in to the console" : "Create an operator account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFirebaseConfigured
            ? "Use your credentials, Google, or jump straight into demo mode."
            : "No backend configured — use demo mode to explore the full console."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Amara Osei" {...register("name")} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@venue.ops"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[hsl(var(--critical))]">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-[hsl(var(--critical))]">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight />
              </>
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signInGoogle().then(() => router.push("/dashboard"))}
          >
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={enterDemo}>
            <Zap className="text-[hsl(var(--primary))]" />
            Enter demo mode
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New operator?" : "Already have access?"}{" "}
          <button
            className="font-medium text-[hsl(var(--primary))] hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
