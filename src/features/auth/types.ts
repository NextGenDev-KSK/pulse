export type UserRole = "director" | "coordinator" | "steward";

export interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  isDemo: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  director: "Safety Operations Director",
  coordinator: "Dispatch Coordinator",
  steward: "Field Steward",
};
