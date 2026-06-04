import {
  ArrowRight,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Compass,
  FolderKanban,
  Github,
  GraduationCap,
  Layers3,
  Lightbulb,
  Linkedin,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  Workflow
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Interest Matching",
    description: "Match with students who share your skills, interests, goals, and build style."
  },
  {
    icon: FolderKanban,
    title: "Project Partner Finder",
    description: "Discover real student projects and join teams that need your strengths."
  },
  {
    icon: Trophy,
    title: "Hackathon Team Builder",
    description: "Form balanced teams with role needs, skill gaps, and team readiness in view."
  },
  {
    icon: Compass,
    title: "AI Career Roadmap Generator",
    description: "Turn a target career into skills, projects, certifications, and interview prep."
  },
  {
    icon: GraduationCap,
    title: "Smart Student Profiles",
    description: "Show your college, branch, skills, goals, links, achievements, and projects."
  },
  {
    icon: Sparkles,
    title: "Personalized Recommendations",
    description: "See relevant students, projects, skills, roadmaps, and opportunities in one place."
  }
];

const problems = [
  "Hard to find reliable project teammates",
  "Difficult to form balanced hackathon teams",
  "No clear career roadmap",
  "Limited access to seniors and mentors",
  "Networking is scattered across different apps"
];

const useCases = [
  "Find teammates for college projects",
  "Build balanced hackathon teams",
  "Discover students with similar interests",
  "Generate career learning paths",
  "Find people for startup ideas",
  "Build your professional network early"
];

const steps = [
  "Create your student profile",
  "Add skills, interests, and goals",
  "AI finds matches and opportunities",
  "Collaborate, build projects, and grow"
];

