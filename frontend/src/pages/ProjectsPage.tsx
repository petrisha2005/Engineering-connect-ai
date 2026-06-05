import { Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApplicationStatusChart } from "../components/charts/ApplicationStatusChart";
import { ChartCard } from "../components/charts/ChartCard";
import { ProjectTeamProgress } from "../components/charts/ProjectTeamProgress";
import { ProjectCard } from "../components/projects/ProjectCard";
import { Button } from "../components/ui/Button";
import { getProjectsAnalytics } from "../services/analyticsApi";
import { useProjectStore } from "../store/projectStore";
import type { ProjectsAnalytics } from "../types/analytics";

export function ProjectsPage() {
  const { projects, status, error, loadProjects } = useProjectStore();
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [analytics, setAnalytics] = useState<ProjectsAnalytics | null>(null);

  useEffect(() => {
    void loadProjects({ status: "open" });
    void getProjectsAnalytics().then(setAnalytics).catch(() => setAnalytics(null));
  }, [loadProjects]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    void loadProjects({ q: query, skill, status: "open" });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Project marketplace</p>
          <h1 className="mt-2 text-3xl font-semibold">Find real student projects</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse MongoDB-backed projects, apply to teams, and recruit members around skills and interests.
          </p>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" to="/projects/new">
          Create project
        </Link>
      </div>

      <form className="mb-8 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_260px_auto]" onSubmit={handleSearch}>
        <input
          className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          placeholder="Search projects"
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
      {status === "loading" && <p className="text-sm text-muted-foreground">Loading projects...</p>}
      {status === "ready" && projects.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No open projects found.</p>
      )}
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Applications On Your Projects" description="Status of applications received by projects you own.">
          <ApplicationStatusChart counts={analytics?.applicationStats ?? { pending: 0, accepted: 0, rejected: 0 }} />
        </ChartCard>
        <ChartCard title="Team Completion" description="How close your projects are to their target team size.">
          <ProjectTeamProgress items={analytics?.teamCompletionStats ?? []} />
        </ChartCard>
      </section>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </section>
    </main>
  );
}
