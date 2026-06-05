import { FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartEmpty } from "../components/charts/ChartCard";
import { ProfileCompletionChart } from "../components/charts/ProfileCompletionChart";
import { SkillGapChart } from "../components/charts/SkillGapChart";
import { Button } from "../components/ui/Button";
import { analyzeResume, listResumeReports } from "../services/resumeAnalyzerApi";
import type { ResumeReport } from "../types/resume";

function prioritySkills(report: ResumeReport) {
  return report.missingSkills.slice(0, 8).map((skill, index) => ({
    skill,
    priority: (index < 3 ? "High" : index < 6 ? "Medium" : "Low") as "High" | "Medium" | "Low",
    reason: "Missing from the uploaded resume.",
    source: "Career Roadmap" as const
  }));
}

export function ResumeAnalyzerPage() {
  const [reports, setReports] = useState<ResumeReport[]>([]);
  const [activeReport, setActiveReport] = useState<ResumeReport | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "analyzing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    setStatus("loading");
    setError(null);
    try {
      const response = await listResumeReports();
      setReports(response.reports ?? []);
      setActiveReport(response.reports?.[0] ?? null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resume reports.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Please choose a PDF resume.");
      return;
    }

    setStatus("analyzing");
    setError(null);
    try {
      const response = await analyzeResume(file);
      setReports((current) => [response.report, ...current]);
      setActiveReport(response.report);
      setFile(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze resume.");
      setStatus("ready");
    }
  }

  const roleFitData = useMemo(() => activeReport?.careerRoleFit.map((fit) => ({ role: fit.role, score: fit.fitScore })) ?? [], [activeReport]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-primary">
            <Sparkles size={16} />
            AI Resume Analyzer
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Analyze your resume for ATS, skills, and role fit.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload a PDF resume. The backend extracts text, sends only the resume text to Gemini, and saves your report in MongoDB.
          </p>

          <form className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold" htmlFor="resume">
              Upload PDF resume
            </label>
            <input
              accept="application/pdf"
              className="mt-3 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              id="resume"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <p className="mt-2 text-xs text-muted-foreground">PDF only, max 5 MB. Gemini key stays on the backend.</p>
            {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button className="mt-4" disabled={status === "analyzing"}>
              {status === "analyzing" ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
              {status === "analyzing" ? "Analyzing..." : "Analyze Resume"}
            </Button>
          </form>
        </div>

        <ChartCard title="ATS Score" description="Estimated applicant tracking score from your latest report.">
          {activeReport ? <ProfileCompletionChart value={activeReport.atsScore} /> : <ChartEmpty text="Upload a resume to generate an ATS score." />}
        </ChartCard>
      </section>

      {status === "loading" && <p className="mt-6 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Loading resume reports...</p>}

      {status !== "loading" && !activeReport && (
        <section className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <FileText className="mx-auto text-primary" size={32} />
          <h2 className="mt-4 text-xl font-semibold">No resume reports yet.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Upload your PDF resume to get ATS, skills, projects, and role-fit insights.</p>
        </section>
      )}

      {activeReport && (
        <>
          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <ChartCard title="Missing Skill Gaps" description="Skills Gemini found missing or underrepresented.">
              <SkillGapChart skills={prioritySkills(activeReport)} />
            </ChartCard>
            <ChartCard title="Career Role Fit" description="Roles that fit your resume profile.">
              {roleFitData.length ? (
                <div className="h-64">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={roleFitData} layout="vertical" margin={{ left: 30, right: 10 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                      <XAxis domain={[0, 100]} fontSize={12} type="number" />
                      <YAxis dataKey="role" fontSize={12} type="category" width={110} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#0f766e" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty text="Role fit appears after analysis." />
              )}
            </ChartCard>
            <ChartCard title="Missing Keywords" description="Keywords to consider adding honestly where relevant.">
              <TagList values={activeReport.missingKeywords} />
            </ChartCard>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <InsightPanel title="Strengths" values={activeReport.strengths} />
            <InsightPanel title="Weak Sections" values={activeReport.weakSections} />
            <InsightPanel title="Resume Improvement Tips" values={activeReport.improvementTips} />
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Suggested Projects</h3>
              {activeReport.suggestedProjects.length ? (
                <div className="mt-4 grid gap-3">
                  {activeReport.suggestedProjects.map((project) => (
                    <article className="rounded-lg border border-border p-4" key={project.title}>
                      <p className="font-semibold">{project.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>
                      <TagList values={project.skills} />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No suggested projects returned.</p>
              )}
            </section>
          </section>

          <section className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Previous Resume Reports</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <button
                  className={`rounded-lg border p-4 text-left transition hover:border-primary/60 ${activeReport._id === report._id ? "border-primary bg-primary/5" : "border-border"}`}
                  key={report._id}
                  onClick={() => setActiveReport(report)}
                  type="button"
                >
                  <p className="font-semibold">{report.fileName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">ATS score: {report.atsScore}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function InsightPanel({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      {values.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
          {values.map((value) => (
            <li key={value}>• {value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No items returned.</p>
      )}
    </section>
  );
}

function TagList({ values }: { values: string[] }) {
  if (!values.length) return <p className="mt-3 text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.slice(0, 20).map((value) => (
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}
