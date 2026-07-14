import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
  indicatorStyle,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
          indicatorClassName,
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...indicatorStyle }}
      />
    </div>
  );
}
