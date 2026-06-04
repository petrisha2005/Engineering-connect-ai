import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, Clock, Layers3, ListChecks, Sparkles, Target } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { RoadmapCard } from "../components/roadmaps/RoadmapCard";
import { Button } from "../components/ui/Button";
import { useRoadmapStore } from "../store/roadmapStore";
import type { Certification, InterviewPreparation, PortfolioProject, Roadmap } from "../types/roadmap";

function phases(roadmap: Roadmap) {
  return roadmap.phases || roadmap.learningPath || [];
}

function projectItems(roadmap: Roadmap) {
  if (roadmap.portfolioProjects?.length) {
    return roadmap.portfolioProjects;
  }

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
    return {
      technicalTopics: interviewPreparation,
      codingTopics: [],
      systemDesignBasics: [],
      hrQuestions: []
    };
  }

  return interviewPreparation || { technicalTopics: [], codingTopics: [], systemDesignBasics: [], hrQuestions: [] };
}

export function RoadmapsPage() {
  const { roadmaps, status, error, loadRoadmaps, generateRoadmap } = useRoadmapStore();
  const [careerGoal, setCareerGoal] = useState("");
  const [generatedRoadmap, setGeneratedRoadmap] = useState<Roadmap | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void loadRoadmaps();
  }, [loadRoadmaps]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (!careerGoal.trim()) {
      setLocalError("Career goal is required.");
      return;
    }

    try {
      const roadmap = await generateRoadmap(careerGoal);
      setGeneratedRoadmap(roadmap);
      setCareerGoal("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Unable to generate roadmap right now. Please try again.");
    }
  }

  const activeRoadmap = generatedRoadmap ?? roadmaps[0] ?? null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-primary">
            <Sparkles size={16} />
            AI Career Roadmap
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Generate a clear path for your next engineering career goal.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Enter a target role and get a role-specific 6-month plan with weekly tasks, tools, projects, certifications, interview prep, and milestones.
          </p>

          <form className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold" htmlFor="careerGoal">
              Career goal
            </label>
            <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                id="careerGoal"
                placeholder="Data Scientist, AI Engineer, Full Stack Developer"
                value={careerGoal}
                onChange={(event) => setCareerGoal(event.target.value)}
              />
              <Button disabled={status === "generating"}>
                <Sparkles size={17} />
                {status === "generating" ? "Generating..." : "Generate Roadmap"}
              </Button>
            </div>
            {(localError || (status === "error" && error)) && (
              <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {localError ?? error}
              </p>
            )}
          </form>
        </div>

        <OverviewCard roadmap={activeRoadmap} loading={status === "loading" || status === "generating"} />
      </section>

      {activeRoadmap ? (
        <RoadmapDisplay roadmap={activeRoadmap} />
      ) : (
        status === "ready" && (
          <section className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <Target className="mx-auto text-primary" size={28} />
            <h2 className="mt-4 text-xl font-semibold">No roadmaps generated yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Enter your career goal to create one.</p>
          </section>
        )
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Previous Roadmaps</h2>
            <p className="mt-1 text-sm text-muted-foreground">Saved roadmaps stay available after refresh.</p>
          </div>
        </div>

        {status === "loading" && <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Loading roadmaps...</p>}
        {status === "ready" && roadmaps.length === 0 && (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            No roadmaps generated yet. Enter your career goal to create one.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <RoadmapCard key={roadmap._id} roadmap={roadmap} />
          ))}
        </div>
      </section>
    </main>
  );
}

function OverviewCard({ loading, roadmap }: { loading: boolean; roadmap: Roadmap | null }) {
  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">Generating roadmap...</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Preparing a role-specific plan with weekly tasks, tools, milestones, projects, and interview prep.</p>
      </section>
    );
  }

  if (!roadmap) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">Roadmap preview</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Your generated roadmap will appear here after you enter a career goal.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary">Latest generated roadmap</p>
      <h2 className="mt-3 text-2xl font-semibold">{roadmap.careerGoal || roadmap.desiredCareer}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{roadmap.overview || "Structured roadmap generated for your career goal."}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge icon={<Clock size={14} />} label={roadmap.duration || "6-9 months"} />
        <Badge icon={<BadgeCheck size={14} />} label={roadmap.difficulty || "Intermediate"} />
        <Badge icon={<Layers3 size={14} />} label={`${phases(roadmap).length} phases`} />
      </div>
    </section>
  );
}

function RoadmapDisplay({ roadmap }: { roadmap: Roadmap }) {
  const roadmapPhases = phases(roadmap);
  const recommendedProjects = projectItems(roadmap);
  const certifications = certificationItems(roadmap.certifications);
  const interviewPreparation = interviewGroups(roadmap.interviewPreparation);

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Phase-by-phase learning path</h2>
        <div className="mt-5 space-y-4">
          {roadmapPhases.map((phase, index) => (
            <article className="rounded-lg border border-border p-4" key={`${phase.title}-${index}`}>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <h3 className="font-semibold">
                  {index + 1}. {phase.title}
                </h3>
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{phase.duration}</span>
              </div>
              {phase.goal && <p className="mt-3 text-sm leading-6 text-muted-foreground">{phase.goal}</p>}
              <TagBlock title="Skills" values={phase.skills || []} />
              <TagBlock title="Tools" values={phase.tools || []} />
              <WeeklyPlan items={phase.weeklyPlan || []} />
              <TagBlock title="Mini projects" values={phase.miniProjects || phase.projects || []} />
              <TagBlock title="Resources to search" values={phase.resourcesToSearch || phase.resources || []} />
              <Checklist title="Milestone checklist" values={phase.milestoneChecklist || []} />
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <InfoPanel icon={<BriefcaseBusiness size={18} />} title="Recommended Projects">
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
            <EmptyLine text="No recommended projects returned." />
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

        <InfoPanel icon={<ArrowRight size={18} />} title="Next Steps">
          <BulletList values={roadmap.nextSteps || []} />
        </InfoPanel>
      </div>
    </section>
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

function Checklist({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return <GroupedList title={title} values={values} />;
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
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
