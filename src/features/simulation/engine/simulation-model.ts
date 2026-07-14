import type {
  MatchEvent,
  MatchPhase,
  Snapshot,
  Weather,
  ZoneTelemetry,
} from "@/lib/schemas/domain";
import { ZONES, ZONE_MAP } from "@/lib/stadium/zones";
import {
  APP,
  MATCH_SECONDS_PER_TICK,
  HALF_SECONDS,
  FULL_MATCH_SECONDS,
  PREMATCH_TICKS,
  HALFTIME_TICKS,
  densityToRisk,
} from "@/lib/constants";
import { clamp, createRng, uid } from "@/lib/utils";
import type { ScenarioId } from "@/stores/simulation-store";
import type { TickResult } from "./types";
import { makeIncident, makeReuniteCase } from "./factories";

interface ZoneState {
  density: number;
  prevDensity: number;
  surge: number; // transient additive load, decays each tick
}

const TEAMS = { home: "FC Meridian", away: "Atlas United" };

/**
 * Deterministic, event-driven crowd simulation. One instance drives the whole
 * console. Kept framework-agnostic — the React layer only calls `tick()` and
 * applies the returned {@link TickResult}. This is the adapter a real CV /
 * ticketing feed would replace in production.
 */
export class SimulationModel {
  private rng: () => number;
  private tickIndex = 0;
  private clock = 0; // match seconds
  private halftimeTicksLeft = 0;
  private phase: MatchPhase = "pre-match";
  private attendance = Math.round(APP.capacity * 0.32);
  private weather: Weather = { tempC: 19, condition: "clear", windKph: 12 };
  private zones = new Map<string, ZoneState>();
  private goals = { home: 0, away: 0 };
  private kickedOff = false;

  constructor(seed = 20260714) {
    this.rng = createRng(seed);
    for (const z of ZONES) {
      const base = this.baseTarget(z.id, "pre-match");
      this.zones.set(z.id, { density: base, prevDensity: base, surge: 0 });
    }
  }

  /** Target density (%) for a zone under a given phase. */
  private baseTarget(zoneId: string, phase: MatchPhase): number {
    const zone = ZONE_MAP[zoneId];
    if (!zone) return 0;
    const arriving = phase === "pre-match";
    const playing = phase === "first-half" || phase === "second-half";
    const halftime = phase === "halftime";
    const leaving = phase === "full-time";

    switch (zone.kind) {
      case "gate":
        if (arriving) return 62;
        if (leaving) return 74;
        return 16;
      case "stand":
        if (arriving) return 46;
        if (playing) return 82;
        if (halftime) return 54;
        if (leaving) return 30;
        return 40;
      case "concourse":
        if (arriving) return 48;
        if (playing) return 34;
        if (halftime) return 82;
        if (leaving) return 76;
        return 40;
      case "facility":
        if (zoneId === "facility-medical") return 12;
        if (arriving) return 58;
        if (halftime) return 84;
        if (playing) return 30;
        if (leaving) return 40;
        return 40;
      case "pitch":
        return 4;
      default:
        return 30;
    }
  }

  private advancePhase(): MatchEvent[] {
    const events: MatchEvent[] = [];
    const minute = Math.floor(this.clock / 60);

    if (this.phase === "pre-match") {
      if (this.tickIndex >= PREMATCH_TICKS && !this.kickedOff) {
        this.phase = "first-half";
        this.kickedOff = true;
        this.clock = 0;
        events.push(this.event("kickoff", "Kick-off — the match is underway.", 0));
      }
      return events;
    }

    if (this.phase === "first-half") {
      this.clock += MATCH_SECONDS_PER_TICK;
      if (this.clock >= HALF_SECONDS) {
        this.clock = HALF_SECONDS;
        this.phase = "halftime";
        this.halftimeTicksLeft = HALFTIME_TICKS;
        events.push(this.event("halftime", "Half-time whistle. Concourses filling.", 45));
      }
      return events;
    }

    if (this.phase === "halftime") {
      this.halftimeTicksLeft -= 1;
      if (this.halftimeTicksLeft <= 0) {
        this.phase = "second-half";
        events.push(
          this.event("second-half", "Second half is under way.", 45),
        );
      }
      return events;
    }

    if (this.phase === "second-half") {
      this.clock += MATCH_SECONDS_PER_TICK;
      if (this.clock >= FULL_MATCH_SECONDS) {
        this.clock = FULL_MATCH_SECONDS;
        this.phase = "full-time";
        events.push(
          this.event(
            "fulltime",
            `Full-time — ${TEAMS.home} ${this.goals.home} : ${this.goals.away} ${TEAMS.away}. Egress beginning.`,
            90,
          ),
        );
      }
      return events;
    }

    // full-time — stays; minute pinned at 90
    void minute;
    return events;
  }

