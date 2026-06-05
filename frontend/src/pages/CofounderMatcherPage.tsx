import { BriefcaseBusiness, Check, Handshake, Loader2, MessageCircle, Rocket, Send, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { createOrGetConversation } from "../services/messageApi";
import { acceptFounderRequest, createStartupIdea, getCofounderHome, getCofounderMatches, rejectFounderRequest, saveFounderProfile, sendFounderRequest } from "../services/cofounderApi";
import { useAuthStore } from "../store/authStore";
import type { AppUser } from "../types/auth";
import type { CofounderMatch, FounderProfile, FounderProfilePayload, FounderRequest, StartupIdea, StartupIdeaPayload } from "../types/cofounder";
import { useNavigate } from "react-router-dom";

type Status = "loading" | "ready" | "error";

const founderTypes = ["Technical Founder", "Business Founder", "Product Founder", "Marketing Founder", "Operations Founder"] as const;
const COLORS = ["#10b981", "#0f766e", "#14b8a6", "#f59e0b", "#64748b"];

function csv(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function join(values: string[]) {
  return values.join(", ");
}

function userId(user: string | AppUser) {
  return typeof user === "string" ? user : user._id;
}

function userName(user: string | AppUser) {
  return typeof user === "string" ? "Student" : user.displayName;
}

export function CofounderMatcherPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [requests, setRequests] = useState<FounderRequest[]>([]);
  const [readiness, setReadiness] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<CofounderMatch[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadAll() {
    setStatus("loading");
    setError(null);
    try {
      const [home, matchResponse] = await Promise.all([getCofounderHome(), getCofounderMatches()]);
      setProfile(home.profile);
      setIdeas(home.ideas ?? []);
      setRequests(home.requests ?? []);
      setReadiness(home.readiness ?? {});
      setMatches(matchResponse.matches ?? []);
      setEditing(!home.profile);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load co-founder matcher.");
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

  async function request(match: CofounderMatch) {
    setBusyId(match.profile._id);
    try {
      await sendFounderRequest(match.profile._id, ideas[0]?._id);
      setToast("Co-founder request sent.");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  async function decide(requestId: string, action: "accept" | "reject") {
    setBusyId(requestId);
    try {
      if (action === "accept") await acceptFounderRequest(requestId);
      else await rejectFounderRequest(requestId);
      setToast(action === "accept" ? "Co-founder request accepted." : "Co-founder request rejected.");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  async function message(otherUserId: string) {
    setBusyId(otherUserId);
    try {
      const response = await createOrGetConversation(otherUserId);
      navigate(`/messages?conversation=${response.conversation._id}`);
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Co-Founder Matcher...</main>;
  if (status === "error") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error}</main>;

  const composition = profile ? [{ name: profile.founderType, value: 1 }, ...matches.slice(0, 4).map((match) => ({ name: match.profile.founderType, value: 1 }))] : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100"><Handshake size={16} />AI Co-Founder Matcher</p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Find startup co-founders with complementary strengths.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">Create founder profiles, post startup ideas, and get AI-powered co-founder compatibility recommendations.</p>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Metric label="Startup Readiness" value={`${readiness.startupReadiness ?? 0}%`} />
        <Metric label="Execution Readiness" value={`${readiness.executionReadiness ?? 0}%`} />
        <Metric label="Team Readiness" value={`${readiness.teamReadiness ?? 0}%`} />
        <Metric label="Market Readiness" value={`${readiness.marketReadiness ?? 0}%`} />
      </section>

      {editing ? <FounderProfileForm profile={profile} onCancel={() => profile && setEditing(false)} onSaved={async () => { setToast("Founder profile saved."); await loadAll(); }} /> : <ProfileSummary profile={profile} onEdit={() => setEditing(true)} />}

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <IdeaForm onSaved={async () => { setToast("Startup idea posted."); await loadAll(); }} />
        <ChartCard title="Startup Readiness Score">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={Object.entries(readiness).map(([name, value]) => ({ name: name.replace(/Readiness/g, ""), value }))}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Team Composition">
          <ResponsiveContainer height={240} width="100%">
            <PieChart><Pie data={composition.length ? composition : [{ name: "No profile", value: 1 }]} dataKey="value" innerRadius={55} outerRadius={90}>{(composition.length ? composition : [{ name: "No profile", value: 1 }]).map((_, index) => <Cell fill={COLORS[index % COLORS.length]} key={index} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Founder Skill Distribution">
          <ResponsiveContainer height={240} width="100%">
            <BarChart data={(profile?.skills ?? []).slice(0, 8).map((skill) => ({ skill, count: 1 }))}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="skill" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <SectionTitle title="AI Founder Recommendations" text="Gemini explanations plus compatibility scoring from real founder profiles." />
          {profile ? matches.length ? matches.map((match) => <MatchCard busy={busyId === match.profile._id} key={match.profile._id} match={match} onRequest={() => request(match)} />) : <Empty title="No co-founder matches yet" text="Matches appear after more students create founder profiles." /> : <Empty title="Create your founder profile first" text="Add your founder type, startup interests, industries, skills, and goals." />}
        </div>
        <div className="grid content-start gap-4">
          <SectionTitle title="Founder Requests" text="Accept requests to unlock messaging." />
          {requests.length ? requests.map((requestItem) => {
            const isRecipient = currentUser?._id === userId(requestItem.recipient);
            const other = isRecipient ? requestItem.requester : requestItem.recipient;
            return <RequestCard busy={busyId === requestItem._id} isRecipient={isRecipient} key={requestItem._id} onAccept={() => decide(requestItem._id, "accept")} onMessage={() => message(userId(other))} onReject={() => decide(requestItem._id, "reject")} request={requestItem} />;
          }) : <Empty title="No founder requests" text="Send a request to a compatible founder to start a conversation." />}
          <SectionTitle title="Startup Idea Board" text="Your posted startup ideas." />
          {ideas.length ? ideas.map((idea) => <IdeaCard idea={idea} key={idea._id} />) : <Empty title="No startup ideas yet" text="Post a startup idea to improve founder matching context." />}
        </div>
      </section>

      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">{toast}</div>}
    </main>
  );
}

function FounderProfileForm({ onCancel, onSaved, profile }: { onCancel: () => void; onSaved: () => Promise<void>; profile: FounderProfile | null }) {
  const [form, setForm] = useState<{
    founderType: string;
    skills: string;
    startupInterests: string;
    industries: string;
    goals: string;
    commitmentLevel: string;
    startupStage: string;
    availability: string;
    preferredLocation: string;
    bio: string;
  }>({
    founderType: profile?.founderType ?? "Technical Founder",
    skills: join(profile?.skills ?? []),
    startupInterests: join(profile?.startupInterests ?? []),
    industries: join(profile?.industries ?? []),
    goals: join(profile?.goals ?? []),
    commitmentLevel: profile?.commitmentLevel ?? "medium",
    startupStage: profile?.startupStage ?? "idea",
    availability: profile?.availability ?? "flexible",
    preferredLocation: profile?.preferredLocation ?? "",
    bio: profile?.bio ?? ""
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: FounderProfilePayload = { ...form, founderType: form.founderType as FounderProfilePayload["founderType"], skills: csv(form.skills), startupInterests: csv(form.startupInterests), industries: csv(form.industries), goals: csv(form.goals) };
      await saveFounderProfile(payload);
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="text-2xl font-semibold">{profile ? "Edit Founder Profile" : "Create Founder Profile"}</h2><form className="mt-4 grid gap-4" onSubmit={submit}><div className="grid gap-4 md:grid-cols-2"><Select label="Founder type" value={form.founderType} options={[...founderTypes]} onChange={(value) => setForm({ ...form, founderType: value as FounderProfilePayload["founderType"] })} /><Input label="Skills" value={form.skills} onChange={(value) => setForm({ ...form, skills: value })} placeholder="React, AI, data analytics" /><Input label="Startup interests" value={form.startupInterests} onChange={(value) => setForm({ ...form, startupInterests: value })} /><Input label="Industries" value={form.industries} onChange={(value) => setForm({ ...form, industries: value })} /><Input label="Goals" value={form.goals} onChange={(value) => setForm({ ...form, goals: value })} /><Input label="Preferred location" value={form.preferredLocation} onChange={(value) => setForm({ ...form, preferredLocation: value })} /><Select label="Commitment" value={form.commitmentLevel} options={["low", "medium", "high", "full_time"]} onChange={(value) => setForm({ ...form, commitmentLevel: value as FounderProfilePayload["commitmentLevel"] })} /><Select label="Startup stage" value={form.startupStage} options={["idea", "prototype", "mvp", "early_users", "revenue"]} onChange={(value) => setForm({ ...form, startupStage: value as FounderProfilePayload["startupStage"] })} /></div><textarea className="min-h-24 rounded-md border border-border px-3 py-3 text-sm outline-none focus:border-emerald-400" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Founder background and working style" /><div className="flex gap-2"><Button disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}Save profile</Button>{profile && <Button className="bg-muted text-foreground hover:bg-muted/80" type="button" onClick={onCancel}>Cancel</Button>}</div></form></section>;
}

function IdeaForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ startupName: "", industry: "", problemStatement: "", targetUsers: "", currentStage: "idea", fundingStatus: "bootstrapped", requiredRoles: "", description: "" });
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: StartupIdeaPayload = { ...form, requiredRoles: csv(form.requiredRoles) };
      await createStartupIdea(payload);
      setForm({ startupName: "", industry: "", problemStatement: "", targetUsers: "", currentStage: "idea", fundingStatus: "bootstrapped", requiredRoles: "", description: "" });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">Post Startup Idea</h2><form className="mt-4 grid gap-3" onSubmit={submit}><div className="grid gap-3 md:grid-cols-2"><Input label="Startup name" value={form.startupName} onChange={(value) => setForm({ ...form, startupName: value })} /><Input label="Industry" value={form.industry} onChange={(value) => setForm({ ...form, industry: value })} /><Input label="Target users" value={form.targetUsers} onChange={(value) => setForm({ ...form, targetUsers: value })} /><Input label="Required roles" value={form.requiredRoles} onChange={(value) => setForm({ ...form, requiredRoles: value })} placeholder="Business Founder, Marketing Founder" /></div><textarea className="min-h-24 rounded-md border border-border px-3 py-3 text-sm outline-none focus:border-emerald-400" value={form.problemStatement} onChange={(event) => setForm({ ...form, problemStatement: event.target.value })} placeholder="Problem statement" required /><Button disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />}Post idea</Button></form></section>;
}

function MatchCard({ busy, match, onRequest }: { busy?: boolean; match: CofounderMatch; onRequest: () => void }) {
  return <article className="rounded-lg border border-border bg-card p-5 shadow-sm"><div className="flex justify-between gap-4"><div><h3 className="text-xl font-semibold">{userName(match.profile.userId)}</h3><p className="mt-1 text-sm text-muted-foreground">{match.profile.founderType} · {match.profile.commitmentLevel}</p></div><div className="flex size-20 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-50 text-lg font-semibold text-emerald-700">{match.matchScore}%</div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{match.compatibilityReason}</p><div className="mt-4 grid gap-2 md:grid-cols-2"><Chip title="Strengths" values={match.strengths} /><Chip title="Risks" values={match.risks} /></div><ResponsiveContainer height={180} width="100%"><BarChart data={[{ name: "Vision", value: match.visionAlignment }, { name: "Skills", value: match.skillComplementarity }, { name: "Commit", value: match.commitmentCompatibility }, { name: "Exp", value: match.experienceMatch }, { name: "Lead", value: match.leadershipBalance }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#10b981" /></BarChart></ResponsiveContainer>{match.state === "none" ? <Button disabled={busy} onClick={onRequest}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}Send co-founder request</Button> : <Button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100" disabled>{match.state}</Button>}</article>;
}

function RequestCard({ busy, isRecipient, onAccept, onMessage, onReject, request }: { busy?: boolean; isRecipient: boolean; onAccept: () => void; onMessage: () => void; onReject: () => void; request: FounderRequest }) {
  const other = isRecipient ? request.requester : request.recipient;
  return <article className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="font-semibold">{userName(other)}</p><p className="mt-1 text-sm text-muted-foreground">{request.matchScore}% match · {request.status}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{request.compatibilityReason}</p><div className="mt-4 flex flex-wrap gap-2">{request.status === "pending" && isRecipient && <><Button disabled={busy} onClick={onAccept}><Check size={16} />Accept</Button><Button className="bg-muted text-foreground hover:bg-muted/80" disabled={busy} onClick={onReject}><X size={16} />Reject</Button></>}{request.status === "accepted" && <Button disabled={busy} onClick={onMessage}><MessageCircle size={16} />Message</Button>}</div></article>;
}

function ProfileSummary({ onEdit, profile }: { onEdit: () => void; profile: FounderProfile | null }) {
  if (!profile) return null;
  return <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h2 className="text-2xl font-semibold">Founder Profile</h2><p className="mt-1 text-sm text-muted-foreground">{profile.founderType} · {profile.startupStage} · {profile.commitmentLevel}</p></div><Button className="bg-muted text-foreground hover:bg-muted/80" onClick={onEdit}>Edit profile</Button></div><div className="mt-4 grid gap-4 md:grid-cols-3"><Chip title="Skills" values={profile.skills} /><Chip title="Industries" values={profile.industries} /><Chip title="Looking to build" values={profile.startupInterests} /></div></section>;
}

function IdeaCard({ idea }: { idea: StartupIdea }) {
  return <article className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="font-semibold">{idea.startupName}</p><p className="mt-1 text-sm text-muted-foreground">{idea.industry} · {idea.currentStage} · {idea.fundingStatus}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{idea.problemStatement}</p><Chip title="Required Roles" values={idea.requiredRoles} /></article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Chip({ title, values }: { title: string; values: string[] }) {
  return <div className="mt-3"><p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((value) => <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" key={value}>{value}</span>) : <span className="text-sm text-muted-foreground">Not added</span>}</div></div>;
}

function Input({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<input className="h-11 rounded-md border border-border px-3 text-sm font-normal outline-none focus:border-emerald-400" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} required /></label>;
}

function Select({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<select className="h-11 rounded-md border border-border px-3 text-sm font-normal outline-none" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}</select></label>;
}

function SectionTitle({ text, title }: { text: string; title: string }) {
  return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>;
}

function Empty({ text, title }: { text: string; title: string }) {
  return <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center"><BriefcaseBusiness className="mx-auto text-emerald-500" size={32} /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></section>;
}
