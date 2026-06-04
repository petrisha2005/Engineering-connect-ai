import { Link } from "react-router-dom";
import { ConnectionActions } from "../connections/ConnectionActions";
import type { StudentProfile } from "../../types/profile";

interface ProfileCardProps {
  profile: StudentProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{profile.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.branch} · Year {profile.year} · {profile.college}
          </p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
          {profile.availability}
        </span>
      </div>
      {profile.headline && <p className="mt-4 text-sm leading-6">{profile.headline}</p>}
      <TagList values={profile.skills.slice(0, 6)} />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link className="inline-flex text-sm font-semibold text-primary" to={`/profiles/${profile._id}`}>
          View Profile
        </Link>
      </div>
      <ConnectionActions compact userId={typeof profile.user === "string" ? profile.user : profile.user._id} />
    </article>
  );
}

export function TagList({ values }: { values: string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {values.map((value) => (
        <span className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}
