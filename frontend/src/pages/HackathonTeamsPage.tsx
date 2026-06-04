import { Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HackathonTeamCard } from "../components/hackathons/HackathonTeamCard";
import { Button } from "../components/ui/Button";
import { useHackathonTeamStore } from "../store/hackathonTeamStore";

export function HackathonTeamsPage() {
  const { teams, status, error, loadTeams } = useHackathonTeamStore();
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");

  useEffect(() => {
    void loadTeams({ status: "forming" });
  }, [loadTeams]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void loadTeams({ q: query, skill, status: "forming" });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Hackathon team builder</p>
          <h1 className="mt-2 text-3xl font-semibold">Find or form hackathon teams</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create teams, apply for roles, and generate role suggestions from real student profiles.
          </p>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" to="/hackathons/new">
          Create team
        </Link>
      </div>

      <form className="mb-8 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_260px_auto]" onSubmit={handleSearch}>
        <input className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Search teams" value={query} onChange={(event) => setQuery(event.target.value)} />
        <input className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Filter skill" value={skill} onChange={(event) => setSkill(event.target.value)} />
        <Button disabled={status === "loading"}>
          <Search size={17} />
          Search
        </Button>
      </form>

      {status === "error" && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {status === "loading" && <p className="text-sm text-muted-foreground">Loading teams...</p>}
      {status === "ready" && teams.length === 0 && <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No forming teams found.</p>}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <HackathonTeamCard key={team._id} team={team} />
        ))}
      </section>
    </main>
  );
}

