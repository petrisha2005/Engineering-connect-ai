import { AlertTriangle, Activity, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { getProjectHealth, refreshProjectHealth } from "../services/projectHealthApi";
import { listProjects } from "../services/projectApi";
import type { Project } from "../types/project";
import type { ProjectHealthResponse } from "../types/projectHealth";

type Status = "loading" | "ready" | "error";
const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#0f766e", "#64748b"];

export function ProjectHealthPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [data, setData] = useState<ProjectHealthResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadProjects() {
    setStatus("loading");
    setError(null);
    try {
      const response = await listProjects({ mine: "true", limit: 50 });
      const items = response.projects ?? [];
      setProjects(items);
      const first = selectedProjectId || items[0]?._id || "";
      setSelectedProjectId(first);
      if (first) setData(await getProjectHealth(first));
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project health.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setData(await getProjectHealth(projectId));
  }

  async function refresh() {
    if (!selectedProjectId) return;
    setRefreshing(true);
    try {
      setData(await refreshProjectHealth(selectedProjectId));
    } finally {
      setRefreshing(false);
    }
  }

  const health = data?.health;
  const skillData = useMemo(() => {
    if (!health) return [];
    return [...health.coveredSkills.map((skill) => ({ skill, covered: 1, missing: 0 })), ...health.missingSkills.map((skill) => ({ skill, covered: 0, missing: 1 }))].slice(0, 12);
  }, [health]);
  const riskData = health ? [{ name: "Risk", value: health.riskScore }, { name: "Health", value: health.healthScore }] : [];
  const composition = data?.project.members.map((member) => ({ role: member.role, count: 1 })) ?? [];

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Project Health...</main>;
  if (status === "error") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100"><Activity size={16} />AI Project Health Dashboard</p>
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">AI project manager for student teams.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">Monitor success probability, risk, missing skills, roles, progress, and next actions from real project data.</p>
          </div>
          <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" disabled={refreshing || !selectedProjectId} onClick={refresh}>{refreshing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}Refresh Health</Button>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <label className="grid gap-2 text-sm font-semibold">
          Select project
          <select className="h-11 rounded-md border border-border px-3 text-sm font-normal outline-none" value={selectedProjectId} onChange={(event) => void selectProject(event.target.value)}>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}
          </select>
        </label>
      </section>

      {!data || !health ? <Empty title="No projects yet" text="Create or join a project to generate its AI health report." /> : (
        <>
          <section className="mt-5 grid gap-4 md:grid-cols-5">
            <Metric label="Health Score" value={`${health.healthScore}%`} />
            <Metric label="Risk Level" value={health.riskLevel} />
            <Metric label="Progress" value={`${health.progress}%`} />
            <Metric label="Success" value={health.successProbability} />
            <Metric label="Prediction" value={health.completionPrediction} />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Project Health Gauge">
              <div className="flex items-center justify-center"><div className="flex size-48 items-center justify-center rounded-full border-[18px] border-emerald-200 bg-emerald-50 text-4xl font-semibold text-emerald-700">{health.healthScore}%</div></div>
            </ChartCard>
            <ChartCard title="Skill Coverage Chart">
              <ResponsiveContainer height={260} width="100%"><BarChart data={skillData.length ? skillData : [{ skill: "No skills", covered: 0, missing: 0 }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="skill" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="covered" fill="#10b981" /><Bar dataKey="missing" fill="#f59e0b" /></BarChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Team Composition">
              <ResponsiveContainer height={260} width="100%"><PieChart><Pie data={composition.length ? composition : [{ role: "No team", count: 1 }]} dataKey="count" nameKey="role" innerRadius={60} outerRadius={95}>{(composition.length ? composition : [{ role: "No team", count: 1 }]).map((_, index) => <Cell fill={COLORS[index % COLORS.length]} key={index} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Risk Breakdown">
              <ResponsiveContainer height={260} width="100%"><PieChart><Pie data={riskData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>{riskData.map((_, index) => <Cell fill={index === 0 ? "#f59e0b" : "#10b981"} key={index} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Timeline Progress">
              <ResponsiveContainer height={260} width="100%"><BarChart data={health.timeline}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stage" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="progress" fill="#0f766e" /></BarChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Alerts">
              <div className="grid gap-2">{health.alerts.length ? health.alerts.map((alert) => <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" key={alert}><AlertTriangle className="shrink-0" size={16} />{alert}</p>) : <p className="text-sm text-muted-foreground">No critical alerts right now.</p>}</div>
            </ChartCard>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <Panel title="Strengths" items={health.strengths} />
            <Panel title="Weaknesses" items={health.weaknesses} />
            <Panel title="Risks" items={health.risks} />
            <Panel title="Recommendations" items={health.recommendations} />
            <Panel title="Missing Roles" items={health.missingRoles} />
            <Panel title="Missing Skills" items={health.missingSkills} />
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Panel({ items, title }: { items: string[]; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{items.length ? items.map((item) => <p className="flex gap-2 text-sm text-muted-foreground" key={item}><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={15} />{item}</p>) : <p className="text-sm text-muted-foreground">No data yet.</p>}</div></section>;
}

function Empty({ text, title }: { text: string; title: string }) {
  return <section className="mt-5 rounded-lg border border-dashed border-border bg-card p-8 text-center"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p></section>;
}
