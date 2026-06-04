import { Link } from "react-router-dom";
import { TagList } from "../profile/ProfileCard";
import type { Project } from "../../types/project";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.members.length}/{project.maxMembers} members
          </p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
          {project.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description}</p>
      <TagList values={project.requiredSkills.slice(0, 6)} />
      <Link className="mt-5 inline-flex text-sm font-semibold text-primary" to={`/projects/${project._id}`}>
        View project
      </Link>
    </article>
  );
}

