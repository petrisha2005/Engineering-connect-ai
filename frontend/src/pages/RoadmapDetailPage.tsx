import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CalendarDays, Clock, Layers3, ListChecks, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRoadmapById } from "../services/roadmapApi";
import type { Certification, InterviewPreparation, PortfolioProject, Roadmap } from "../types/roadmap";

function phases(roadmap: Roadmap) {
  return roadmap.phases || roadmap.learningPath || [];
}

function projectItems(roadmap: Roadmap) {
  if (roadmap.portfolioProjects?.length) return roadmap.portfolioProjects;

  return roadmap.recommendedProjects?.length
    ? roadmap.recommendedProjects.map((project) => ({
        title: project.title,
        description: project.description,
        features: [],
        skillsUsed: project.skills || [],
        difficulty: "Project",
        resumeValue: "High"
      }))
    : (roadmap.projects || []).map((title) => ({ title, description: "Portfolio project", features: [], skillsUsed: [], difficulty: "Project", resumeValue: "High" }));
}

function certificationItems(certifications: Roadmap["certifications"] = []): Certification[] {
  return certifications.map((certification) =>
    typeof certification === "string" ? { name: certification, whyUseful: "Relevant credential for this career path." } : certification
  );
}

function interviewGroups(interviewPreparation: Roadmap["interviewPreparation"]): InterviewPreparation {
  if (Array.isArray(interviewPreparation)) {
    return { technicalTopics: interviewPreparation, codingTopics: [], systemDesignBasics: [], hrQuestions: [] };
  }

  return interviewPreparation || { technicalTopics: [], codingTopics: [], systemDesignBasics: [], hrQuestions: [] };
}

