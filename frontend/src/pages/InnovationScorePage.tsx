import { Award, BrainCircuit, Loader2, RefreshCw, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { getInnovationScore, refreshInnovationScore } from "../services/innovationScoreApi";
import type { InnovationScoreResponse, LeaderboardEntry } from "../types/innovationScore";

const FILTERS = ["All", "AI", "Web Development", "Data Science", "Cybersecurity", "Startup Builders"];

export function InnovationScorePage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All");
  const [data, setData] = useState<InnovationScoreResponse | null>(null);
  const [error, setError] = useState("");

  async function load(activeFilter = filter) {
    setStatus("loading");
    setError("");
    try {
      setData(await getInnovationScore(activeFilter === "All" ? undefined : activeFilter));
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Innovation Score.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeFilter(nextFilter: string) {
    setFilter(nextFilter);
    await load(nextFilter);
  }

  async function refresh() {
    setBusy(true);
    try {
      setData(await refreshInnovationScore());
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh Innovation Score.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  const charts = useMemo(() => {
    const score = data?.score;
    if (!score) return { radar: [], trend: [], growth: [] };
    return {
      radar: [
        { name: "Technical", value: score.scores.technical },
        { name: "Innovation", value: score.scores.innovation },
        { name: "Collab", value: score.scores.collaboration },
        { name: "Leadership", value: score.scores.leadership },
        { name: "Career", value: score.scores.careerReadiness },
        { name: "Startup", value: score.scores.startupReadiness },
        { name: "Research", value: score.scores.researchReadiness }
      ],
      trend: [...(data?.history ?? [])].reverse().map((item) => ({ date: new Date(item.calculatedAt).toLocaleDateString(), score: item.overallScore })),
      growth: [
        { name: "Skills", value: score.metrics.skills },
        { name: "Projects", value: score.metrics.projects },
        { name: "Hackathons", value: score.metrics.hackathons },
        { name: "Posts", value: score.metrics.communityPosts },
        { name: "Exchanges", value: score.metrics.completedExchanges },
        { name: "Mentorships", value: score.metrics.acceptedMentorships }
      ]
    };
  }, [data]);

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Innovation Score...</main>;
  if (status === "error" || !data) return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error || "Innovation Score unavailable."}</main>;

  const score = data.score;
  const earnedBadges = score.badges.filter((badge) => badge.earned);
  const lockedBadges = score.badges.filter((badge) => !badge.earned);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">
              <Sparkles size={16} />
              AI Innovation Score
            </p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Your EngineerConnect reputation, calculated from real activity.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
              Tracks technical depth, innovation, collaboration, leadership, career readiness, startup readiness, and research readiness across the platform.
            </p>
          </div>
          <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" disabled={busy} onClick={refresh}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Recalculate Score
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm md:col-span-1">
          <p className="text-xs font-semibold uppercase text-emerald-700">Overall EngineerConnect Score</p>
          <p className="mt-3 text-5xl font-semibold text-emerald-800">{score.overallScore}</p>
          <p className="mt-2 text-sm text-emerald-900">Calculated {new Date(score.calculatedAt).toLocaleString()}</p>
        </div>
        <Metric label="Technical" value={score.scores.technical} />
        <Metric label="Innovation" value={score.scores.innovation} />
        <Metric label="Collaboration" value={score.scores.collaboration} />
        <Metric label="Leadership" value={score.scores.leadership} />
        <Metric label="Career Ready" value={score.scores.careerReadiness} />
        <Metric label="Startup Ready" value={score.scores.startupReadiness} />
        <Metric label="Research Ready" value={score.scores.researchReadiness} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Radar Chart">
          <ResponsiveContainer height={300} width="100%">
            <RadarChart data={charts.radar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar dataKey="value" fill="#10b981" fillOpacity={0.35} stroke="#059669" strokeWidth={2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Score Trend">
          <ResponsiveContainer height={300} width="100%">
            <LineChart data={charts.trend.length ? charts.trend : [{ date: "Now", score: score.overallScore }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line dataKey="score" stroke="#0f766e" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Skill Growth Signals">
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={charts.growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold"><BrainCircuit className="text-emerald-600" size={18} /> AI Analysis</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{score.explanation}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Panel title="Why High" items={score.strengths} />
            <Panel title="Why Low" items={score.weaknesses} />
            <Panel title="Improve Next" items={score.improvementPlan} />
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold"><Award className="text-emerald-600" size={18} /> Badge Showcase</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {earnedBadges.map((badge) => <BadgeCard earned key={badge.key} label={badge.label} reason={badge.reason} />)}
            {lockedBadges.map((badge) => <BadgeCard earned={false} key={badge.key} label={badge.label} reason={badge.reason} />)}
          </div>
        </section>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Metric label="Profile Completion" value={score.metrics.profileCompletion} />
        <Metric label="Project Success" value={score.metrics.projectSuccessRate} />
        <Metric label="Team Participation" value={score.metrics.teamParticipation} />
        <Metric label="Community Likes" value={score.metrics.communityLikes} />
      </section>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 font-semibold"><Trophy className="text-emerald-600" size={18} /> Leaderboards</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => (
              <button className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold transition ${filter === item ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-white text-muted-foreground hover:border-emerald-300 hover:text-emerald-700"}`} key={item} onClick={() => void changeFilter(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Leaderboard title="Global" items={data.leaderboards?.global ?? []} />
          <Leaderboard title="College" items={data.leaderboards?.college ?? []} />
          <Leaderboard title="Branch" items={data.leaderboards?.branch ?? []} />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{value}%</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Panel({ items, title }: { items: string[]; title: string }) {
  return <div><p className="text-sm font-semibold">{title}</p><div className="mt-2 grid gap-2">{items.length ? items.map((item) => <p className="text-sm leading-5 text-muted-foreground" key={item}>{item}</p>) : <p className="text-sm text-muted-foreground">No insight yet.</p>}</div></div>;
}

function BadgeCard({ earned, label, reason }: { earned: boolean; label: string; reason: string }) {
  return (
    <div className={`rounded-lg border p-3 ${earned ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 opacity-75"}`}>
      <p className={`flex items-center gap-2 font-semibold ${earned ? "text-emerald-800" : "text-slate-600"}`}><ShieldCheck size={16} />{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{reason}</p>
    </div>
  );
}

function Leaderboard({ items, title }: { items: LeaderboardEntry[]; title: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item, index) => (
          <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2" key={item._id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{index + 1}. {item.profile?.name ?? "Student"}</p>
              <p className="truncate text-xs text-muted-foreground">{item.profile?.college ?? "College"} · {item.profile?.branch ?? "Branch"}</p>
            </div>
            <span className="shrink-0 rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-700">{item.overallScore}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">No score snapshots yet.</p>}
      </div>
    </div>
  );
}
