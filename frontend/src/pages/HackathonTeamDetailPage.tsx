import { Check, Send, Sparkles, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TagList } from "../components/profile/ProfileCard";
import { Button } from "../components/ui/Button";
import { acceptHackathonInvite, applyToHackathonTeam, decideHackathonApplication, getHackathonRoleSuggestions, getHackathonTeamById, inviteHackathonTeammate, rejectHackathonInvite } from "../services/hackathonTeamApi";
import { useAuthStore } from "../store/authStore";
import type { AppUser } from "../types/auth";
import type { HackathonAnalysis, HackathonApplication, HackathonTeam, RoleSuggestion } from "../types/hackathonTeam";

function userId(user: string | AppUser) {
  return typeof user === "string" ? user : user._id;
}

function userName(user: string | AppUser) {
  return typeof user === "string" ? "Student" : user.displayName;
}

export function HackathonTeamDetailPage() {
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const [team, setTeam] = useState<HackathonTeam | null>(null);
  const [applications, setApplications] = useState<HackathonApplication[]>([]);
  const [analysis, setAnalysis] = useState<HackathonAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<RoleSuggestion[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [rolePreference, setRolePreference] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "loading">("idle");
  const isOwner = useMemo(() => Boolean(team && currentUser && userId(team.owner) === currentUser._id), [team, currentUser]);
  const pendingInvite = useMemo(
    () => team?.invitedUsers?.find((invite) => currentUser && userId(invite.user) === currentUser._id && invite.status === "pending"),
    [team, currentUser]
  );

  async function loadTeam(teamId: string) {
    setStatus("loading");
    setError(null);
    try {
      const response = await getHackathonTeamById(teamId);
      setTeam(response.team);
      setApplications(response.applications);
      setAnalysis(response.analysis ?? null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load team");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (id) void loadTeam(id);
  }, [id]);

  async function handleApply(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    setActionError(null);
    try {
      await applyToHackathonTeam(id, { message, rolePreference });
      setMessage("");
      setRolePreference("");
      await loadTeam(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to apply");
    }
  }

  async function handleDecision(applicationId: string, decision: "accepted" | "rejected", role: string) {
    if (!id) return;
    setActionError(null);
    try {
      await decideHackathonApplication(id, applicationId, { decision, role });
      await loadTeam(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update application");
    }
  }

  async function handleSuggestions() {
    if (!id) return;
    setSuggestionStatus("loading");
    setActionError(null);
    try {
      const response = await getHackathonRoleSuggestions(id);
      setSuggestions(response.suggestions);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to generate suggestions");
    } finally {
      setSuggestionStatus("idle");
    }
  }

  async function handleInvite(candidateUserId: string, role: string) {
    if (!id) return;
    setActionError(null);
    try {
      await inviteHackathonTeammate(id, candidateUserId, role);
      await loadTeam(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to invite teammate");
    }
  }

  async function handleInviteDecision(decision: "accept" | "reject") {
    if (!id) return;
    setActionError(null);
    try {
      if (decision === "accept") await acceptHackathonInvite(id);
      else await rejectHackathonInvite(id);
      await loadTeam(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update invite");
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Loading team...</main>;
  if (status === "error" || !team) return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-700">{error ?? "Team not found"}</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link className="text-sm font-semibold text-primary" to="/hackathons">Back to teams</Link>
      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-semibold">{team.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{team.hackathonName} · Captain {userName(team.owner)} · {team.members.length}/{team.maxMembers} members</p>
          </div>
          <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium capitalize text-muted-foreground">{team.status}</span>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">{team.description}</p>
        {team.problemStatement && <p className="mt-4 max-w-3xl text-sm leading-6"><strong>Problem:</strong> {team.problemStatement}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          {team.theme && <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">{team.theme}</span>}
          {team.mode && <span className="rounded-md bg-muted px-2 py-1 capitalize">{team.mode}</span>}
          {team.location && <span className="rounded-md bg-muted px-2 py-1">{team.location}</span>}
          {team.deadline && <span className="rounded-md bg-muted px-2 py-1">Deadline {new Date(team.deadline).toLocaleDateString()}</span>}
        </div>
        {team.lookingFor && <p className="mt-4 max-w-3xl text-sm leading-6">{team.lookingFor}</p>}
        <Block title="Skills needed" values={team.skillsNeeded} />
      </section>

      {pendingInvite && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-xl font-semibold text-emerald-900">You are invited to this team</h2>
          <p className="mt-1 text-sm text-emerald-800">Role: {pendingInvite.role}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => handleInviteDecision("accept")}><Check size={16} />Accept invite</Button>
            <Button className="bg-white text-emerald-900 hover:bg-emerald-100" onClick={() => handleInviteDecision("reject")}><X size={16} />Reject</Button>
          </div>
        </section>
      )}

      {analysis && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">AI Team Dashboard</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Metric label="Team strength" value={`${analysis.teamStrength}%`} />
            <Metric label="Skill coverage" value={`${analysis.skillCoverage}%`} />
            <Metric label="Roles filled" value={`${analysis.roleCompletion.filled}/${analysis.roleCompletion.total}`} />
            <Metric label="Risk level" value={analysis.riskLevel} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ChartBox title="Team Skill Coverage">
              <ResponsiveContainer height={240} width="100%">
                <BarChart data={analysis.skillCoverageChart.length ? analysis.skillCoverageChart : [{ skill: "No skills", covered: 0, missing: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="covered" fill="#10b981" name="Covered" />
                  <Bar dataKey="missing" fill="#f59e0b" name="Missing" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Applicant Match Scores">
              <ResponsiveContainer height={240} width="100%">
                <BarChart data={analysis.applicantScores.length ? analysis.applicantScores : [{ applicationId: "empty", name: "No applicants", score: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Block title="Missing roles" values={analysis.missingRoles} />
            <Block title="Missing skills" values={analysis.missingSkills} />
          </div>
          {analysis.suggestedImprovements.map((item) => <p className="mt-3 text-sm text-muted-foreground" key={item}>{item}</p>)}
        </section>
      )}

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="text-xl font-semibold">Required roles</h2>
          <Button className="h-9 px-3" disabled={suggestionStatus === "loading"} onClick={handleSuggestions}>
            <Sparkles size={16} />
            {suggestionStatus === "loading" ? "Generating..." : "Role suggestions"}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {team.requiredRoles.map((role) => (
            <div className="rounded-md border border-border p-4" key={role.role}>
              <p className="font-medium">{role.role}</p>
              <TagList values={role.skills} />
            </div>
          ))}
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Suggested students</h2>
          <div className="mt-4 space-y-4">
            {suggestions.map((suggestion) => (
              <article className="rounded-md border border-border p-4" key={suggestion.role}>
                <h3 className="font-semibold">{suggestion.role}</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {suggestion.candidates.map((candidate) => (
                    <div className="rounded-md bg-muted p-3" key={`${suggestion.role}-${candidate.profile._id}`}>
                      <p className="font-medium">{candidate.profile.name}</p>
                      <p className="text-sm text-muted-foreground">{candidate.profile.branch} · Score {candidate.score}</p>
                      <TagList values={candidate.matchingSkills} />
                      {isOwner && candidate.profile.user?._id && (
                        <Button className="mt-3 h-9 px-3" onClick={() => handleInvite(candidate.profile.user._id, suggestion.role)}>
                          <Send size={15} />
                          Invite
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!isOwner && team.status === "forming" && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Apply to join</h2>
          <form className="mt-5 space-y-4" onSubmit={handleApply}>
            <label className="block text-sm font-medium">Role preference<input className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" value={rolePreference} onChange={(event) => setRolePreference(event.target.value)} /></label>
            <label className="block text-sm font-medium">Message<textarea className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
            {actionError && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
            <Button><Send size={17} />Apply</Button>
          </form>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Members</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {team.members.map((member) => (
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
                    <Button className="h-9 px-3" onClick={() => handleDecision(application._id, "accepted", application.rolePreference || "Member")}><Check size={16} />Accept</Button>
                    <Button className="h-9 bg-muted px-3 text-foreground" onClick={() => handleDecision(application._id, "rejected", application.rolePreference || "Member")}><X size={16} />Reject</Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {isOwner && Boolean(team.invitedUsers?.length) && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Pending invites</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {team.invitedUsers?.map((invite) => (
              <div className="rounded-md border border-border p-3" key={invite._id}>
                <p className="font-medium">{userName(invite.user)}</p>
                <p className="text-sm text-muted-foreground">{invite.role} · {invite.status}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Block({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return <div className="mt-7"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2><TagList values={values} /></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-muted/30 p-4"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></div>;
}

function ChartBox({ children, title }: { children: ReactNode; title: string }) {
  return <div className="rounded-lg border border-border p-4"><h3 className="font-semibold">{title}</h3><div className="mt-4">{children}</div></div>;
}
