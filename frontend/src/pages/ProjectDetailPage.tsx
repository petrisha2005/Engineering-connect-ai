import { Check, ExternalLink, Send, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TagList } from "../components/profile/ProfileCard";
import { Button } from "../components/ui/Button";
import { applyToProject, decideProjectApplication, getProjectById } from "../services/projectApi";
import { useAuthStore } from "../store/authStore";
import type { AppUser } from "../types/auth";
import type { Project, ProjectApplication } from "../types/project";

function userId(user: string | AppUser) {
  return typeof user === "string" ? user : user._id;
}

function userName(user: string | AppUser) {
  return typeof user === "string" ? "Student" : user.displayName;
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [rolePreference, setRolePreference] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const isOwner = useMemo(() => Boolean(project && currentUser && userId(project.owner) === currentUser._id), [project, currentUser]);

  async function loadProject(projectId: string) {
    setStatus("loading");
    setError(null);
    try {
      const response = await getProjectById(projectId);
      setProject(response.project);
      setApplications(response.applications);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (id) void loadProject(id);
  }, [id]);

  async function handleApply(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    setActionError(null);
    try {
      await applyToProject(id, { message, rolePreference });
      setMessage("");
      setRolePreference("");
      await loadProject(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to apply");
    }
  }

  async function handleDecision(applicationId: string, decision: "accepted" | "rejected") {
    if (!id) return;
    setActionError(null);
    try {
      const response = await decideProjectApplication(id, applicationId, { decision, role: "Member" });
      setProject(response.project);
      await loadProject(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update application");
    }
  }

  if (status === "loading") {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Loading project...</main>;
  }

  if (status === "error" || !project) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-700">{error ?? "Project not found"}</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link className="text-sm font-semibold text-primary" to="/projects">
        Back to projects
      </Link>
      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-semibold">{project.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Owned by {userName(project.owner)} · {project.members.length}/{project.maxMembers} members
            </p>
          </div>
          <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium capitalize text-muted-foreground">{project.status.replace("_", " ")}</span>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">{project.description}</p>
        <ProfileBlock title="Required skills" values={project.requiredSkills} />
        <ProfileBlock title="Interests" values={project.interests} />
        <div className="mt-6 flex flex-wrap gap-3">
          {project.repositoryUrl && <ExternalLinkButton href={project.repositoryUrl} label="Repository" />}
          {project.demoUrl && <ExternalLinkButton href={project.demoUrl} label="Demo" />}
        </div>
      </section>

      {!isOwner && project.status === "open" && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Apply to join</h2>
          <form className="mt-5 space-y-4" onSubmit={handleApply}>
            <label className="block text-sm font-medium">
              Role preference
              <input
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                value={rolePreference}
                onChange={(event) => setRolePreference(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Message
              <textarea
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
            </label>
            {actionError && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
            <Button>
              <Send size={17} />
              Apply
            </Button>
          </form>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Members</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {project.members.map((member) => (
            <div className="rounded-md border border-border p-3" key={`${userId(member.user)}-${member.role}`}>
              <p className="font-medium">{userName(member.user)}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {isOwner && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Applications</h2>
          {applications.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No applications yet.</p>}
          <div className="mt-4 space-y-3">
            {applications.map((application) => (
              <article className="rounded-md border border-border p-4" key={application._id}>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="font-medium">{userName(application.applicant)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{application.message}</p>
                    {application.rolePreference && <p className="mt-2 text-sm">Role: {application.rolePreference}</p>}
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">{application.status}</span>
                </div>
                {application.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button className="h-9 px-3" onClick={() => handleDecision(application._id, "accepted")}>
                      <Check size={16} />
                      Accept
                    </Button>
                    <Button className="h-9 bg-muted px-3 text-foreground" onClick={() => handleDecision(application._id, "rejected")}>
                      <X size={16} />
                      Reject
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ProfileBlock({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-7">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <TagList values={values} />
    </div>
  );
}

function ExternalLinkButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-foreground"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ExternalLink size={16} />
      {label}
    </a>
  );
}
