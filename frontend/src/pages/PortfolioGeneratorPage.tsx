import jsPDF from "jspdf";
import { Download, ExternalLink, FileArchive, FileText, Globe2, Loader2, RefreshCw, Share2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { generatePortfolio, getMyPortfolio, trackPortfolioEvent } from "../services/portfolioApi";
import type { PortfolioProfile, PortfolioResponse, PortfolioThemeName, PortfolioType } from "../types/portfolio";

const TYPES: PortfolioType[] = ["Student Portfolio", "Job Portfolio", "Startup Founder Portfolio", "Research Portfolio", "Freelancer Portfolio"];
const THEMES: PortfolioThemeName[] = ["Modern Developer", "AI Engineer", "Data Scientist", "Startup Founder", "Researcher"];

export function PortfolioGeneratorPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [type, setType] = useState<PortfolioType>("Student Portfolio");
  const [theme, setTheme] = useState<PortfolioThemeName>("Modern Developer");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setStatus("loading");
    setError("");
    try {
      const response = await getMyPortfolio();
      setData(response);
      if (response.portfolio) {
        setType(response.portfolio.type);
        setTheme(response.portfolio.theme);
      }
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load portfolio generator.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    setBusy(true);
    setNotice("");
    try {
      setData(await generatePortfolio(type, theme));
      setNotice("Portfolio generated successfully.");
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate portfolio.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  const portfolio = data?.portfolio ?? null;
  const publicUrl = portfolio ? `${window.location.origin}/portfolio/${portfolio.username}` : "";
  const charts = useMemo(() => portfolio ? {
    radar: [
      { name: "Technical", value: portfolio.recruiterMode.technicalScore },
      { name: "Innovation", value: portfolio.recruiterMode.innovationScore },
      { name: "Leadership", value: portfolio.recruiterMode.leadershipScore },
      { name: "Career", value: portfolio.recruiterMode.careerReadiness }
    ],
    impact: portfolio.sections.projects.slice(0, 8).map((project) => ({ name: project.title.slice(0, 16), impact: project.impactScore })),
    growth: [
      { name: "Skills", value: portfolio.sourceSummary.skillsCount },
      { name: "Projects", value: portfolio.sourceSummary.projectsCount },
      { name: "Hackathons", value: portfolio.sourceSummary.hackathonsCount },
      { name: "Achievements", value: portfolio.sourceSummary.achievementsCount }
    ]
  } : { radar: [], impact: [], growth: [] }, [portfolio]);

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Portfolio Generator...</main>;
  if (status === "error" && !portfolio) return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100"><Sparkles size={16} /> AI Portfolio Generator</p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Generate your professional engineering portfolio automatically.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">Uses your profile, skills, projects, hackathons, Career Twin, Innovation Score, GitHub, LinkedIn, achievements, and activity to create a recruiter-ready portfolio.</p>
          </div>
          <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" disabled={busy} onClick={generate}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {portfolio ? "Regenerate" : "Generate Portfolio"}
          </Button>
        </div>
      </section>

      {notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <section className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Portfolio Setup</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Portfolio Type
              <select className="rounded-md border border-border px-3 py-2 font-normal outline-none focus:border-emerald-400" value={type} onChange={(event) => setType(event.target.value as PortfolioType)}>
                {TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Theme
              <select className="rounded-md border border-border px-3 py-2 font-normal outline-none focus:border-emerald-400" value={theme} onChange={(event) => setTheme(event.target.value as PortfolioThemeName)}>
                {THEMES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Share & Export</h2>
          {portfolio ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase text-emerald-700">Public Portfolio Link</p>
                <a className="mt-1 inline-flex items-center gap-2 break-all text-sm font-semibold text-emerald-800" href={publicUrl} rel="noopener noreferrer" target="_blank">{publicUrl}<ExternalLink size={14} /></a>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void navigator.clipboard.writeText(publicUrl).then(() => setNotice("Portfolio link copied."))}><Share2 size={16} /> Share Link</Button>
                <Button onClick={() => exportPdf(portfolio)}><FileText size={16} /> Export PDF Portfolio</Button>
                <Button onClick={() => exportResume(portfolio)}><Download size={16} /> Export Resume</Button>
                <Button onClick={() => exportZip(portfolio)}><FileArchive size={16} /> Export ZIP</Button>
              </div>
            </div>
          ) : <p className="mt-3 text-sm text-muted-foreground">Generate your portfolio to unlock sharing, PDF, resume, and ZIP export options.</p>}
        </section>
      </section>

      {portfolio ? (
        <>
          <section className="mt-5 grid gap-4 md:grid-cols-4">
            <Metric label="Portfolio Views" value={data?.analytics?.portfolioViews ?? 0} />
            <Metric label="Recruiter Views" value={data?.analytics?.recruiterViews ?? 0} />
            <Metric label="Profile Clicks" value={data?.analytics?.profileClicks ?? 0} />
            <Metric label="Resume Downloads" value={data?.analytics?.resumeDownloads ?? 0} />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <ChartCard title="Skill Radar Chart">
              <ResponsiveContainer height={280} width="100%"><RadarChart data={charts.radar}><PolarGrid /><PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey="value" fill="#10b981" fillOpacity={0.35} stroke="#059669" /><Tooltip /></RadarChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Project Impact Chart">
              <ResponsiveContainer height={280} width="100%"><BarChart data={charts.impact.length ? charts.impact : [{ name: "No projects", impact: 0 }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="impact" fill="#14b8a6" /></BarChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Career Growth Timeline">
              <ResponsiveContainer height={280} width="100%"><LineChart data={charts.growth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="value" stroke="#0f766e" strokeWidth={3} /></LineChart></ResponsiveContainer>
            </ChartCard>
          </section>

          <PortfolioPreview portfolio={portfolio} onProjectClick={(title) => void trackPortfolioEvent(portfolio.username, "project_click", title)} />

          <section className="mt-5 grid gap-4 lg:grid-cols-4">
            <Panel title="Missing Sections" items={portfolio.improvementEngine.missingSections} />
            <Panel title="Project Improvements" items={portfolio.improvementEngine.betterProjectDescriptions} />
            <Panel title="Missing Skills" items={portfolio.improvementEngine.missingSkills} />
            <Panel title="Portfolio Improvements" items={portfolio.improvementEngine.portfolioImprovements} />
          </section>
        </>
      ) : (
        <section className="mt-5 rounded-lg border border-dashed border-emerald-200 bg-card p-8 text-center shadow-sm">
          <Globe2 className="mx-auto text-emerald-500" size={34} />
          <h2 className="mt-3 text-xl font-semibold">No portfolio generated yet</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Complete your profile and click Generate Portfolio. The page will use real EngineerConnect data only.</p>
        </section>
      )}
    </main>
  );
}

function PortfolioPreview({ onProjectClick, portfolio }: { onProjectClick?: (title: string) => void; portfolio: PortfolioProfile }) {
  return (
    <section className="mt-5 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
        <div>
          <p className="text-sm font-semibold text-emerald-700">{portfolio.type} · {portfolio.theme}</p>
          <h2 className="mt-2 text-3xl font-semibold">{portfolio.sections.heroTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{portfolio.sections.heroSubtitle}</p>
          <p className="mt-4 text-sm leading-6">{portfolio.sections.professionalSummary}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Recruiter Mode</p>
          <div className="mt-3 grid gap-2 text-sm text-emerald-950">
            <p>Technical Score: {portfolio.recruiterMode.technicalScore}%</p>
            <p>Innovation Score: {portfolio.recruiterMode.innovationScore}%</p>
            <p>Leadership Score: {portfolio.recruiterMode.leadershipScore}%</p>
            <p>Career Readiness: {portfolio.recruiterMode.careerReadiness}%</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">{portfolio.sections.skills.slice(0, 24).map((skill) => <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" key={skill}>{skill}</span>)}</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {portfolio.sections.projects.map((project) => (
          <button className="rounded-lg border border-border p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50" key={project.title} onClick={() => onProjectClick?.(project.title)} type="button">
            <p className="font-semibold">{project.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>
            <p className="mt-3 text-xs font-semibold text-emerald-700">Impact {project.impactScore}%</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{value}</p></div>;
}

function ChartCard({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Panel({ items, title }: { items: string[]; title: string }) {
  return <section className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{items.length ? items.map((item) => <p className="text-sm leading-5 text-muted-foreground" key={item}>{item}</p>) : <p className="text-sm text-muted-foreground">No suggestions yet.</p>}</div></section>;
}

function portfolioText(portfolio: PortfolioProfile) {
  return [
    portfolio.sections.heroTitle,
    portfolio.sections.heroSubtitle,
    "",
    "Professional Summary",
    portfolio.sections.professionalSummary,
    "",
    "Skills",
    portfolio.sections.skills.join(", "),
    "",
    "Projects",
    ...portfolio.sections.projects.flatMap((project) => [project.title, project.description, `Skills: ${project.skills.join(", ")}`]),
    "",
    "Achievements",
    ...portfolio.sections.achievements,
    "",
    "Contact",
    portfolio.sections.contact.email ?? "",
    portfolio.sections.contact.github ?? "",
    portfolio.sections.contact.linkedin ?? ""
  ].join("\n");
}

function exportPdf(portfolio: PortfolioProfile) {
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(portfolioText(portfolio), 180);
  doc.text(lines, 14, 16);
  doc.save(`${portfolio.username}-portfolio.pdf`);
}

function exportResume(portfolio: PortfolioProfile) {
  downloadBlob(`${portfolio.username}-resume.txt`, new Blob([portfolioText(portfolio)], { type: "text/plain" }));
  void trackPortfolioEvent(portfolio.username, "resume_download");
}

function exportZip(portfolio: PortfolioProfile) {
  const content = JSON.stringify({ portfolio, exportedAt: new Date().toISOString() }, null, 2);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${portfolio.sections.heroTitle}</title></head><body><pre>${escapeHtml(portfolioText(portfolio))}</pre></body></html>`;
  downloadBlob(
    `${portfolio.username}-portfolio.zip`,
    createZip([
      { name: "portfolio.json", content },
      { name: "portfolio.txt", content: portfolioText(portfolio) },
      { name: "index.html", content: html }
    ])
  );
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char] ?? char);
}

function createZip(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    chunks.push(local, data);

    const centralEntry = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralEntry.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    centralEntry.set(name, 46);
    central.push(centralEntry);
    offset += local.length + data.length;
  });

  const centralSize = central.reduce((total, item) => total + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, end].map((part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer), { type: "application/zip" });
}

function crc32(data: Uint8Array) {
  let crc = -1;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}
