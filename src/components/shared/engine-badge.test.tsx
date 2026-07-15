import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EngineBadge } from "@/components/shared/engine-badge";

describe("EngineBadge", () => {
  it("labels a Gemini decision", () => {
    render(<EngineBadge engine="gemini" />);
    expect(screen.getByText("Gemini")).toBeInTheDocument();
  });

  it("labels an offline heuristic decision with an explanatory title", () => {
    render(<EngineBadge engine="heuristic" />);
    const badge = screen.getByText("Heuristic");
    expect(badge).toBeInTheDocument();
    expect(badge.closest("span")).toHaveAttribute(
      "title",
      expect.stringContaining("Offline heuristic"),
    );
  });

  it("shows latency when provided", () => {
    render(<EngineBadge engine="gemini" latencyMs={123} />);
    expect(screen.getByText(/123ms/)).toBeInTheDocument();
  });
});
