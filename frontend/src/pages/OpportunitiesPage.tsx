import { ArrowUpRight, Bookmark, BriefcaseBusiness, ChartNoAxesCombined, ExternalLink, Loader2, RefreshCw, Send, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { askOpportunityCoach, getOpportunities, refreshOpportunities, saveOpportunity, trackOpportunity } from "../services/opportunityApi";
import type { OpportunityMatch, OpportunityResponse, OpportunityTracking, OpportunityType } from "../types/opportunity";

const TYPES: Array<OpportunityType | "All"> = ["All", "Internship", "Hackathon", "Research Program", "Competition", "Scholarship", "Fellowship", "Open Source Program", "Startup Opportunity"];
const STATUS_OPTIONS: OpportunityTracking["status"][] = ["saved", "planning", "applied", "interview", "offer", "rejected", "withdrawn"];
const COLORS = ["#10b981", "#0f766e", "#14b8a6", "#f59e0b", "#64748b"];

export function OpportunitiesPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<OpportunityType | "All">("All");
  const [data, setData] = useState<OpportunityResponse | null>(null);
  const [error, setError] = useState("");
  const [coachAnswers, setCoachAnswers] = useState<Record<string, string>>({});

  async function load(type = selectedType) {
    setStatus("loading");
    setError("");
    try {
      setData(await getOpportunities(type === "All" ? undefined : type));
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load opportunities.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeType(type: OpportunityType | "All") {
    setSelectedType(type);
    await load(type);
  }

  async function refresh() {
    setBusy("refresh");
    try {
      setData(await refreshOpportunities(selectedType === "All" ? undefined : selectedType));
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh opportunities.");
      setStatus("error");
    } finally {
      setBusy(null);
    }
  }

  async function save(match: OpportunityMatch) {
    setBusy(`save-${match.opportunity._id}`);
    try {
      await saveOpportunity(match.opportunity._id);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(match: OpportunityMatch, nextStatus: OpportunityTracking["status"]) {
    setBusy(`track-${match.opportunity._id}`);
    try {
      await trackOpportunity(match.opportunity._id, nextStatus);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function askCoach(match: OpportunityMatch) {
    setBusy(`coach-${match.opportunity._id}`);
    try {
      const response = await askOpportunityCoach(match.opportunity._id);
      setCoachAnswers((current) => ({ ...current, [match.opportunity._id]: response.answer }));
    } finally {
      setBusy(null);
    }
  }

  const chartData = useMemo(() => {
    const matches = data?.matches ?? [];
    return {
      score: matches.slice(0, 6).map((match) => ({ name: match.opportunity.title.slice(0, 18), match: match.analysis.matchScore, readiness: match.analysis.readinessScore })),
      missing: matches.flatMap((match) => match.analysis.missingSkills).reduce<Array<{ skill: string; count: number }>>((items, skill) => {
        const existing = items.find((item) => item.skill === skill);
        if (existing) existing.count += 1;
        else items.push({ skill, count: 1 });
        return items;
      }, []).slice(0, 8),
      pipeline: STATUS_OPTIONS.map((statusOption) => ({ name: statusOption, value: matches.filter((match) => match.tracking?.status === statusOption).length }))
    };
  }, [data]);

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading opportunity matches...</main>;
  if (status === "error") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error}</main>;

  const matches = data?.matches ?? [];
  const summary = data?.summary ?? { total: 0, highReadiness: 0, saved: 0, applied: 0 };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">
              <BriefcaseBusiness size={16} />
              AI Opportunity Engine
            </p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Find opportunities you are actually ready for.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
              Matches internships, hackathons, research programs, scholarships, fellowships, open source programs, and startup opportunities against your real EngineerConnect profile.
            </p>
          </div>
          <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" disabled={busy === "refresh"} onClick={refresh}>
            {busy === "refresh" ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh Matches
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Metric label="Matched Opportunities" value={String(summary.total)} />
        <Metric label="High Readiness" value={String(summary.highReadiness)} />
        <Metric label="Saved" value={String(summary.saved)} />
        <Metric label="Applied" value={String(summary.applied)} />
      </section>

      <section className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {TYPES.map((type) => (
          <button
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold transition ${selectedType === type ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-card text-muted-foreground hover:border-emerald-300 hover:text-emerald-700"}`}
            key={type}
            onClick={() => void changeType(type)}
            type="button"
          >
            {type}
          </button>
        ))}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Opportunity Match Score">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={chartData.score.length ? chartData.score : [{ name: "No data", match: 0, readiness: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="match" fill="#10b981" />
              <Bar dataKey="readiness" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Missing Skill Chart">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={chartData.missing.length ? chartData.missing : [{ skill: "No gaps", count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Application Pipeline">
          <ResponsiveContainer height={260} width="100%">
            <PieChart>
              <Pie data={chartData.pipeline} dataKey="value" innerRadius={58} outerRadius={92}>
                {chartData.pipeline.map((_, index) => <Cell fill={COLORS[index % COLORS.length]} key={index} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-5 grid gap-4">
        {matches.length ? (
          matches.map((match) => (
            <article className="rounded-lg border border-border bg-card p-5 shadow-sm" key={match.opportunity._id}>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{match.opportunity.type}</span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{match.opportunity.status}</span>
                    {match.tracking?.status && <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">Tracked: {match.tracking.status}</span>}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{match.opportunity.title}</h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{match.opportunity.provider}</p>
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{match.opportunity.description}</p>
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-2 text-center lg:w-72">
                  <Score label="Match" value={match.analysis.matchScore} />
                  <Score label="Readiness" value={match.analysis.readinessScore} />
                  <Score label="Success" value={match.analysis.successProbability} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><Target size={16} /> AI Match Insight</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-950">{match.analysis.explanation}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...match.opportunity.requiredSkills, ...match.opportunity.preferredSkills].slice(0, 12).map((skill) => (
                      <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700" key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">Recommended Actions</p>
                  <div className="mt-3 grid gap-2">
                    {match.analysis.recommendedActions.map((action) => (
                      <p className="flex gap-2 text-sm text-muted-foreground" key={action}><ChartNoAxesCombined className="mt-0.5 shrink-0 text-emerald-500" size={15} />{action}</p>
                    ))}
                  </div>
                </div>
              </div>

              {match.analysis.missingSkills.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Missing Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {match.analysis.missingSkills.map((skill) => <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-amber-700" key={skill}>{skill}</span>)}
                  </div>
                </div>
              )}

              {coachAnswers[match.opportunity._id] && <p className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-950">{coachAnswers[match.opportunity._id]}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy === `save-${match.opportunity._id}`} onClick={() => void save(match)}>
                  {busy === `save-${match.opportunity._id}` ? <Loader2 className="animate-spin" size={16} /> : <Bookmark size={16} />}
                  Save
                </Button>
                <Button disabled={busy === `coach-${match.opportunity._id}`} onClick={() => void askCoach(match)}>
                  {busy === `coach-${match.opportunity._id}` ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Am I ready?
                </Button>
                <select
                  className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-emerald-400"
                  onChange={(event) => void updateStatus(match, event.target.value as OpportunityTracking["status"])}
                  value={match.tracking?.status ?? "saved"}
                >
                  {STATUS_OPTIONS.map((statusOption) => <option key={statusOption} value={statusOption}>{statusOption}</option>)}
                </select>
                {match.opportunity.applicationUrl && (
                  <a className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50" href={match.opportunity.applicationUrl} rel="noopener noreferrer" target="_blank">
                    Apply externally <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <section className="rounded-lg border border-dashed border-emerald-200 bg-card p-8 text-center shadow-sm">
            <ArrowUpRight className="mx-auto text-emerald-500" size={32} />
            <h2 className="mt-3 text-xl font-semibold">No opportunities in MongoDB yet</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add real opportunity records to the Opportunity collection, then this engine will match them against Career Twin, profile, projects, resume, and hackathon data. No generic or mock job cards are shown here.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-emerald-700">{value}%</p></div>;
}
