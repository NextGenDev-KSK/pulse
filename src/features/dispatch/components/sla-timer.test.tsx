import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlaTimer } from "@/features/dispatch/components/sla-timer";
import type { Dispatch } from "@/lib/schemas/domain";

function dispatch(over: Partial<Dispatch> = {}): Dispatch {
  return {
    id: "dsp_1",
    incidentId: "inc_1",
    stewardId: "stw-01",
    stewardName: "Priya",
    status: "on-scene",
    createdAt: 0,
    etaSeconds: 90,
    slaSeconds: 180,
    slaBreached: false,
    resolvedAt: null,
    rationale: "r",
    statusTimestamps: { assigned: 0, "en-route": 0, "on-scene": 1000 },
    ...over,
  };
}

describe("SlaTimer", () => {
  it("shows SLA met with the modelled response time when ETA is within budget", () => {
    render(<SlaTimer dispatch={dispatch({ etaSeconds: 90, slaSeconds: 180 })} />);
    expect(screen.getByText(/SLA met/)).toBeInTheDocument();
    // 90s ETA rendered as the response time, not the compressed wall-clock.
    expect(screen.getByText(/1m 30s/)).toBeInTheDocument();
  });

  it("shows SLA breached when the dispatch is flagged breached", () => {
    render(
      <SlaTimer
        dispatch={dispatch({ etaSeconds: 240, slaSeconds: 180, slaBreached: true })}
      />,
    );
    expect(screen.getByText(/SLA breached/)).toBeInTheDocument();
  });

  it("counts down while a responder is still en-route", () => {
    render(
      <SlaTimer
        dispatch={dispatch({
          status: "en-route",
          createdAt: Date.now(),
          statusTimestamps: { assigned: Date.now(), "en-route": Date.now() },
        })}
      />,
    );
    expect(screen.getByText(/left/)).toBeInTheDocument();
  });
});
