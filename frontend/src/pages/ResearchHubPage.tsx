import { BookOpenCheck, Bot, FlaskConical, Loader2, Plus, RefreshCw, Send, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { askResearchAssistant, createResearchProject, generateResearchTopics, getResearchHub, saveResearchProfile, sendResearchRequest } from "../services/researchHubApi";
import type { ResearchDomain, ResearchHubResponse } from "../types/researchHub";

const DOMAINS: ResearchDomain[] = ["Artificial Intelligence", "Machine Learning", "Data Science", "Cybersecurity", "Blockchain", "IoT", "Robotics", "Cloud Computing", "Computer Vision", "NLP", "Software Engineering", "Sustainable Technology"];

type ResearchProfileForm = {
  researchDomains: ResearchDomain[];
  interests: string;
  preferredTopics: string;
  researchGoals: string;
  skills: string;
  researchExperience: "beginner" | "intermediate" | "advanced" | "published";
  preferredCollaborationMode: "remote" | "in_person" | "hybrid";
  availability: "low" | "medium" | "high";
  bio: string;
};

export function ResearchHubPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [data, setData] = useState<ResearchHubResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<ResearchProfileForm>({ researchDomains: ["Machine Learning"], interests: "", preferredTopics: "", researchGoals: "", skills: "", researchExperience: "beginner", preferredCollaborationMode: "remote", availability: "medium", bio: "" });
  const [project, setProject] = useState({ title: "", abstract: "", domain: "Machine Learning" as ResearchDomain, problemStatement: "", objectives: "", requiredSkills: "", teamSize: 4, duration: "3-6 months", publicationGoal: "Conference or journal submission" });
  const [topicDomain, setTopicDomain] = useState<ResearchDomain>("Machine Learning");
  const [topics, setTopics] = useState<Array<{ title: string; difficulty: string; impactScore: number; whyItMatters: string; suggestedDataset: string }>>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function load() {
    setStatus("loading");
    setError("");
    try {
      const response = await getResearchHub();
      setData(response);
      if (response.researchProfile) {
        setProfile({
          researchDomains: response.researchProfile.researchDomains.length ? response.researchProfile.researchDomains : ["Machine Learning"],
          interests: response.researchProfile.interests.join(", "),
          preferredTopics: response.researchProfile.preferredTopics.join(", "),
          researchGoals: response.researchProfile.researchGoals.join(", "),
          skills: response.researchProfile.skills.join(", "),
          researchExperience: response.researchProfile.researchExperience,
          preferredCollaborationMode: response.researchProfile.preferredCollaborationMode,
          availability: response.researchProfile.availability,
          bio: response.researchProfile.bio ?? ""
        });
      }
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Research Hub.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const charts = useMemo(() => {
    const readiness = data?.readiness;
    const domainCounts = DOMAINS.map((domain) => ({ domain, count: data?.projects.filter((item) => item.domain === domain).length ?? 0 })).filter((item) => item.count > 0);
    const stages = data?.myProjects[0]?.publicationStages ?? [];
    return {
      radar: readiness ? [
        { name: "Skills", value: readiness.researchSkillScore },
        { name: "Publication", value: readiness.publicationReadiness },
        { name: "Collab", value: readiness.collaborationReadiness },
        { name: "Innovation", value: readiness.innovationScore }
      ] : [],
      domains: domainCounts,
      stages,
      trend: stages.map((stage) => ({ name: stage.stage, progress: stage.progress }))
    };
  }, [data]);

  async function saveProfile() {
    setBusy("profile");
    try {
      await saveResearchProfile({ ...profile, interests: split(profile.interests), preferredTopics: split(profile.preferredTopics), researchGoals: split(profile.researchGoals), skills: split(profile.skills) });
      setNotice("Research profile saved.");
      await load();
    } finally {
      setBusy("");
    }
  }

  async function saveProject() {
    if (!project.title || !project.abstract || !project.problemStatement) return setError("Research project title, abstract, and problem statement are required.");
    setBusy("project");
    try {
      await createResearchProject({ ...project, objectives: split(project.objectives), requiredSkills: split(project.requiredSkills) } as any);
      setNotice("Research project created.");
      setProject({ ...project, title: "", abstract: "", problemStatement: "", objectives: "", requiredSkills: "" });
      await load();
    } finally {
      setBusy("");
    }
  }

  async function generateTopics() {
    setBusy("topics");
    try {
      const response = await generateResearchTopics(topicDomain, split(profile.interests));
      setTopics(response.topics);
    } finally {
      setBusy("");
    }
  }

  async function askAssistant() {
    if (!question.trim()) return;
    setBusy("assistant");
    try {
      const response = await askResearchAssistant(question);
      setAnswer(response.answer);
    } finally {
      setBusy("");
    }
  }

  async function requestCollaboration(recipient: string, matchScore: number) {
    setBusy(`request-${recipient}`);
    try {
      await sendResearchRequest({ recipient, type: "collaboration", message: "I would like to collaborate on research through EngineerConnect AI.", matchScore });
      setNotice("Research collaboration request sent.");
    } finally {
      setBusy("");
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading Research Hub...</main>;
  if (status === "error" || !data) return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-red-700">{error}</main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100"><FlaskConical size={16} /> AI Research Collaboration Hub</p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Find collaborators, mentors, research projects, and publication momentum.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">Central research workspace for student innovation, AI topic discovery, team formation, publication tracking, and research readiness.</p>
          </div>
          <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" onClick={() => void load()}><RefreshCw size={16} /> Refresh</Button>
        </div>
      </section>

      {notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      <section className="mt-5 grid gap-4 md:grid-cols-5">
        <Metric label="Research Readiness" value={data.readiness.overall} />
        <Metric label="Skill Score" value={data.readiness.researchSkillScore} />
        <Metric label="Publication Ready" value={data.readiness.publicationReadiness} />
        <Metric label="Collaboration" value={data.readiness.collaborationReadiness} />
        <Metric label="Innovation" value={data.readiness.innovationScore} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Research Skill Radar"><ResponsiveContainer height={280} width="100%"><RadarChart data={charts.radar}><PolarGrid /><PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} /><Radar dataKey="value" fill="#10b981" fillOpacity={0.35} stroke="#059669" /><Tooltip /></RadarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Domain Interest Distribution"><ResponsiveContainer height={280} width="100%"><BarChart data={charts.domains.length ? charts.domains : [{ domain: "No projects", count: 0 }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="domain" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#14b8a6" /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Publication Progress Timeline"><ResponsiveContainer height={280} width="100%"><LineChart data={charts.trend.length ? charts.trend : [{ name: "Start", progress: 0 }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="progress" stroke="#0f766e" strokeWidth={3} /></LineChart></ResponsiveContainer></ChartCard>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Create Research Profile">
          <div className="grid gap-3">
            <select multiple className="min-h-28 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={profile.researchDomains} onChange={(event) => setProfile({ ...profile, researchDomains: Array.from(event.target.selectedOptions).map((option) => option.value as ResearchDomain) })}>{DOMAINS.map((domain) => <option key={domain}>{domain}</option>)}</select>
            <Input label="Interests" value={profile.interests} onChange={(value) => setProfile({ ...profile, interests: value })} placeholder="healthcare ai, privacy, explainable ml" />
            <Input label="Skills" value={profile.skills} onChange={(value) => setProfile({ ...profile, skills: value })} placeholder="python, ml, statistics" />
            <Input label="Preferred Topics" value={profile.preferredTopics} onChange={(value) => setProfile({ ...profile, preferredTopics: value })} />
            <Input label="Research Goals" value={profile.researchGoals} onChange={(value) => setProfile({ ...profile, researchGoals: value })} />
            <textarea className="min-h-24 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Research bio" />
            <Button disabled={busy === "profile"} onClick={saveProfile}>{busy === "profile" ? <Loader2 className="animate-spin" size={16} /> : <BookOpenCheck size={16} />} Save Research Profile</Button>
          </div>
        </Card>

        <Card title="Create Research Project">
          <div className="grid gap-3">
            <Input label="Title" value={project.title} onChange={(value) => setProject({ ...project, title: value })} />
            <select className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={project.domain} onChange={(event) => setProject({ ...project, domain: event.target.value as ResearchDomain })}>{DOMAINS.map((domain) => <option key={domain}>{domain}</option>)}</select>
            <textarea className="min-h-20 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={project.abstract} onChange={(event) => setProject({ ...project, abstract: event.target.value })} placeholder="Abstract" />
            <textarea className="min-h-20 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={project.problemStatement} onChange={(event) => setProject({ ...project, problemStatement: event.target.value })} placeholder="Problem statement" />
            <Input label="Objectives" value={project.objectives} onChange={(value) => setProject({ ...project, objectives: value })} />
            <Input label="Required Skills" value={project.requiredSkills} onChange={(value) => setProject({ ...project, requiredSkills: value })} />
            <Button disabled={busy === "project"} onClick={saveProject}>{busy === "project" ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Create Project</Button>
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card title="AI Research Collaborators">
          <div className="grid gap-3">{data.collaboratorMatches.length ? data.collaboratorMatches.map((match) => <div className="rounded-lg border border-border p-3" key={match.profile._id}><div className="flex justify-between gap-2"><p className="font-semibold">{match.profile.user?.displayName ?? "Researcher"}</p><span className="text-sm font-semibold text-emerald-700">{match.matchScore}%</span></div><p className="mt-1 text-sm text-muted-foreground">{match.compatibilityReason}</p><p className="mt-1 text-xs text-muted-foreground">{match.suggestedRole} · {match.collaborationPotential}</p><Button className="mt-3" disabled={busy === `request-${match.profile.user?._id}`} onClick={() => match.profile.user?._id && void requestCollaboration(match.profile.user._id, match.matchScore)}><Send size={15} /> Request</Button></div>) : <Empty text="Create your research profile to unlock collaborator matches." />}</div>
        </Card>
        <Card title="Faculty Mentor Directory">
          <div className="grid gap-3">{data.mentors.length ? data.mentors.slice(0, 8).map((mentor) => <div className="rounded-lg border border-border p-3" key={mentor._id}><p className="font-semibold">{mentor.name}</p><p className="text-sm text-muted-foreground">{mentor.department}</p><p className="mt-1 text-sm text-muted-foreground">{mentor.expertise}</p><Button className="mt-3" onClick={() => void sendResearchRequest({ facultyMentor: mentor._id, type: "mentorship", message: "I would like research mentorship through EngineerConnect AI." }).then(() => setNotice("Mentorship request sent."))}>Request Mentorship</Button></div>) : <Empty text="No faculty mentor profiles in MongoDB yet." />}</div>
        </Card>
        <Card title="Research Opportunities">
          <div className="grid gap-3">{data.opportunities.length ? data.opportunities.map((opportunity) => <div className="rounded-lg border border-border p-3" key={opportunity._id}><p className="font-semibold">{opportunity.title}</p><p className="text-sm text-muted-foreground">{opportunity.provider} · {opportunity.type}</p></div>) : <Empty text="No research opportunities stored yet." />}</div>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Research Project Board">
          <div className="grid gap-3">{data.projectAnalyses.length ? data.projectAnalyses.map((item) => <div className="rounded-lg border border-border p-4" key={item.project._id}><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{item.project.title}</p><span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{item.project.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.project.abstract}</p><p className="mt-2 text-xs text-muted-foreground">Missing: {[...item.missingSkills, ...item.missingRoles].slice(0, 5).join(", ") || "No major gaps detected"}</p><Button className="mt-3" onClick={() => void sendResearchRequest({ project: item.project._id, type: "join_project", message: "I would like to join this research project." }).then(() => setNotice("Join request sent."))}>Join Project</Button></div>) : <Empty text="Create or join research projects to start tracking publication progress." />}</div>
        </Card>
        <Card title="AI Research Topic Generator">
          <div className="grid gap-3">
            <select className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={topicDomain} onChange={(event) => setTopicDomain(event.target.value as ResearchDomain)}>{DOMAINS.map((domain) => <option key={domain}>{domain}</option>)}</select>
            <Button disabled={busy === "topics"} onClick={generateTopics}>{busy === "topics" ? <Loader2 className="animate-spin" size={16} /> : <FlaskConical size={16} />} Generate Topics</Button>
            <div className="grid gap-2">{topics.map((topic) => <div className="rounded-lg border border-border p-3" key={topic.title}><p className="font-semibold">{topic.title}</p><p className="text-sm text-muted-foreground">{topic.difficulty} · Impact {topic.impactScore}%</p><p className="mt-1 text-sm text-muted-foreground">{topic.whyItMatters}</p></div>)}</div>
          </div>
        </Card>
      </section>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold"><Bot className="text-emerald-600" size={18} /> AI Research Assistant</h2>
        <div className="mt-4 grid gap-3">
          <textarea className="min-h-24 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-emerald-400" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask: suggest papers to read, datasets, collaborators, or research topics..." />
          <Button className="w-fit" disabled={busy === "assistant"} onClick={askAssistant}>{busy === "assistant" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Ask Assistant</Button>
          {answer && <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{answer}</p>}
        </div>
      </section>
    </main>
  );
}

function split(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
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

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{text}</p>;
}
