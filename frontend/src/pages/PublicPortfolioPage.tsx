import { ExternalLink, FileText, Github, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPublicPortfolio, trackPortfolioEvent } from "../services/portfolioApi";
import type { PortfolioProfile } from "../types/portfolio";

export function PublicPortfolioPage() {
  const { username = "" } = useParams();
  const [params] = useSearchParams();
  const recruiter = params.get("mode") === "recruiter";
  const [portfolio, setPortfolio] = useState<PortfolioProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicPortfolio(username, recruiter)
      .then((response) => setPortfolio(response.portfolio))
      .catch((err) => setError(err instanceof Error ? err.message : "Portfolio unavailable."));
  }, [username, recruiter]);

  if (error) return <main className="min-h-screen bg-slate-950 px-4 py-12 text-red-200">{error}</main>;
  if (!portfolio) return <main className="min-h-screen bg-slate-950 px-4 py-12 text-emerald-100">Loading portfolio...</main>;

  const scoreData = [
    { name: "Technical", value: portfolio.recruiterMode.technicalScore },
    { name: "Innovation", value: portfolio.recruiterMode.innovationScore },
    { name: "Leadership", value: portfolio.recruiterMode.leadershipScore },
    { name: "Career", value: portfolio.recruiterMode.careerReadiness }
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#020617_0%,#052e2b_58%,#064e3b_100%)] text-white">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="inline-flex rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">{portfolio.type} · {portfolio.theme}</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold sm:text-5xl">{portfolio.sections.heroTitle}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-emerald-50/80">{portfolio.sections.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {portfolio.sections.contact.github && <ExternalButton href={portfolio.sections.contact.github} icon={<Github size={16} />} label="GitHub" username={portfolio.username} />}
          {portfolio.sections.contact.linkedin && <ExternalButton href={portfolio.sections.contact.linkedin} icon={<Linkedin size={16} />} label="LinkedIn" username={portfolio.username} />}
          <a className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-slate-950" href={`mailto:${portfolio.sections.contact.email}`}><FileText size={16} /> Contact</a>
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.45fr]">
          <article>
            <h2 className="text-2xl font-semibold">About</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{portfolio.sections.aboutMe}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{portfolio.sections.professionalSummary}</p>
          </article>
          <aside className="rounded-lg border border-emerald-100 bg-emerald-50 p-5">
            <h2 className="font-semibold text-emerald-900">Recruiter Mode</h2>
            <p className="mt-2 text-4xl font-semibold text-emerald-800">{portfolio.recruiterMode.overallScore}</p>
            <ResponsiveContainer height={210} width="100%"><BarChart data={scoreData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#10b981" /></BarChart></ResponsiveContainer>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-semibold">Skills</h2>
        <div className="mt-4 flex flex-wrap gap-2">{portfolio.sections.skills.map((skill) => <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-emerald-100" key={skill}>{skill}</span>)}</div>
        <h2 className="mt-8 text-2xl font-semibold">Projects</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {portfolio.sections.projects.map((project) => (
            <article className="rounded-lg border border-white/10 bg-white/10 p-4" key={project.title}>
              <h3 className="font-semibold">{project.title}</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">{project.description}</p>
              <p className="mt-3 text-sm font-semibold text-emerald-200">Impact {project.impactScore}%</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ExternalButton({ href, icon, label, username }: { href: string; icon: React.ReactNode; label: string; username: string }) {
  return (
    <a className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-50 hover:bg-white/15" href={href} onClick={() => void trackPortfolioEvent(username, "profile_click")} rel="noopener noreferrer" target="_blank">
      {icon}
      {label}
      <ExternalLink size={14} />
    </a>
  );
}
