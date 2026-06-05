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
        <MatchRing value={match.matchScore} />
      </div>

      <div className="mt-5 grid gap-3">
        <ProgressScore label="Skill match" value={match.matchScore} />
        <ProgressScore label="Compatibility" value={match.compatibilityScore} />
        <ProgressScore label="Shared interests" value={Math.min(100, match.sharedInterests.length * 20)} />
        <ProgressScore label="Career goal match" value={Math.min(100, match.sharedGoals.length * 25)} />
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

function MatchRing({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      className="grid size-16 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#10b981 ${safeValue * 3.6}deg, #e2e8f0 0deg)` }}
      title={`${safeValue}% match`}
    >
      <div className="grid size-12 place-items-center rounded-full bg-card">
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">{safeValue}%</p>
          <p className="text-[10px] text-muted-foreground">match</p>
        </div>
      </div>
    </div>
  );
}

function ProgressScore({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
