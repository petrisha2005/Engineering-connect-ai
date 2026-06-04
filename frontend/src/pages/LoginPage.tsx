import { Network, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const [localError, setLocalError] = useState<string | null>(null);
  const isLoading = status === "loading";

  async function handleGoogleLogin() {
    setLocalError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Unable to sign in with Google");
    }
  }

  return (
    <section className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex min-h-[48vh] flex-col justify-between bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(135deg,#0f172a,#132f34_55%,#0b3b36)] p-6 text-white lg:min-h-screen lg:p-10">
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex size-10 items-center justify-center rounded-md bg-white/14">
            <Network size={22} />
          </span>
          EngineerConnect AI
        </div>
        <div className="max-w-2xl py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm">
            <Sparkles size={16} />
            AI-powered engineering network
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Find collaborators, mentors, and career direction from one verified student profile.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
            Sign in with Google to connect your Firebase identity with a secure MongoDB-backed account.
          </p>
        </div>
        <p className="text-sm text-white/60">Built for engineering students, project teams, and campus builders.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your Google account is verified by Firebase, then matched to your EngineerConnect AI account on the backend.
          </p>

          <Button className="mt-8 w-full" disabled={isLoading} onClick={handleGoogleLogin}>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {(localError || error) && (
            <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localError ?? error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
