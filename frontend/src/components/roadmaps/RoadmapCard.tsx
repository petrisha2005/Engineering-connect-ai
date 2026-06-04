import { Link } from "react-router-dom";
import type { Roadmap } from "../../types/roadmap";

export function RoadmapCard({ roadmap }: { roadmap: Roadmap }) {
  const phases = roadmap.phases || roadmap.learningPath || [];
  const projects = roadmap.recommendedProjects?.length ? roadmap.recommendedProjects : (roadmap.projects || []).map((title) => ({ title }));

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{roadmap.careerGoal || roadmap.desiredCareer}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{new Date(roadmap.createdAt).toLocaleDateString()}</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{roadmap.difficulty || "Intermediate"}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{roadmap.overview || "Career roadmap generated from your goal."}</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric label="Skills" value={(roadmap.skills || []).length} />
        <Metric label="Projects" value={projects.length} />
        <Metric label="Phases" value={phases.length} />
      </div>
      <Link className="mt-5 inline-flex text-sm font-semibold text-primary" to={`/roadmaps/${roadmap._id}`}>
        View roadmap
      </Link>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
