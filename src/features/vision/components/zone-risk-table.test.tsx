import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ZoneRiskTable } from "@/features/vision/components/zone-risk-table";
import { useUiStore } from "@/stores/ui-store";
import { ZONE_MAP } from "@/lib/stadium/zones";

describe("ZoneRiskTable keyboard accessibility", () => {
  beforeEach(() => useUiStore.getState().setSelectedZone(null));

  it("renders each zone row as a focusable button control", () => {
    render(<ZoneRiskTable />);
    const rows = screen.getAllByRole("button");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row).toHaveAttribute("tabindex", "0");
  });

  it("selects a zone when a row is activated with Enter", () => {
    render(<ZoneRiskTable />);
    const row = screen.getAllByRole("button")[0];
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    const selected = useUiStore.getState().selectedZoneId;
    expect(selected).not.toBeNull();
    expect(ZONE_MAP[selected!]).toBeDefined();
  });

  it("selects a zone with the Space key", () => {
    render(<ZoneRiskTable />);
    const row = screen.getAllByRole("button")[1];
    fireEvent.keyDown(row, { key: " " });
    expect(useUiStore.getState().selectedZoneId).not.toBeNull();
  });

  it("reflects the selection via aria-pressed", () => {
    render(<ZoneRiskTable />);
    const row = screen.getAllByRole("button")[0];
    fireEvent.keyDown(row, { key: "Enter" });
    expect(row).toHaveAttribute("aria-pressed", "true");
  });
});
