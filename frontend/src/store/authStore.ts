import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signOut,
  type User as FirebaseUser
} from "firebase/auth";
import { create } from "zustand";
import { createBackendSession, createGoogleBackendSession, getCurrentUser } from "../services/authApi";
import { firebaseAuth, googleProvider, isFirebaseConfigured } from "../services/firebase";
import type { AppUser } from "../types/auth";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";
let authUnsubscribe: (() => void) | null = null;
let isCompletingGoogleRedirect = false;

function createRandomValue() {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
}

function getGoogleRedirectPayload() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const idToken = params.get("id_token");
  const state = params.get("state");

  if (!idToken) {
    return null;
  }

  return { idToken, state };
}

function clearGoogleRedirectPayload() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

function getGoogleOAuthUrl() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const configuredRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error("Google OAuth client ID is missing. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.");
  }

  const redirectUri = configuredRedirectUri || `${window.location.origin}/login`;
  const state = createRandomValue();
  const nonce = createRandomValue();
  sessionStorage.setItem("engineerconnect-google-oauth-state", state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "id_token",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account"
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function completeGoogleRedirect() {
  const payload = getGoogleRedirectPayload();

  if (!payload || !firebaseAuth) {
    return null;
  }

  const expectedState = sessionStorage.getItem("engineerconnect-google-oauth-state");
  sessionStorage.removeItem("engineerconnect-google-oauth-state");

  if (expectedState && payload.state !== expectedState) {
    throw new Error("Google sign-in state check failed. Please try again.");
  }

  isCompletingGoogleRedirect = true;
  clearGoogleRedirectPayload();

  const response = await createGoogleBackendSession(payload.idToken);

  if (!response.firebaseToken) {
    throw new Error("Backend did not return a Firebase session token.");
  }

  if (response.token) {
    localStorage.setItem("engineerconnect-backend-token", response.token);
  }

  const result = await signInWithCustomToken(firebaseAuth, response.firebaseToken);

  isCompletingGoogleRedirect = false;
  return { firebaseUser: result.user, user: response.user };
}

async function syncBackendSession(firebaseUser: FirebaseUser) {
  await firebaseUser.getIdToken(true);
  const response = await createBackendSession();
  if (response.token) {
    localStorage.setItem("engineerconnect-backend-token", response.token);
  }
  return response.user;
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: AppUser | null;
  status: AuthStatus;
  error: string | null;
  initialized: boolean;
  initialize: () => () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  status: "idle",
  error: null,
  initialized: false,

  initialize: () => {
    if (authUnsubscribe) {
      return authUnsubscribe;
    }

    set({ status: "loading" });

    if (!firebaseAuth || !isFirebaseConfigured) {
      set({
        firebaseUser: null,
        user: null,
        status: "unauthenticated",
        initialized: true,
        error: "Firebase environment variables are missing. Add frontend/.env to enable Google login."
      });
      return () => undefined;
    }

    const auth = firebaseAuth;

    void setPersistence(auth, browserLocalPersistence)
      .then(() => completeGoogleRedirect())
      .then((result) => {
        if (!result) {
          return;
        }

        console.info("auth:google-redirect-success", { email: result.firebaseUser.email });
        set({
          firebaseUser: result.firebaseUser,
          user: result.user,
          status: "authenticated",
          initialized: true,
          error: null
        });
      })
      .catch((error) => {
        isCompletingGoogleRedirect = false;
        console.error("auth:persistence-failed", error);
        set({
          firebaseUser: null,
          user: null,
          status: "unauthenticated",
          initialized: true,
          error: error instanceof Error ? error.message : "Unable to complete Google sign-in"
        });
      });

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isCompletingGoogleRedirect) {
        return;
      }

      console.info("auth:onAuthStateChanged", {
        hasFirebaseUser: Boolean(firebaseUser),
        route: window.location.pathname
      });

      if (!firebaseUser) {
        set({
          firebaseUser: null,
          user: null,
          status: "unauthenticated",
          initialized: true,
          error: null
        });
        return;
      }

      set({ firebaseUser, status: "loading", error: null });

      try {
        const user = await syncBackendSession(firebaseUser);
        console.info("auth:backend-sync-ok", { userId: user._id, route: window.location.pathname });
        set({ user, status: "authenticated", initialized: true });
      } catch (error) {
        console.error("auth:backend-sync-failed", error);
        localStorage.removeItem("engineerconnect-backend-token");
        await signOut(auth).catch(() => undefined);
        set({
          firebaseUser: null,
          user: null,
          status: "unauthenticated",
          initialized: true,
          error: error instanceof Error ? error.message : "Unable to sync login with the backend. Please try again."
        });
      }
    });

    return authUnsubscribe;
  },

  signInWithGoogle: async () => {
    set({ status: "loading", error: null });

    try {
      if (!firebaseAuth || !isFirebaseConfigured) {
        throw new Error("Firebase environment variables are missing. Add frontend/.env to enable Google login.");
      }

      localStorage.removeItem("engineerconnect-backend-token");
      await setPersistence(firebaseAuth, browserLocalPersistence);
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
      window.location.assign(getGoogleOAuthUrl());
    } catch (error) {
      localStorage.removeItem("engineerconnect-backend-token");
      set({
        user: null,
        status: "unauthenticated",
        error: error instanceof Error ? error.message : "Google login failed"
      });
      throw error;
    }
  },

  signInWithGoogleCredential: async (idToken: string) => {
    set({ status: "loading", error: null });

    try {
      if (!firebaseAuth || !isFirebaseConfigured) {
        throw new Error("Firebase environment variables are missing. Add frontend/.env to enable Google login.");
      }

      await setPersistence(firebaseAuth, browserLocalPersistence);
      const response = await createGoogleBackendSession(idToken);

      if (!response.firebaseToken) {
        throw new Error("Backend did not return a Firebase session token.");
      }

      if (response.token) {
        localStorage.setItem("engineerconnect-backend-token", response.token);
      }

      const result = await signInWithCustomToken(firebaseAuth, response.firebaseToken);
      set({ firebaseUser: result.user, user: response.user, status: "authenticated", initialized: true, error: null });
    } catch (error) {
      localStorage.removeItem("engineerconnect-backend-token");
      set({
        user: null,
        status: "unauthenticated",
        error: error instanceof Error ? error.message : "Google login failed"
      });
      throw error;
    }
  },

  refreshUser: async () => {
    if (!firebaseAuth) {
      set({ user: null, status: "unauthenticated" });
      return;
    }

    if (!firebaseAuth.currentUser) {
      set({ user: null, status: "unauthenticated" });
      return;
    }

    const { user, token } = await getCurrentUser();
    if (token) {
      localStorage.setItem("engineerconnect-backend-token", token);
    }
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    localStorage.removeItem("engineerconnect-backend-token");

    if (!firebaseAuth) {
      set({ firebaseUser: null, user: null, status: "unauthenticated", error: null });
      return;
    }

    await signOut(firebaseAuth);
    set({ firebaseUser: null, user: null, status: "unauthenticated", error: null });
  }
}));

export function authSnapshot() {
  return useAuthStore.getState();
}
