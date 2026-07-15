import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/shared/stat-card";

describe("StatCard", () => {
  it("renders its label, value and unit", () => {
    render(<StatCard label="Pressure" value={62} unit="/100" />);
    expect(screen.getByText("Pressure")).toBeInTheDocument();
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("shows a delta alongside a trend", () => {
    render(<StatCard label="Attendance" value="60,000" trend="up" delta="+2%" />);
    expect(screen.getByText("+2%")).toBeInTheDocument();
  });
});
