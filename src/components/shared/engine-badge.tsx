import { Sparkles, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_MODEL_PUBLIC } from "@/lib/ai/model-name";

/** Shows whether a decision came from Gemini or the offline heuristic engine. */
export function EngineBadge({
  engine,
  latencyMs,
  className,
}: {
  engine: "gemini" | "heuristic";
  latencyMs?: number;
  className?: string;
}) {
  const isGemini = engine === "gemini";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        isGemini
          ? "border-primary/30 bg-primary/10 text-[hsl(var(--primary))]"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
      title={
        isGemini
          ? `Reasoned by ${GEMINI_MODEL_PUBLIC}`
          : "Offline heuristic reasoning (no Gemini key configured)"
      }
    >
      {isGemini ? <Sparkles className="size-3" /> : <Cpu className="size-3" />}
      {isGemini ? "Gemini" : "Heuristic"}
      {typeof latencyMs === "number" && (
        <span className="opacity-70">· {latencyMs}ms</span>
      )}
    </span>
  );
}
