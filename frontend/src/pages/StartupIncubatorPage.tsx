import { Bot, Download, Lightbulb, Loader2, Rocket, Send, Target, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { askStartupAssistant, completeStartupMilestone, createStartup, getMvpRoadmap, getPitchDeck, getStartupReadiness, getStartups, getStartupValidation } from "../services/startupIncubatorApi";
import type { StartupDetail, StartupIncubatorResponse, StartupStage } from "../types/startupIncubator";

const STAGES: StartupStage[] = ["Idea", "Validation", "MVP", "Beta", "Launch", "Growth"];
const COLORS = ["#10b981", "#0f766e", "#14b8a6", "#f59e0b", "#64748b"];

export function StartupIncubatorPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [data, setData] = useState<StartupIncubatorResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [form, setForm] = useState({ startupName: "", industry: "", stage: "Idea" as StartupStage, problemStatement: "", solution: "", targetAudience: "", businessModel: "", fundingStatus: "Bootstrapped", requiredSkills: "", missingRoles: "" });

  async function load(preferredId = selectedId) {
    setStatus("loading");
    setError("");
    try {
      const response = await getStartups();
      setData(response);
      setSelectedId(preferredId || response.details[0]?.startup._id || "");
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Startup Incubator.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = data?.details.find((item) => item.startup._id === selectedId) ?? data?.details[0] ?? null;
  const charts = useMemo(() => {
    if (!selected) return { readiness: [], roadmap: [], team: [], trend: [] };
    const readiness = selected.readiness;
    return {
      readiness: readiness ? [
        { name: "Startup", value: readiness.startupReadiness },
        { name: "Execution", value: readiness.executionReadiness },
        { name: "Market", value: readiness.marketReadiness },
        { name: "Team", value: readiness.teamReadiness },
        { name: "Investor", value: readiness.investorReadinessScore }
      ] : [],
      roadmap: selected.milestones.map((milestone) => ({ name: milestone.phase, progress: milestone.progress })),
      team: [
        { name: "Founders", value: selected.startup.founderIds.length },
        { name: "Missing Roles", value: selected.startup.missingRoles.length },
        { name: "Recommended", value: selected.recommendedFounders.length }
      ],
      trend: selected.startup.activityLog.map((item, index) => ({ name: `${index + 1}`, progress: Math.min(100, (index + 1) * 18) }))
    };
  }, [selected]);

  async function submitStartup() {
    if (!form.startupName || !form.industry || !form.problemStatement || !form.solution || !form.targetAudience || !form.businessModel) {
      setError("Fill startup name, industry, problem, solution, audience, and business model.");
      return;
    }
    setBusy("create");
    try {
      const response = await createStartup({ ...form, requiredSkills: split(form.requiredSkills), missingRoles: split(form.missingRoles) } as any);
      setNotice("Startup created.");
      setForm({ ...form, startupName: "", problemStatement: "", solution: "", targetAudience: "", businessModel: "", requiredSkills: "", missingRoles: "" });
      await load(response.startup._id);
    } finally {
      setBusy("");
    }
  }

  async function refreshAnalysis(detail: StartupDetail) {
    setBusy("analysis");
    try {
      await getStartupValidation(detail.startup._id);
      await getStartupReadiness(detail.startup._id);
      await getMvpRoadmap(detail.startup._id);
      setNotice("AI startup analysis refreshed.");
      await load(detail.startup._id);
    } finally {
      setBusy("");
    }
  }

  async function generatePitch(detail: StartupDetail) {
    setBusy("pitch");
    try {
      await getPitchDeck(detail.startup._id);
      setNotice("Pitch deck generated.");
      await load(detail.startup._id);
    } finally {
      setBusy("");
    }
  }

  async function completeMilestone(detail: StartupDetail, milestoneId: string) {
    setBusy(milestoneId);
    try {
      await completeStartupMilestone(detail.startup._id, milestoneId);
      setNotice("Milestone completed.");
      await load(detail.startup._id);
    } finally {
      setBusy("");
    }
  }

  async function askAssistant(detail: StartupDetail) {
    if (!question.trim()) return;
    setBusy("assistant");
    try {
      const response = await askStartupAssistant(detail.startup._id, question);
      setAnswer(response.answer);
    } finally {
      setBusy("");
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Startup Incubator...</main>;
  if (status === "error") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100"><Rocket size={16} /> AI Startup Incubator</p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Turn student ideas into validated startups.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">Validate ideas, generate MVP roadmaps, find missing founders, track milestones, build pitch decks, and measure investor readiness.</p>
      </section>

      {notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <section className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Create Startup Profile">
          <div className="grid gap-3">
            <Input label="Startup Name" value={form.startupName} onChange={(value) => setForm({ ...form, startupName: value })} />
            <Input label="Industry" value={form.industry} onChange={(value) => setForm({ ...form, industry: value })} />
            <select className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as StartupStage })}>{STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select>
            <textarea className="min-h-20 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={form.problemStatement} onChange={(event) => setForm({ ...form, problemStatement: event.target.value })} placeholder="Problem statement" />
            <textarea className="min-h-20 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={form.solution} onChange={(event) => setForm({ ...form, solution: event.target.value })} placeholder="Solution" />
            <Input label="Target Audience" value={form.targetAudience} onChange={(value) => setForm({ ...form, targetAudience: value })} />
            <Input label="Business Model" value={form.businessModel} onChange={(value) => setForm({ ...form, businessModel: value })} />
            <Input label="Required Skills" value={form.requiredSkills} onChange={(value) => setForm({ ...form, requiredSkills: value })} placeholder="react, ai, sales" />
            <Input label="Missing Roles" value={form.missingRoles} onChange={(value) => setForm({ ...form, missingRoles: value })} placeholder="business founder, growth marketer" />
            <Button disabled={busy === "create"} onClick={submitStartup}>{busy === "create" ? <Loader2 className="animate-spin" size={16} /> : <Lightbulb size={16} />} Create Startup</Button>
          </div>
        </Card>

        <Card title="Startup Workspace">
          {data?.details.length ? (
            <div className="grid gap-4">
              <select className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{data.details.map((detail) => <option key={detail.startup._id} value={detail.startup._id}>{detail.startup.startupName}</option>)}</select>
              {selected && <StartupSummary detail={selected} onGeneratePitch={generatePitch} onRefresh={refreshAnalysis} busy={busy} />}
            </div>
          ) : <Empty text="Create your first startup to unlock AI validation, MVP roadmap, and pitch deck builder." />}
        </Card>
      </section>

      {selected && (
        <>
          <section className="mt-5 grid gap-4 md:grid-cols-5">
            <Metric label="Overall Startup" value={selected.readiness?.overallStartupScore ?? 0} />
            <Metric label="Execution" value={selected.readiness?.executionReadiness ?? 0} />
            <Metric label="Market" value={selected.readiness?.marketReadiness ?? 0} />
            <Metric label="Team" value={selected.readiness?.teamReadiness ?? 0} />
            <Metric label="Investor" value={selected.readiness?.investorReadinessScore ?? 0} />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <ChartCard title="Startup Readiness Gauge"><ResponsiveContainer height={280} width="100%"><BarChart data={charts.readiness.length ? charts.readiness : [{ name: "Startup", value: 0 }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#10b981" /></BarChart></ResponsiveContainer></ChartCard>
            <ChartCard title="MVP Progress Timeline"><ResponsiveContainer height={280} width="100%"><LineChart data={charts.roadmap}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="progress" stroke="#0f766e" strokeWidth={3} /></LineChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Team Skill Coverage"><ResponsiveContainer height={280} width="100%"><PieChart><Pie data={charts.team} dataKey="value" innerRadius={55} outerRadius={90}>{charts.team.map((_, index) => <Cell fill={COLORS[index % COLORS.length]} key={index} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <Panel title="Idea Validation" items={[`Validation: ${selected.validation?.validationScore ?? 0}%`, `Market: ${selected.validation?.marketPotential ?? 0}%`, `Innovation: ${selected.validation?.innovationScore ?? 0}%`, `Technical difficulty: ${selected.validation?.technicalDifficulty ?? 0}%`, ...(selected.validation?.recommendations ?? [])]} />
            <Panel title="Investor Readiness" items={[...(selected.readiness?.strengths ?? []), ...(selected.readiness?.weaknesses ?? []), ...(selected.readiness?.nextSteps ?? [])]} />
            <Panel title="Competitor Analysis" items={selected.validation?.competitors.map((item) => `${item.name}: ${item.differentiator || item.positioning}`) ?? []} />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card title="AI MVP Roadmap">
              <div className="grid gap-3">{selected.milestones.map((milestone) => <div className="rounded-lg border border-border p-3" key={milestone._id}><div className="flex justify-between gap-3"><p className="font-semibold">{milestone.phase}: {milestone.title}</p><span className="text-sm font-semibold text-emerald-700">{milestone.progress}%</span></div><p className="mt-1 text-sm text-muted-foreground">{milestone.timeline} · {milestone.requiredSkills.join(", ")}</p><ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{milestone.tasks.map((task) => <li key={task}>{task}</li>)}</ul><Button className="mt-3" disabled={milestone.completed || busy === milestone._id} onClick={() => completeMilestone(selected, milestone._id)}>{busy === milestone._id ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />} {milestone.completed ? "Completed" : "Complete Milestone"}</Button></div>)}</div>
            </Card>
            <Card title="Co-Founder Integration">
              <div className="grid gap-3">{selected.recommendedFounders.length ? selected.recommendedFounders.map((item) => <div className="rounded-lg border border-border p-3" key={item.founder._id}><div className="flex justify-between gap-2"><p className="font-semibold">{item.founder.userId?.displayName ?? "Founder"}</p><span className="font-semibold text-emerald-700">{item.matchScore}%</span></div><p className="text-sm text-muted-foreground">{item.suggestedRole}</p><p className="mt-1 text-sm text-muted-foreground">{item.reason}</p></div>) : <Empty text="No founder recommendations yet. Create founder profiles in Co-Founder Matcher." />}</div>
            </Card>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card title="Pitch Deck Builder">
              {selected.pitchDeck ? <div className="grid gap-3">{selected.pitchDeck.slides.map((slide) => <div className="rounded-lg border border-border p-3" key={slide.title}><p className="font-semibold">{slide.title}</p><p className="mt-1 text-sm text-muted-foreground">{slide.content}</p></div>)}<Button onClick={() => downloadText(`${selected.startup.startupName}-pitch.txt`, selected.pitchDeck?.exportText ?? "")}><Download size={16} /> Export Pitch Content</Button></div> : <Button disabled={busy === "pitch"} onClick={() => generatePitch(selected)}>{busy === "pitch" ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />} Generate Pitch Deck</Button>}
            </Card>
            <Card title="AI Startup Assistant">
              <div className="grid gap-3">
                <textarea className="min-h-24 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask: Is my startup idea viable? What should I build first? Am I investor ready?" />
                <Button className="w-fit" disabled={busy === "assistant"} onClick={() => askAssistant(selected)}>{busy === "assistant" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Ask Assistant</Button>
                {answer && <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><Bot className="mr-2 inline" size={16} />{answer}</p>}
              </div>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

function StartupSummary({ busy, detail, onGeneratePitch, onRefresh }: { busy: string; detail: StartupDetail; onGeneratePitch: (detail: StartupDetail) => void; onRefresh: (detail: StartupDetail) => void }) {
  return <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4"><p className="font-semibold text-emerald-950">{detail.startup.startupName}</p><p className="mt-1 text-sm text-emerald-900">{detail.startup.industry} · {detail.startup.stage} · {detail.startup.fundingStatus}</p><p className="mt-2 text-sm leading-6 text-emerald-950">{detail.startup.problemStatement}</p><div className="mt-3 flex flex-wrap gap-2"><Button disabled={busy === "analysis"} onClick={() => onRefresh(detail)}>{busy === "analysis" ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />} Refresh AI Analysis</Button><Button disabled={busy === "pitch"} onClick={() => onGeneratePitch(detail)}>{busy === "pitch" ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />} Pitch Deck</Button></div></div>;
}

function split(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function downloadText(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{value}%</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Input({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<input className="rounded-md border border-border px-3 py-2 font-normal outline-none focus:border-emerald-400" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Panel({ items, title }: { items: string[]; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{items.length ? items.map((item) => <p className="text-sm leading-5 text-muted-foreground" key={item}>{item}</p>) : <p className="text-sm text-muted-foreground">Generate analysis to see this section.</p>}</div></section>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{text}</p>;
}