  private event(
    type: MatchEvent["type"],
    description: string,
    minute?: number,
    team?: string,
  ): MatchEvent {
    return {
      id: uid("evt"),
      t: Date.now(),
      minute: minute ?? Math.min(90, Math.floor(this.clock / 60)),
      type,
      team,
      description,
    };
  }

  private isPlaying() {
    return this.phase === "first-half" || this.phase === "second-half";
  }

  private applySurge(zoneId: string, magnitude: number) {
    const z = this.zones.get(zoneId);
    if (z) z.surge = Math.min(60, z.surge + magnitude);
  }

  private surgeConcourses(magnitude: number) {
    for (const z of ZONES) {
      if (z.kind === "concourse") this.applySurge(z.id, magnitude);
    }
  }

  private randomEvents(): MatchEvent[] {
    const events: MatchEvent[] = [];
    if (!this.isPlaying()) return events;

    // Goals ~3.5% per tick
    if (this.rng() < 0.035) {
      const home = this.rng() < 0.5;
      events.push(...this.scoreGoal(home ? "home" : "away"));
    }
    // Cards ~2.5% per tick
    if (this.rng() < 0.025) {
      const team = this.rng() < 0.5 ? TEAMS.home : TEAMS.away;
      events.push(this.event("card", `Yellow card shown to a ${team} player.`, undefined, team));
    }
    // Announcements ~1.5%
    if (this.rng() < 0.015) {
      events.push(
        this.event(
          "announcement",
          "Stadium announcement: please keep gangways clear.",
        ),
      );
    }
    return events;
  }

  private scoreGoal(side: "home" | "away"): MatchEvent[] {
    this.goals[side] += 1;
    const team = side === "home" ? TEAMS.home : TEAMS.away;
    this.surgeConcourses(20);
    // Celebrations push stands briefly too
    for (const z of ZONES) if (z.kind === "stand") this.applySurge(z.id, 8);
    return [
      this.event(
        "goal",
        `GOAL! ${team} score — ${TEAMS.home} ${this.goals.home}:${this.goals.away} ${TEAMS.away}.`,
        undefined,
        team,
      ),
    ];
  }

  /** Apply a queued operator scenario. Returns any generated events. */
  private applyScenario(id: ScenarioId, result: TickResult): void {
    const rng = this.rng;
    switch (id) {
      case "goal-home":
        result.matchEvents.push(...this.scoreGoal("home"));
        break;
      case "goal-away":
        result.matchEvents.push(...this.scoreGoal("away"));
        break;
      case "halftime-surge":
        for (const z of ZONES) {
          if (z.kind === "concourse") this.applySurge(z.id, 26);
          if (z.id === "facility-food") this.applySurge(z.id, 30);
        }
        result.matchEvents.push(
          this.event("announcement", "Half-time rush — concourses and food court filling rapidly."),
        );
        break;
      case "medical":
        result.incidents.push(makeIncident(rng, "medical"));
        break;
      case "security":
        result.incidents.push(makeIncident(rng, "security"));
        break;
      case "lost-child": {
        const rc = makeReuniteCase(rng);
        result.reuniteCases.push(rc);
        result.incidents.push(
          makeIncident(rng, "lost-child", rc.descriptor.lastSeenZoneId),
        );
        break;
      }
      case "gate-crush": {
        const gate = ZONES.filter((z) => z.kind === "gate")[
          Math.floor(rng() * 4)
        ];
        this.applySurge(gate.id, 55);
        this.applySurge(
          ZONE_MAP[gate.id].neighbors[0] ?? gate.id,
          25,
        );
        result.incidents.push(makeIncident(rng, "crowd", gate.id));
        break;
      }
      case "weather-turn":
        this.weather = {
          tempC: Math.max(9, this.weather.tempC - 5),
          condition: "storm",
          windKph: 42,
        };
        result.matchEvents.push(
          this.event("announcement", "Weather warning: storm front moving over the stadium."),
        );
        break;
    }
  }

  private ambientIncidents(result: TickResult) {
    if (!this.isPlaying() && this.phase !== "full-time") return;
    // Higher chance where density is critical (crowd incidents)
    for (const z of ZONES) {
      const st = this.zones.get(z.id);
      if (!st) continue;
      if (st.density >= 90 && this.rng() < 0.03) {
        result.incidents.push(makeIncident(this.rng, "crowd", z.id));
      }
    }
    // Rare ambient medical / infra
    if (this.rng() < 0.02) result.incidents.push(makeIncident(this.rng, "medical"));
    if (this.rng() < 0.012)
      result.incidents.push(makeIncident(this.rng, "infrastructure"));
  }

