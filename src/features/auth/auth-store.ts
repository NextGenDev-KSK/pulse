"use client";

import { create } from "zustand";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase/app";
import type { AuthUser, UserRole } from "./types";

const DEMO_KEY = "pulse-demo-user";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  init: () => void;
  signInDemo: (name?: string, role?: UserRole) => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

function demoUser(name = "Amara Osei", role: UserRole = "director"): AuthUser {
  return {
    uid: "demo-" + role,
    displayName: name,
    email: `${name.split(" ")[0].toLowerCase()}@pulse.ops`,
    role,
    isDemo: true,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    // Restore a demo session if present.
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) {
        try {
          set({ user: JSON.parse(raw) as AuthUser });
        } catch {
          localStorage.removeItem(DEMO_KEY);
        }
      }
    }

    if (isFirebaseConfigured) {
      const auth = getFirebaseAuth();
      if (auth) {
        import("firebase/auth").then(({ onAuthStateChanged }) => {
          onAuthStateChanged(auth, (fbUser) => {
            if (fbUser) {
              set({
                user: {
                  uid: fbUser.uid,
                  displayName: fbUser.displayName ?? "Operator",
                  email: fbUser.email ?? "",
                  role: "director",
                  isDemo: false,
                },
              });
            } else if (!localStorage.getItem(DEMO_KEY)) {
              set({ user: null });
            }
            set({ initialized: true });
          });
        });
        return;
      }
    }
    set({ initialized: true });
  },

  signInDemo: (name, role) => {
    const user = demoUser(name, role);
    localStorage.setItem(DEMO_KEY, JSON.stringify(user));
    set({ user });
  },

  signInEmail: async (email, password) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      get().signInDemo();
      return;
    }
    set({ loading: true });
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      set({ loading: false });
    }
  },

  signUpEmail: async (name, email, password) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      get().signInDemo(name);
      return;
    }
    set({ loading: true });
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import(
        "firebase/auth"
      );
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    } finally {
      set({ loading: false });
    }
  },

  signInGoogle: async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      get().signInDemo();
      return;
    }
    set({ loading: true });
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import(
        "firebase/auth"
      );
      await signInWithPopup(auth, new GoogleAuthProvider());
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    localStorage.removeItem(DEMO_KEY);
    const auth = getFirebaseAuth();
    if (auth) {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    }
    set({ user: null });
  },
}));
