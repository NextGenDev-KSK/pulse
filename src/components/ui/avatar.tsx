import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  className,
  color,
}: {
  name: string;
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground",
        className,
      )}
      style={{
        background:
          color ??
          "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
