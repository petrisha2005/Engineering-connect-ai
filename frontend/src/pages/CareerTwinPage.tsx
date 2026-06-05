import { Bot, Brain, CheckCircle2, Loader2, RefreshCw, Send, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { askCareerTwinCoach, getCareerTwin, refreshCareerTwin } from "../services/careerTwinApi";
import type { CareerTwinResponse } from "../types/careerTwin";

type Status = "loading" | "ready" | "error";

const COLORS = ["#10b981", "#0f766e", "#14b8a6", "#f59e0b", "#64748b"];

export function CareerTwinPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<CareerTwinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<"idle" | "refresh" | "coach">("idle");

  async function loadTwin() {
    setStatus("loading");
    setError(null);
    try {
      setData(await getCareerTwin());
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Career Twin.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadTwin();
  }, []);

  async function refresh() {
    setBusy("refresh");
    try {
      setData(await refreshCareerTwin());
      setStatus("ready");
    } finally {
      setBusy("idle");
    }
  }

  async function askCoach() {
    if (!question.trim()) return;
    setBusy("coach");
    try {
      const response = await askCareerTwinCoach(question);
      setAnswer(response.answer);
    } finally {
      setBusy("idle");
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Career Twin...</main>;
  if (status === "error" || !data) return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error ?? "Career Twin unavailable"}</main>;

  const twin = data.twin;
  const breakdown = [
    { name: "Technical", value: twin.readinessBreakdown.technical },
    { name: "Projects", value: twin.readinessBreakdown.project },
    { name: "Portfolio", value: twin.readinessBreakdown.portfolio },
    { name: "Communication", value: twin.readinessBreakdown.communication },
    { name: "Interview", value: twin.readinessBreakdown.interview }
  ];
  const trend = [...data.snapshots].reverse().map((snapshot) => ({
    date: new Date(snapshot.createdAt).toLocaleDateString(),
    score: snapshot.readinessScore
  }));
  const skillGap = data.skillGap?.missingSkills?.slice(0, 8).map((item) => ({ skill: item.skill, priority: item.priority === "High" ? 3 : item.priority === "Medium" ? 2 : 1 })) ?? [];
  const opportunities = data.opportunities?.predictions ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">
              <Brain size={16} />
              AI Career Twin
            </p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Your personal career intelligence engine.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">Tracks readiness, gaps, trajectory, project quality, and opportunity fit from your real EngineerConnect data.</p>
          </div>
          <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" disabled={busy === "refresh"} onClick={refresh}>
            {busy === "refresh" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh Twin
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Career Goal" value={twin.careerGoal} icon={<Target size={18} />} />
        <Metric label="Readiness" value={`${twin.readinessScore}%`} />
        <Metric label="Current Level" value={twin.currentLevel} />
        <Metric label="Time To Goal" value={twin.estimatedTimeToGoal} />
        <Metric label="Growth Trend" value={twin.growthTrend} icon={<TrendingUp size={18} />} />
        <Metric label="Confidence" value={`${twin.confidenceScore}%`} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Career Readiness Gauge">
          <div className="flex items-center justify-center">
            <div className="flex size-48 items-center justify-center rounded-full border-[18px] border-emerald-200 bg-emerald-50 text-4xl font-semibold text-emerald-700">{twin.readinessScore}%</div>
          </div>
        </ChartCard>
        <ChartCard title="Readiness Breakdown">
          <ResponsiveContainer height={260} width="100%">
            <PieChart>
              <Pie data={breakdown} dataKey="value" innerRadius={60} outerRadius={95}>
                {breakdown.map((_, index) => <Cell fill={COLORS[index % COLORS.length]} key={index} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Skill Gap Priority">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={skillGap.length ? skillGap : [{ skill: "No gaps", priority: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="priority" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Career Progress Trend">
          <ResponsiveContainer height={260} width="100%">
            <LineChart data={trend.length ? trend : [{ date: "Now", score: twin.readinessScore }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line dataKey="score" stroke="#0f766e" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Strengths" items={twin.strengths} />
        <Panel title="Weaknesses" items={twin.weaknesses} />
        <Panel title="Missing Skills" items={twin.missingSkills.slice(0, 8)} />
        <Panel title="Missing Projects" items={twin.missingProjects} />
        <Panel title="Missing Certifications" items={twin.missingCertifications} />
        <Panel title="This Week" items={twin.recommendedActionsThisWeek} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Opportunity Readiness">
          <div className="grid gap-3">
            {opportunities.map((item) => (
              <div className="rounded-lg border border-border p-3" key={item.type}>
                <div className="flex justify-between gap-3 text-sm font-semibold"><span>{item.type}</span><span>{item.readiness}%</span></div>
                <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.readiness}%` }} /></div>
                <p className="mt-2 text-xs text-muted-foreground">{item.nextAction}</p>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Growth Timeline">
          <div className="grid gap-3">
            {twin.timeline.map((item) => (
              <div className="rounded-lg border border-border p-3" key={item.stage}>
                <p className="font-semibold">{item.stage} <span className="text-xs font-medium text-emerald-700">({item.status})</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.target}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Project Impact Analysis">
          <div className="grid gap-3">
            {twin.projectImpact.length ? twin.projectImpact.map((project) => (
              <div className="rounded-lg border border-border p-3" key={project.title}>
                <p className="font-semibold">{project.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">Impact {project.impactScore}% · Complexity {project.complexityScore}% · Resume value {project.resumeValue}%</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Add projects to your profile or marketplace to unlock project impact analysis.</p>}
          </div>
        </ChartCard>
        <ChartCard title="Career Twin Coach">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {["What should I learn next?", "Am I ready for internships?", "What projects should I build?", "What skills am I missing?"].map((prompt) => (
                <button className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700" key={prompt} onClick={() => setQuestion(prompt)} type="button">{prompt}</button>
              ))}
            </div>
            <textarea className="min-h-24 rounded-md border border-border px-3 py-3 text-sm outline-none focus:border-emerald-400" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Career Twin Coach..." />
            <Button disabled={busy === "coach"} onClick={askCoach}>{busy === "coach" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Ask Coach</Button>
            {answer && <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"><Bot className="mr-2 inline" size={16} />{answer}</p>}
          </div>
        </ChartCard>
      </section>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">GitHub Signal</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{twin.githubSummary}</p>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="flex items-center gap-2 text-muted-foreground">{icon}<p className="text-xs font-semibold uppercase">{label}</p></div><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Panel({ items, title }: { items: string[]; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{items.length ? items.map((item) => <p className="flex gap-2 text-sm text-muted-foreground" key={item}><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={15} />{item}</p>) : <p className="text-sm text-muted-foreground">No data yet.</p>}</div></section>;
}
