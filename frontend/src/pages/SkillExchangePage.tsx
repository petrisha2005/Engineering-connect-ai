import { BookOpen, Check, Loader2, MessageCircle, Repeat2, Send, Star, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { createOrGetConversation } from "../services/messageApi";
import {
  acceptSkillExchangeRequest,
  cancelSkillExchangeRequest,
  completeSkillExchangeRequest,
  getSkillExchangeDashboard,
  getSkillExchangeMatches,
  rejectSkillExchangeRequest,
  saveSkillExchangeProfile,
  sendSkillExchangeRequest
} from "../services/skillExchangeApi";
import { useAuthStore } from "../store/authStore";
import type { AppUser } from "../types/auth";
import type { SkillExchangeDashboard, SkillExchangeMatch, SkillExchangePayload, SkillExchangeProfile, SkillExchangeRequest } from "../types/skillExchange";

type Status = "loading" | "ready" | "error";

const emptyProfile: SkillExchangePayload = {
  teachSkills: [],
  learnSkills: [],
  experienceLevel: "beginner",
  availability: "flexible",
  preferredLearningMode: "online",
  headline: ""
};

function csvToList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function listToCsv(values: string[]) {
  return values.join(", ");
}

function asUser(value: string | AppUser) {
  return typeof value === "string" ? null : value;
}

function userName(value: string | AppUser) {
  const user = asUser(value);
  return user?.displayName || "Student";
}

function userId(value: string | AppUser) {
  return typeof value === "string" ? value : value._id;
}

export function SkillExchangePage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<SkillExchangeDashboard | null>(null);
  const [matches, setMatches] = useState<SkillExchangeMatch[]>([]);
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadAll() {
    setStatus("loading");
    setError(null);
    try {
      const [dashboardResponse, matchesResponse] = await Promise.all([getSkillExchangeDashboard(), getSkillExchangeMatches()]);
      setDashboard(dashboardResponse);
      setMatches(matchesResponse.matches ?? []);
      setEditing(!dashboardResponse.profile);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load skill exchange.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const requests = dashboard?.requests ?? [];
  async function requestExchange(match: SkillExchangeMatch) {
    setBusyId(match.profile._id);
    try {
      await sendSkillExchangeRequest(match.profile._id);
      setToast("Skill exchange request sent.");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  async function decide(requestId: string, action: "accept" | "reject" | "cancel") {
    setBusyId(requestId);
    try {
      if (action === "accept") await acceptSkillExchangeRequest(requestId);
      if (action === "reject") await rejectSkillExchangeRequest(requestId);
      if (action === "cancel") await cancelSkillExchangeRequest(requestId);
      setToast(action === "accept" ? "Exchange accepted." : action === "reject" ? "Exchange rejected." : "Exchange cancelled.");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  async function complete(requestId: string, rating: number) {
    setBusyId(requestId);
    try {
      await completeSkillExchangeRequest(requestId, rating);
      setToast("Exchange completed and rated.");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  async function openMessages(otherUserId: string) {
    setBusyId(otherUserId);
    try {
      const response = await createOrGetConversation(otherUserId);
      navigate(`/messages?conversation=${response.conversation._id}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_60%,#0f766e_100%)] p-6 text-white shadow-sm">
        <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">
          <Repeat2 size={16} />
          AI Skill Exchange Marketplace
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Teach what you know. Learn what you need.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
          Create a teach/learn profile and let AI find students where both sides benefit.
        </p>
      </section>

      {status === "loading" && <StateCard title="Loading skill exchange..." text="Fetching your profile, matches, and exchange dashboard." />}
      {status === "error" && <StateCard tone="error" title="Unable to load skill exchange" text={error ?? "Please try again."} />}

      {status === "ready" && dashboard && (
        <>
          <section className="mt-5 grid gap-4 md:grid-cols-4">
            <Metric label="Active exchanges" value={dashboard.summary.activeExchanges} />
            <Metric label="Pending requests" value={dashboard.summary.pendingRequests} />
            <Metric label="Completed" value={dashboard.summary.completedExchanges} />
            <Metric label={dashboard.summary.reputationLevel} value={dashboard.summary.reputationPoints} />
          </section>

          {editing ? (
            <SkillExchangeProfileForm
              onCancel={() => dashboard.profile && setEditing(false)}
              onSaved={async () => {
                setToast("Skill exchange profile saved.");
                await loadAll();
              }}
              profile={dashboard.profile}
            />
          ) : (
            <ProfileSummary onEdit={() => setEditing(true)} profile={dashboard.profile} />
          )}

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <ChartPanel title="Skills Taught Distribution">
              <SkillBarChart skills={dashboard.summary.skillsTaught} />
            </ChartPanel>
            <ChartPanel title="Skills Learned Distribution">
              <SkillBarChart skills={dashboard.summary.skillsLearned} />
            </ChartPanel>
            <ChartPanel title="Exchange Progress">
              <ProgressPie active={dashboard.summary.activeExchanges} completed={dashboard.summary.completedExchanges} pending={dashboard.summary.pendingRequests} />
            </ChartPanel>
            <ChartPanel title="Skill Growth Progress">
              <SkillBarChart skills={[...dashboard.summary.profileSkills, ...dashboard.summary.skillsLearned]} />
            </ChartPanel>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4">
              <SectionTitle title="AI Exchange Matches" text="Mutual teach/learn matches generated from real skill exchange profiles." />
              {dashboard.profile ? (
                matches.length ? (
                  matches.map((match) => (
                    <MatchCard busy={busyId === match.profile._id} key={match.profile._id} match={match} onRequest={() => requestExchange(match)} />
                  ))
                ) : (
                  <EmptyState title="No matches yet" text="More matches will appear as students create skill exchange profiles." />
                )
              ) : (
                <EmptyState title="Create your profile first" text="Add skills you can teach and want to learn to unlock AI matches." />
              )}
            </div>

            <div className="grid gap-4 content-start">
              <SectionTitle title="Exchange Requests" text="Accept, reject, complete, and message active partners." />
              {requests.length ? (
                requests.map((request) => (
                  <RequestCard
                    busy={busyId === request._id}
                    currentUserId={currentUser?._id}
                    key={request._id}
                    onAccept={() => decide(request._id, "accept")}
                    onCancel={() => decide(request._id, "cancel")}
                    onComplete={(rating) => complete(request._id, rating)}
                    onMessage={(id) => openMessages(id)}
                    onReject={() => decide(request._id, "reject")}
                    request={request}
                  />
                ))
              ) : (
                <EmptyState title="No exchange requests" text="Send a request from a compatible match to start learning together." />
              )}
            </div>
          </section>
        </>
      )}

      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">{toast}</div>}
    </main>
  );
}

function SkillExchangeProfileForm({ onCancel, onSaved, profile }: { onCancel: () => void; onSaved: () => Promise<void>; profile: SkillExchangeProfile | null }) {
  const [form, setForm] = useState<SkillExchangePayload>(
    profile
      ? {
          teachSkills: profile.teachSkills,
          learnSkills: profile.learnSkills,
          experienceLevel: profile.experienceLevel,
          availability: profile.availability,
          preferredLearningMode: profile.preferredLearningMode,
          headline: profile.headline ?? ""
        }
      : emptyProfile
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.teachSkills.length || !form.learnSkills.length) {
      setError("Add at least one teach skill and one learn skill.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveSkillExchangeProfile(form);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-2xl font-semibold">{profile ? "Edit Skill Exchange Profile" : "Complete Skill Exchange Profile"}</h2>
      <form className="mt-4 grid gap-4" onSubmit={submit}>
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <input className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-emerald-400" placeholder="Headline, e.g. I can teach React and want ML partners" value={form.headline ?? ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Skills I can teach *
            <input className="h-11 rounded-md border border-border px-3 text-sm font-normal outline-none focus:border-emerald-400" value={listToCsv(form.teachSkills)} onChange={(e) => setForm({ ...form, teachSkills: csvToList(e.target.value) })} placeholder="React, Node.js, UI/UX" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Skills I want to learn *
            <input className="h-11 rounded-md border border-border px-3 text-sm font-normal outline-none focus:border-emerald-400" value={listToCsv(form.learnSkills)} onChange={(e) => setForm({ ...form, learnSkills: csvToList(e.target.value) })} placeholder="Machine Learning, Deep Learning" />
          </label>
          <Select label="Experience level" value={form.experienceLevel} onChange={(value) => setForm({ ...form, experienceLevel: value as any })} options={["beginner", "intermediate", "advanced", "expert"]} />
          <Select label="Availability" value={form.availability} onChange={(value) => setForm({ ...form, availability: value as any })} options={["weekdays", "weekends", "flexible"]} />
          <Select label="Learning mode" value={form.preferredLearningMode} onChange={(value) => setForm({ ...form, preferredLearningMode: value as any })} options={["online", "in_person", "hybrid"]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={saving} type="submit">{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save profile</Button>
          {profile && <Button className="bg-muted text-foreground hover:bg-muted/80" onClick={onCancel} type="button">Cancel</Button>}
        </div>
      </form>
    </section>
  );
}

function Select({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select className="h-11 rounded-md border border-border px-3 text-sm font-normal outline-none" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
      </select>
    </label>
  );
}

function ProfileSummary({ onEdit, profile }: { onEdit: () => void; profile: SkillExchangeProfile | null }) {
  if (!profile) return null;
  return (
    <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-semibold">Your Skill Exchange Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">{profile.headline || "Ready to teach and learn with peers."}</p>
        </div>
        <Button className="bg-muted text-foreground hover:bg-muted/80" onClick={onEdit}>Edit profile</Button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ChipPanel title="Can Teach" values={profile.teachSkills} />
        <ChipPanel title="Wants To Learn" values={profile.learnSkills} />
      </div>
    </section>
  );
}

function MatchCard({ busy, match, onRequest }: { busy?: boolean; match: SkillExchangeMatch; onRequest: () => void }) {
  const user = asUser(match.profile.userId);
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{user?.displayName || "Student"}</h3>
            <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{match.matchScore}% match</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{match.compatibilityReason}</p>
        </div>
        <ScoreRing score={match.matchScore} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ChipPanel title="They Can Teach" values={match.profile.teachSkills.slice(0, 8)} />
        <ChipPanel title="They Want To Learn" values={match.profile.learnSkills.slice(0, 8)} />
      </div>
      {match.planWeeks.length ? (
        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <p className="text-sm font-semibold text-emerald-800">Suggested Learning Plan</p>
          <div className="mt-2 grid gap-2">
            {match.planWeeks.slice(0, 4).map((week) => <p className="text-sm text-emerald-900/80" key={week.week}>Week {week.week}: {week.focus}</p>)}
          </div>
        </div>
      ) : null}
      <div className="mt-4">
        {match.state === "none" ? (
          <Button disabled={busy} onClick={onRequest}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send exchange request</Button>
        ) : (
          <Button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100" disabled>{String(match.state).replace("_", " ")}</Button>
        )}
      </div>
    </article>
  );
}

function RequestCard({ busy, currentUserId, onAccept, onCancel, onComplete, onMessage, onReject, request }: { busy?: boolean; currentUserId?: string; onAccept: () => void; onCancel: () => void; onComplete: (rating: number) => void; onMessage: (id: string) => void; onReject: () => void; request: SkillExchangeRequest }) {
  const requesterId = userId(request.requester);
  const recipientId = userId(request.recipient);
  const isRequester = currentUserId === requesterId;
  const isRecipient = currentUserId === recipientId;
  const other = isRequester ? request.recipient : request.requester;
  const otherId = userId(other);
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{userName(other)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{request.matchScore}% match · {request.status}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{request.compatibilityReason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === "pending" && isRecipient && (
          <>
            <Button disabled={busy} onClick={onAccept}><Check size={16} />Accept</Button>
            <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onReject}><X size={16} />Reject</Button>
          </>
        )}
        {request.status === "pending" && isRequester && (
          <>
            <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onCancel}>Cancel</Button>
          </>
        )}
        {request.status === "accepted" && (
          <>
            <Button disabled={busy} onClick={() => onMessage(otherId)}><MessageCircle size={16} />Message</Button>
            <Button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100" disabled={busy} onClick={() => onComplete(5)}><Star size={16} />Complete + rate 5</Button>
          </>
        )}
      </div>
    </article>
  );
}

function SkillBarChart({ skills }: { skills: string[] }) {
  const data = skills.length ? skills.slice(0, 8).map((skill) => ({ skill, count: 1 })) : [{ skill: "No data", count: 0 }];
  return <ResponsiveContainer height={220} width="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="skill" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>;
}

function ProgressPie({ active, completed, pending }: { active: number; completed: number; pending: number }) {
  const data = [{ name: "Active", value: active }, { name: "Completed", value: completed }, { name: "Pending", value: pending }].filter((item) => item.value > 0);
  const safe = data.length ? data : [{ name: "No exchanges", value: 1 }];
  return <ResponsiveContainer height={220} width="100%"><PieChart><Pie data={safe} dataKey="value" innerRadius={55} outerRadius={85}>{safe.map((_, index) => <Cell fill={["#10b981", "#0f766e", "#f59e0b"][index] ?? "#94a3b8"} key={index} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}

function ChartPanel({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h3 className="font-semibold">{title}</h3><div className="mt-4">{children}</div></section>;
}

function ChipPanel({ title, values }: { title: string; values: string[] }) {
  return <div><p className="text-sm font-semibold">{title}</p><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((value) => <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" key={value}>{value}</span>) : <span className="text-sm text-muted-foreground">Not added</span>}</div></div>;
}

function ScoreRing({ score }: { score: number }) {
  return <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-50 text-lg font-semibold text-emerald-700">{score}%</div>;
}

function SectionTitle({ text, title }: { text: string; title: string }) {
  return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>;
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center"><BookOpen className="mx-auto text-emerald-500" size={32} /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></section>;
}

function StateCard({ text, title, tone = "default" }: { text: string; title: string; tone?: "default" | "error" }) {
  return <section className={`mt-5 rounded-lg border p-5 ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-border bg-card"}`}><p className="font-semibold">{title}</p><p className="mt-2 text-sm leading-6 opacity-80">{text}</p></section>;
}