export function LandingPage() {
  const { initialized, status, user } = useAuthStore();
  const isAuthenticated = initialized && status === "authenticated" && Boolean(user);
  const ctaTarget = isAuthenticated ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen scroll-smooth bg-slate-950 text-white">
      <nav className="sticky top-0 z-30 border-b border-emerald-400/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link className="flex items-center gap-3 font-semibold" to="/">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Network size={20} />
            </span>
            EngineerConnect AI
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a className="transition hover:text-emerald-300" href="#features">
              Features
            </a>
            <a className="transition hover:text-emerald-300" href="#how-it-works">
              How It Works
            </a>
            <a className="transition hover:text-emerald-300" href="#use-cases">
              Use Cases
            </a>
            <Link className="transition hover:text-emerald-300" to="/login">
              Login
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-slate-200 transition hover:bg-emerald-400/10 hover:text-emerald-300 md:hidden" to="/login">
              Login
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              to={ctaTarget}
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.30),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(20,184,166,0.24),transparent_28%),linear-gradient(135deg,#020617_0%,#052e2b_45%,#064e3b_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />

        <div className="relative mx-auto grid max-w-7xl gap-7 px-4 py-10 md:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>Built for Engineering Students</Badge>
              <Badge>AI-Powered Matching</Badge>
              <Badge>MVP Ready</Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              AI-Powered Collaboration Platform for Engineering Students
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Find project teammates, build hackathon teams, connect with students who share your goals, and generate personalized career roadmaps using AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300" to={ctaTarget}>
                Get Started
                <ArrowRight size={17} />
              </Link>
              <a className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-5 text-sm font-semibold text-emerald-100 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-emerald-300/15" href="#features">
                Explore Features
                <Sparkles size={17} />
              </a>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section className="bg-emerald-950/25 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SectionIntro
            eyebrow="The Problem"
            title="Engineering students are building in scattered networks."
            text="Students often have ideas, skills, and ambition, but the right teammates and next steps are hard to discover at the right time."
          />
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {problems.map((problem) => (
              <div key={problem} className="rounded-lg border border-emerald-400/15 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300 transition hover:border-emerald-300/40 hover:bg-emerald-950/35">
                <CheckCircle2 className="mb-3 text-emerald-300" size={18} />
                {problem}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">The Solution</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One student collaboration ecosystem for finding people, projects, and direction.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              EngineerConnect AI helps engineering students find teammates, projects, hackathon partners, and career direction in one focused place.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SolutionPillar icon={<UsersRound size={22} />} title="Network" text="Find students by shared skills, college, branch, goals, and interests." />
            <SolutionPillar icon={<Code2 size={22} />} title="Build" text="Join projects, start teams, and turn ideas into portfolio proof." />
            <SolutionPillar icon={<Bot size={22} />} title="Grow" text="Use AI roadmaps and recommendations to plan your next move." />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white" id="features">
        <div className="mx-auto max-w-7xl px-4">
          <SectionIntro
            dark
            eyebrow="Features"
            title="Everything students need to connect and build."
            text="A practical collaboration layer for project work, hackathons, research exploration, and career growth."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-lg border border-emerald-400/15 bg-slate-900/70 p-5 shadow-sm shadow-slate-950/30 transition duration-200 hover:-translate-y-1 hover:border-emerald-300/45 hover:shadow-xl hover:shadow-emerald-500/10">
                  <span className="flex size-11 items-center justify-center rounded-md bg-emerald-400/12 text-emerald-300">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4">
          <SectionIntro
            eyebrow="How It Works"
            title="From profile to collaboration in four steps."
            text="Students create a verified profile, add meaningful signals, and let AI surface the most relevant people and opportunities."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-emerald-400/15 bg-white/[0.04] p-5 transition hover:border-emerald-300/40 hover:bg-emerald-950/30">
                <span className="flex size-10 items-center justify-center rounded-md bg-emerald-400 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/15">{index + 1}</span>
                <p className="mt-5 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-950/20 py-16" id="use-cases">
        <div className="mx-auto max-w-7xl px-4">
          <SectionIntro eyebrow="Use Cases" title="Built for the way engineering students actually work." text="From coursework to founder ideas, the platform helps students find the right people faster." />
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-emerald-400/15 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300 transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-emerald-950/35">
                <Lightbulb className="mt-1 shrink-0 text-emerald-300" size={18} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-4">
          <Stat value="10x" label="faster teammate discovery" />
          <Stat value="AI" label="powered matching" />
          <Stat value="1:1" label="personalized roadmaps" />
          <Stat value="100%" label="built for engineering students" />
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-7xl rounded-lg border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(6,78,59,0.92),rgba(15,118,110,0.45))] p-8 text-center shadow-2xl shadow-emerald-950/40">
          <h2 className="text-3xl font-semibold sm:text-4xl">Start building your engineering network today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Create your profile and let AI connect you with the right students, projects, and opportunities.
          </p>
          <Link className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300" to={ctaTarget}>
            Get Started
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-emerald-400/10 bg-slate-950 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
                <Network size={20} />
              </span>
              EngineerConnect AI
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              AI-powered networking, project collaboration, hackathon teaming, and career growth for engineering students.
            </p>
          </div>
          <FooterLinks title="Quick links" items={["Features", "How It Works", "Use Cases"]} />
          <div>
            <p className="font-semibold">Contact</p>
            <div className="mt-4 flex gap-3 text-slate-400">
              <Github size={19} />
              <Linkedin size={19} />
              <span className="text-sm">hello@engineerconnect.ai</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-emerald-400/20 blur-3xl" />
      <div className="relative rounded-lg border border-emerald-300/20 bg-emerald-950/25 p-4 shadow-2xl shadow-slate-950/50 backdrop-blur-xl md:p-5">
        <div className="flex items-center justify-between border-b border-emerald-300/15 pb-4">
          <div>
            <p className="text-sm font-semibold">AI Match Score</p>
            <p className="mt-1 text-xs text-slate-400">Compatibility from real profile signals</p>
          </div>
          <span className="rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-bold text-slate-950">92%</span>
        </div>
        <div className="mt-4 grid gap-2 md:gap-3">
          <VisualRow icon={<UsersRound size={18} />} title="Recommended Teammates" text="Builders, researchers, designers, founders" />
          <VisualRow icon={<Workflow size={18} />} title="Project Partner Finder" text="Open projects that match your skills" />
          <VisualRow icon={<Layers3 size={18} />} title="Career Roadmap Preview" text="Skills, projects, certifications, interviews" />
        </div>
        <div className="mt-4 hidden rounded-lg border border-emerald-300/15 bg-slate-950/55 p-4 sm:block">
          <div className="flex items-center gap-3">
            <Rocket className="text-teal-300" size={20} />
            <div>
              <p className="text-sm font-semibold">Hackathon team ready</p>
              <p className="mt-1 text-xs text-slate-400">Product, research, design, and pitch roles balanced</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualRow({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-emerald-300/15 bg-white/[0.06] p-3 transition hover:border-emerald-300/35 hover:bg-emerald-300/10 md:p-4">
      <span className="flex size-10 items-center justify-center rounded-md bg-emerald-400/12 text-emerald-300">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 backdrop-blur">{children}</span>;
}

function SectionIntro({ dark, eyebrow, text, title }: { dark?: boolean; eyebrow: string; text: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className={dark ? "text-sm font-semibold uppercase tracking-wide text-emerald-300" : "text-sm font-semibold uppercase tracking-wide text-emerald-300"}>{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h2>
      <p className={dark ? "mt-4 text-sm leading-7 text-slate-400" : "mt-4 text-sm leading-7 text-slate-300"}>{text}</p>
    </div>
  );
}

function SolutionPillar({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="rounded-lg border border-emerald-400/15 bg-white/[0.05] p-5 transition hover:border-emerald-300/40 hover:bg-emerald-950/30">
      <div className="text-emerald-300">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-400/15 bg-white/[0.05] p-5 text-center transition hover:border-emerald-300/40 hover:bg-emerald-950/30">
      <p className="text-3xl font-semibold text-emerald-300">{value}</p>
      <p className="mt-2 text-sm font-medium text-slate-300">{label}</p>
    </div>
  );
}

function FooterLinks({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-400">
        {items.map((item) => (
          <a key={item} className="transition hover:text-emerald-300" href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}
