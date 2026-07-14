import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pulse-aurora" />
      <div className="glass-strong relative z-10 max-w-md rounded-lg p-8 text-center">
        <span className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-[hsl(var(--primary))]">
          <Compass className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This route isn&apos;t part of the PULSE console.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Back to command</Button>
        </Link>
      </div>
    </div>
  );
}
