import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TagList } from "../components/profile/ProfileCard";
import { ConnectionActions } from "../components/connections/ConnectionActions";
import { getProfileById } from "../services/profileApi";
import type { StudentProfile } from "../types/profile";

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

export function ProfileDetailPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!id) {
        return;
      }

      setStatus("loading");
      try {
        const response = await getProfileById(id);
        setProfile(response.profile);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile");
        setStatus("error");
      }
    }

    void loadProfile();
  }, [id]);

  if (status === "loading") {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Loading profile...</main>;
  }

  if (status === "error" || !profile) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-700">{error ?? "Profile not found"}</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link className="text-sm font-semibold text-primary" to="/profiles">
        Back to profiles
      </Link>
      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-semibold">{profile.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.branch} · Year {profile.year} · {profile.college}
            </p>
            {profile.location && <p className="mt-1 text-sm text-muted-foreground">{profile.location}</p>}
          </div>
          <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium capitalize text-muted-foreground">{profile.availability}</span>
        </div>

        {profile.headline && <p className="mt-6 text-lg font-medium">{profile.headline}</p>}
        {profile.bio && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{profile.bio}</p>}

        <ProfileSection title="Skills" values={profile.skills} />
        <ProfileSection title="Interests" values={profile.interests} />
        <ProfileSection title="Goals" values={profile.goals} />
        <ProfileSection title="Achievements" values={profile.achievements} />

        <div className="mt-8 flex flex-wrap gap-3">
          {GITHUB_PROFILE_REGEX.test(profile.github) && <ExternalLinkButton label="GitHub" href={profile.github} />}
          {LINKEDIN_PROFILE_REGEX.test(profile.linkedin) && <ExternalLinkButton label="LinkedIn" href={profile.linkedin} />}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Links open in a new tab so you can return here anytime.</p>
        <ConnectionActions userId={typeof profile.user === "string" ? profile.user : profile.user._id} />
      </section>

      {profile.projects.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-semibold">Projects</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {profile.projects.map((project) => (
              <article className="rounded-lg border border-border bg-card p-5" key={`${project.title}-${project.description}`}>
                <h3 className="font-semibold">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>
                <TagList values={project.skills} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.links.filter(isSafeExternalUrl).map((link) => (
                    <ExternalLinkButton href={link} key={link} label="Portfolio" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ProfileSection({ title, values }: { title: string; values: string[] }) {
  if (!values.length) {
    return null;
  }

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
