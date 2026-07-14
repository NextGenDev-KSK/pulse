import { cn } from "@/lib/utils";

const SEV_COLOR: Record<number, string> = {
  1: "hsl(var(--calm))",
  2: "hsl(var(--busy))",
  3: "hsl(var(--busy))",
  4: "hsl(var(--crowded))",
  5: "hsl(var(--critical))",
};

export function SeverityDot({
  severity,
  className,
  pulse,
}: {
  severity: number;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
        pulse && severity >= 4 && "animate-pulse",
        className,
      )}
      style={{ background: SEV_COLOR[severity] ?? "hsl(var(--muted-foreground))" }}
      title={`Severity ${severity}`}
    >
      {severity}
    </span>
  );
}