export function RoadmapDetailPage() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoadmap() {
      if (!id) return;
      setStatus("loading");
      try {
        const response = await getRoadmapById(id);
        setRoadmap(response.roadmap);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load roadmap");
        setStatus("error");
      }
    }

    void loadRoadmap();
  }, [id]);

  if (status === "loading") return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Loading roadmap...</main>;
  if (status === "error" || !roadmap) return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-700">{error ?? "Roadmap not found"}</main>;

  const roadmapTitle = roadmap.careerGoal || roadmap.desiredCareer || "Career roadmap";
  const roadmapPhases = phases(roadmap);
  const recommendedProjects = projectItems(roadmap);
  const certifications = certificationItems(roadmap.certifications);
  const interviewPreparation = interviewGroups(roadmap.interviewPreparation);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/roadmaps">
        <ArrowLeft size={16} />
        Back to roadmaps
      </Link>

      <section className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">AI Career Roadmap</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-semibold">{roadmapTitle}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {roadmap.overview || "Structured roadmap generated for your career goal."}
            </p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Generated {new Date(roadmap.createdAt).toLocaleDateString()}
              {roadmap.model ? ` with ${roadmap.model}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge icon={<Clock size={14} />} label={roadmap.duration || "6 months"} />
            <Badge icon={<BadgeCheck size={14} />} label={roadmap.difficulty || "Beginner to Intermediate"} />
            <Badge icon={<Layers3 size={14} />} label={`${roadmapPhases.length} phases`} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Phase-by-phase learning path</h2>
          {roadmapPhases.length ? (
            <div className="mt-5 space-y-4">
              {roadmapPhases.map((phase, index) => (
                <article className="rounded-lg border border-border p-4" key={`${phase.title}-${index}`}>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <h3 className="font-semibold">
                      {phase.phaseNumber || index + 1}. {phase.title}
                    </h3>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{phase.duration}</span>
                  </div>
                  {phase.goal && <p className="mt-3 text-sm leading-6 text-muted-foreground">{phase.goal}</p>}
                  <TagBlock title="Skills" values={phase.skills || []} />
                  <TagBlock title="Tools" values={phase.tools || []} />
                  <WeeklyPlan items={phase.weeklyPlan || []} />
                  <TagBlock title="Mini projects" values={phase.miniProjects || phase.projects || []} />
                  <TagBlock title="Resources to search" values={phase.resourcesToSearch || phase.resources || []} />
                  <GroupedList title="Milestone checklist" values={phase.milestoneChecklist || []} />
                </article>
              ))}
            </div>
          ) : (
            <EmptyLine text="No learning phases returned." />
          )}
        </div>

        <div className="space-y-6">
          <InfoPanel icon={<BriefcaseBusiness size={18} />} title="Portfolio Projects">
            {recommendedProjects.length ? (
              <div className="space-y-3">
                {recommendedProjects.map((project) => (
                  <article className="rounded-md border border-border p-3" key={project.title}>
                    <p className="font-semibold">{project.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge label={project.difficulty || "Project"} />
                      <Badge label={`${project.resumeValue || "High"} resume value`} />
                    </div>
                    <TagBlock title="Features" values={(project as PortfolioProject).features || []} />
                    <TagBlock title="Skills used" values={(project as PortfolioProject).skillsUsed || []} />
                  </article>
                ))}
              </div>
            ) : (
              <EmptyLine text="No portfolio projects returned." />
            )}
          </InfoPanel>

          <InfoPanel icon={<Sparkles size={18} />} title="Required Mindset">
            <BulletList values={roadmap.requiredMindset || []} />
          </InfoPanel>

          <InfoPanel icon={<BadgeCheck size={18} />} title="Certifications">
            {certifications.length ? (
              <div className="space-y-3">
                {certifications.map((certification) => (
                  <article className="rounded-md border border-border p-3" key={certification.name}>
                    <p className="font-semibold">{certification.name}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{certification.whyUseful}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyLine text="No certifications returned." />
            )}
          </InfoPanel>

          <InfoPanel icon={<ListChecks size={18} />} title="Interview Preparation">
            <GroupedList title="Technical topics" values={interviewPreparation.technicalTopics || []} />
            <GroupedList title="Coding topics" values={interviewPreparation.codingTopics || []} />
            <GroupedList title="System design basics" values={interviewPreparation.systemDesignBasics || []} />
            <GroupedList title="HR questions" values={interviewPreparation.hrQuestions || []} />
          </InfoPanel>

          <InfoPanel icon={<ListChecks size={18} />} title="Common Mistakes">
            <BulletList values={roadmap.commonMistakes || []} />
          </InfoPanel>

          <InfoPanel icon={<CalendarDays size={18} />} title="Final 30-Day Action Plan">
            {roadmap.final30DayPlan?.length ? (
              <div className="space-y-3">
                {roadmap.final30DayPlan.map((item) => (
                  <article className="rounded-md border border-border p-3" key={item.dayRange}>
                    <p className="font-semibold">{item.dayRange}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.focus}</p>
                    <BulletList values={item.actions || []} />
                  </article>
                ))}
              </div>
            ) : (
              <EmptyLine text="No final action plan returned." />
            )}
          </InfoPanel>

          <InfoPanel icon={<ListChecks size={18} />} title="Next Steps">
            <BulletList values={roadmap.nextSteps || []} />
          </InfoPanel>
        </div>
      </section>
    </main>
  );
}

function InfoPanel({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        {icon}
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Badge({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function TagBlock({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <TagRow values={values} />
    </div>
  );
}

function WeeklyPlan({ items }: { items: NonNullable<Roadmap["phases"][number]["weeklyPlan"]> }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weekly plan</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div className="rounded-md border border-border p-3" key={item.week}>
            <p className="text-sm font-semibold">Week {item.week}</p>
            <BulletList values={item.tasks || []} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupedList({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <BulletList values={values} />
    </div>
  );
}

function TagRow({ values }: { values: string[] }) {
  if (!values.length) return <EmptyLine text="No items returned." />;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map((value) => (
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

function BulletList({ values }: { values: string[] }) {
  if (!values.length) return <EmptyLine text="No items returned." />;
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {values.map((value) => (
        <li className="flex gap-2" key={value}>
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          {value}
        </li>
      ))}
    </ul>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="mt-4 text-sm text-muted-foreground">{text}</p>;
}