  private updateAttendance() {
    const target =
      this.phase === "pre-match"
        ? APP.capacity * (0.34 + this.tickIndex * 0.14)
        : this.phase === "full-time"
          ? APP.capacity * 0.25
          : APP.capacity * 0.985;
    this.attendance = Math.round(
      clamp(this.attendance + (target - this.attendance) * 0.35, 0, APP.capacity),
    );
  }

  private updateWeather() {
    if (this.weather.condition === "storm") return;
    if (this.rng() < 0.04) {
      const conditions: Weather["condition"][] = [
        "clear",
        "clear",
        "cloudy",
        "cloudy",
        "wind",
        "rain",
      ];
      this.weather = {
        tempC: clamp(this.weather.tempC + (this.rng() - 0.5) * 1.5, 8, 26),
        condition: conditions[Math.floor(this.rng() * conditions.length)],
        windKph: clamp(this.weather.windKph + (this.rng() - 0.5) * 6, 4, 40),
      };
    }
  }

  private buildTelemetry(): ZoneTelemetry[] {
    const t = Date.now();
    return ZONES.map((z) => {
      const st = this.zones.get(z.id)!;
      const target = this.baseTarget(z.id, this.phase);
      // Ease current toward target, add surge, add small noise.
      const noise = (this.rng() - 0.5) * 4;
      const next = clamp(
        st.density + (target - st.density) * 0.22 + st.surge * 0.5 + noise,
        0,
        135,
      );
      st.prevDensity = st.density;
      st.density = next;
      st.surge *= 0.6; // decay surge

      const delta = st.density - st.prevDensity;
      const trend =
        delta > 1.5 ? "rising" : delta < -1.5 ? "falling" : "steady";

      return {
        zoneId: z.id,
        t,
        density: next,
        occupancy: Math.round((next / 100) * z.capacity),
        inflow: clamp(8 + delta + this.rng() * 6, 0, 60),
        outflow: clamp(8 - delta + this.rng() * 6, 0, 60),
        queueLength:
          z.kind === "gate" && this.phase === "pre-match"
            ? Math.round((next / 100) * 60)
            : z.kind === "gate" && this.phase === "full-time"
              ? Math.round((next / 100) * 40)
              : 0,
        risk: densityToRisk(next),
        trend,
      };
    });
  }

  private buildSnapshot(telemetry: ZoneTelemetry[]): Snapshot {
    const avgDensity =
      telemetry
        .filter((r) => ZONE_MAP[r.zoneId]?.kind !== "pitch")
        .reduce((sum, r) => sum + r.density, 0) /
      (telemetry.length - 1 || 1);

    // Pressure = weighted blend of avg density, peak density and crowd flow.
    const peak = Math.max(...telemetry.map((r) => r.density));
    const pressureIndex = clamp(avgDensity * 0.6 + peak * 0.4, 0, 100);

    return {
      t: Date.now(),
      matchClock: this.clock,
      phase: this.phase,
      attendance: this.attendance,
      capacity: APP.capacity,
      pressureIndex,
      avgDensity,
      weather: this.weather,
    };
  }

  tick(scenarioQueue: ScenarioId[]): TickResult {
    this.tickIndex += 1;

    const result: TickResult = {
      snapshot: {} as Snapshot,
      telemetry: [],
      matchEvents: [],
      stewards: undefined,
      incidents: [],
      reuniteCases: [],
      notifications: [],
    };

    // 1. Phase progression + scheduled events
    result.matchEvents.push(...this.advancePhase());

    // 2. Operator scenarios
    for (const s of scenarioQueue) this.applyScenario(s, result);

    // 3. Random match events
    result.matchEvents.push(...this.randomEvents());

    // 4. World updates
    this.updateAttendance();
    this.updateWeather();

    // 5. Telemetry + snapshot
    result.telemetry = this.buildTelemetry();
    result.snapshot = this.buildSnapshot(result.telemetry);

    // 6. Ambient incidents (density-driven)
    this.ambientIncidents(result);

    // 7. Notifications for notable events
    for (const e of result.matchEvents) {
      if (e.type === "goal") {
        result.notifications.push({
          kind: "forecast",
          title: e.description,
          detail: "Expect a celebration surge across the concourses.",
        });
      }
    }
    for (const inc of result.incidents) {
      result.notifications.push({
        kind: inc.type === "lost-child" ? "reunite" : "incident",
        title: `New ${inc.type.replace("-", " ")} incident`,
        detail: `${inc.title} · ${ZONE_MAP[inc.zoneId]?.name}`,
      });
    }

    return result;
  }
}
