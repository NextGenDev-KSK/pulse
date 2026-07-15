import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/auth-store";

// With no Firebase env configured, the store runs entirely in local Demo Mode.
describe("auth-store (demo mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, loading: false, initialized: false });
  });

  it("signs in a demo user and persists the session", () => {
    useAuthStore.getState().signInDemo("Alex Doe", "coordinator");
    const user = useAuthStore.getState().user;
    expect(user?.displayName).toBe("Alex Doe");
    expect(user?.role).toBe("coordinator");
    expect(user?.isDemo).toBe(true);
    expect(localStorage.getItem("pulse-demo-user")).toBeTruthy();
  });

  it("defaults the demo user to the director role", () => {
    useAuthStore.getState().signInDemo();
    expect(useAuthStore.getState().user?.role).toBe("director");
  });

  it("restores a persisted demo session on init", () => {
    useAuthStore.getState().signInDemo("Persisted User");
    // Simulate a fresh load.
    useAuthStore.setState({ user: null, initialized: false });
    useAuthStore.getState().init();
    expect(useAuthStore.getState().user?.displayName).toBe("Persisted User");
    expect(useAuthStore.getState().initialized).toBe(true);
  });

  it("falls back to a demo sign-in when email auth is unavailable", async () => {
    await useAuthStore.getState().signInEmail("a@b.com", "pw");
    expect(useAuthStore.getState().user?.isDemo).toBe(true);
  });

  it("clears the user and storage on sign out", async () => {
    useAuthStore.getState().signInDemo();
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("pulse-demo-user")).toBeNull();
  });

  it("recovers from corrupted persisted session data", () => {
    localStorage.setItem("pulse-demo-user", "{not json");
    useAuthStore.setState({ user: null, initialized: false });
    useAuthStore.getState().init();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("pulse-demo-user")).toBeNull();
  });
});
