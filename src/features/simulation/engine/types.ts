import type {
  Incident,
  MatchEvent,
  ReuniteCase,
  Snapshot,
  Steward,
  ZoneTelemetry,
} from "@/lib/schemas/domain";
import type { NotificationKind } from "@/stores/notification-store";

/** A single request to open an incident, emitted by the engine. */
export interface IncidentSpawn {
  incident: Incident;
}

export interface NotificationSpawn {
  kind: NotificationKind;
  title: string;
  detail: string;
}

/** The full result of advancing the simulation by one tick. */
export interface TickResult {
  snapshot: Snapshot;
  telemetry: ZoneTelemetry[];
  matchEvents: MatchEvent[];
  stewards?: Steward[];
  incidents: Incident[];
  reuniteCases: ReuniteCase[];
  notifications: NotificationSpawn[];
}
