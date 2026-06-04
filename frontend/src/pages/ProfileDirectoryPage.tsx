import { Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ProfileCard } from "../components/profile/ProfileCard";
import { Button } from "../components/ui/Button";
import { listProfiles } from "../services/profileApi";
import type { StudentProfile } from "../types/profile";

export function ProfileDirectoryPage() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  async function loadProfiles(params: { q?: string; skill?: string } = {}) {
    setStatus("loading");
    setError(null);
    try {
      const response = await listProfiles({ q: params.q, skill: params.skill, limit: 24 });
      setProfiles(response.profiles);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profiles");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void loadProfiles({ q: query, skill });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Discover students</p>
        <h1 className="mt-2 text-3xl font-semibold">Profile directory</h1>
      </div>

      <form className="mb-8 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_260px_auto]" onSubmit={handleSearch}>
        <input
          className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          placeholder="Search by name, college, branch, goal..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <input
          className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          placeholder="Filter skill"
          value={skill}
          onChange={(event) => setSkill(event.target.value)}
        />
        <Button disabled={status === "loading"}>
          <Search size={17} />
          Search
        </Button>
      </form>

      {status === "error" && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {status === "loading" && <p className="text-sm text-muted-foreground">Loading profiles...</p>}
      {status === "ready" && profiles.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No matching student profiles found.</p>
      )}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <ProfileCard key={profile._id} profile={profile} />
        ))}
      </section>
    </main>
  );
}

