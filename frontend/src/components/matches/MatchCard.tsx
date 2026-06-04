import { Link } from "react-router-dom";
import { ConnectionActions } from "../connections/ConnectionActions";
import { TagList } from "../profile/ProfileCard";
import type { StudentMatch, MatchTargetUser } from "../../types/match";

interface MatchCardProps {
  match: StudentMatch;
}

function targetUser(match: StudentMatch) {
  return typeof match.targetUser === "string" ? null : (match.targetUser as MatchTargetUser);
}

export function MatchCard({ match }: MatchCardProps) {
  const target = targetUser(match);
  const profile = target?.profile;

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{profile?.name ?? target?.displayName ?? "Student"}</h3>
          {profile && (
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.branch} · Year {profile.year} · {profile.college}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-primary">{match.matchScore}</p>
          <p className="text-xs text-muted-foreground">match</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Score label="Compatibility" value={match.compatibilityScore} />
        <Score label="Reasons" value={match.reasons.length} />
      </div>

      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
        {match.reasons.slice(0, 3).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <TagList values={[...match.sharedSkills, ...match.sharedInterests, ...match.sharedGoals].slice(0, 8)} />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {profile?._id && (
          <Link className="inline-flex text-sm font-semibold text-primary" to={`/profiles/${profile._id}`}>
            View Profile
          </Link>
        )}
      </div>
      <ConnectionActions compact userId={target?._id} />
    </article>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
