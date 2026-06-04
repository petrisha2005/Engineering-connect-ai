import { ExternalLink, Github, Linkedin, Pencil, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProfileForm } from "../components/profile/ProfileForm";
import { Button } from "../components/ui/Button";
import { useProfileStore } from "../store/profileStore";
import type { ProfilePayload, ProfileProject, StudentProfile } from "../types/profile";

type ToastState = { type: "success" | "error"; message: string } | null;
const GITHUB_PROFILE_REGEX = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/;
const LINKEDIN_PROFILE_REGEX = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?$/;

function isSafeExternalUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidProfileLink(label: string, href?: string) {
  if (label === "GitHub") return Boolean(href && GITHUB_PROFILE_REGEX.test(href));
  if (label === "LinkedIn") return Boolean(href && LINKEDIN_PROFILE_REGEX.test(href));
  return isSafeExternalUrl(href);
}

export function ProfilePage() {
  const { profile, status, error, loadMyProfile, saveProfile } = useProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const initializedMode = useRef(false);
  const isSaving = status === "loading";

  useEffect(() => {
    void loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    if (initializedMode.current) return;

    if (status === "ready" && profile) {
      setIsEditing(false);
      initializedMode.current = true;
    }

    if (status === "missing") {
      setIsEditing(true);
      initializedMode.current = true;
    }
  }, [profile, status]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(payload: ProfilePayload) {
    try {
      await saveProfile(payload);
      await loadMyProfile();
      setIsEditing(false);
      setToast({ type: "success", message: "Profile saved successfully!" });
    } catch {
      setToast({ type: "error", message: "Failed to save profile. Please try again." });
      throw new Error("Failed to save profile. Please try again.");
    }
  }

  function handleEdit() {
    setToast(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setToast(null);
    setIsEditing(false);
  }

  const title = profile && !isEditing ? "Your profile" : profile ? "Edit your profile" : "Create your profile";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Toast toast={toast} />

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Student profile</p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This profile powers student discovery, AI matching, project recommendations, and hackathon team suggestions.
          </p>
        </div>
        {profile && !isEditing && (
          <Button onClick={handleEdit}>
            <Pencil size={17} />
            Edit Profile
          </Button>
        )}
      </div>

      {status === "error" && !isEditing && (
        <p className="mb-5 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {isEditing || !profile ? (
        <section className="rounded-lg border border-border bg-card p-6">
          <ProfileForm profile={profile} isSaving={isSaving} onCancel={profile ? handleCancel : undefined} onError={() => setToast({ type: "error", message: "Failed to save profile. Please try again." })} onSubmit={handleSubmit} />
        </section>
      ) : (
        <ProfileSummary profile={profile} />
      )}
    </main>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  const classes =
    toast.type === "success"
      ? "border-primary/30 bg-primary text-primary-foreground shadow-primary/20"
      : "border-red-200 bg-red-600 text-white shadow-red-600/20";

  return (
    <div className={`fixed right-4 top-4 z-50 rounded-lg border px-4 py-3 text-sm font-semibold shadow-xl ${classes}`}>
      {toast.message}
    </div>
  );
}

function ProfileSummary({ profile }: { profile: StudentProfile }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/35 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
              <Sparkles size={16} />
              Profile saved
            </div>
            <h2 className="mt-4 text-3xl font-semibold">{profile.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {profile.headline || `${profile.branch} student at ${profile.college}`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-64">
            <SummaryMetric label="Year" value={String(profile.year)} />
            <SummaryMetric label="Availability" value={profile.availability} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <SummaryBlock title="Academic Details">
            <InfoRow label="College" value={profile.college} />
            <InfoRow label="Branch" value={profile.branch} />
            {profile.location && <InfoRow label="Location" value={profile.location} />}
          </SummaryBlock>

          <SummaryBlock title="Career Goal">
            <ChipRow values={profile.goals} />
          </SummaryBlock>

          <SummaryBlock title="Links">
            <p className="mb-3 text-xs leading-5 text-muted-foreground">Links open in a new tab so you can return here anytime.</p>
            <div className="flex flex-wrap gap-3">
              <ProfileLink href={profile.github} icon={<Github size={16} />} label="GitHub" />
              <ProfileLink href={profile.linkedin} icon={<Linkedin size={16} />} label="LinkedIn" />
              {profile.projects
                .flatMap((project) => project.links)
                .filter(isSafeExternalUrl)
                .slice(0, 1)
                .map((link) => (
                  <ProfileLink href={link} icon={<ExternalLink size={16} />} key={link} label="Portfolio" />
                ))}
            </div>
          </SummaryBlock>
        </div>

        <div className="space-y-5">
          <SummaryBlock title="Skills">
            <ChipRow values={profile.skills} />
          </SummaryBlock>

          <SummaryBlock title="Interests">
            <ChipRow values={profile.interests} />
          </SummaryBlock>

          {profile.bio && (
            <SummaryBlock title="Bio">
              <p className="text-sm leading-7 text-muted-foreground">{profile.bio}</p>
            </SummaryBlock>
          )}

          {profile.achievements.length > 0 && (
            <SummaryBlock title="Achievements">
              <BulletList values={profile.achievements} />
            </SummaryBlock>
          )}

          {profile.projects.length > 0 && (
            <SummaryBlock title="Projects">
              <div className="space-y-3">
                {profile.projects.map((project) => (
                  <ProjectSummary project={project} key={`${project.title}-${project.description}`} />
                ))}
              </div>
            </SummaryBlock>
          )}
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

function SummaryBlock({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ProfileLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  if (!isValidProfileLink(label, href)) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}: Not added
      </span>
    );
  }

  return (
    <a className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary transition hover:bg-muted" href={href} rel="noopener noreferrer" target="_blank">
      {icon}
      {label}
      <ExternalLink size={14} />
    </a>
  );
}

function ChipRow({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

function BulletList({ values }: { values: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {values.map((value) => (
        <li className="flex gap-2" key={value}>
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          {value}
        </li>
      ))}
    </ul>
  );
}

function ProjectSummary({ project }: { project: ProfileProject }) {
  return (
    <article className="rounded-lg border border-border p-4">
      <p className="font-semibold">{project.title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.description}</p>
      {project.skills.length > 0 && <ChipRow values={project.skills} />}
    </article>
  );
}
