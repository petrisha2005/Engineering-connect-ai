import { Link } from "react-router-dom";
import { TagList } from "../profile/ProfileCard";
import type { HackathonTeam } from "../../types/hackathonTeam";

export function HackathonTeamCard({ team }: { team: HackathonTeam }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{team.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {team.hackathonName} · {team.members.length}/{team.maxMembers} members
          </p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">{team.status}</span>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{team.description}</p>
      <TagList values={team.skillsNeeded.slice(0, 6)} />
      <Link className="mt-5 inline-flex text-sm font-semibold text-primary" to={`/hackathons/${team._id}`}>
        View team
      </Link>
    </article>
  );
}

