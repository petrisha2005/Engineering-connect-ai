import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Code2,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Map,
  Save,
  Sparkles,
  Target,
  Trophy,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { getActivitySummary } from "../services/activityApi";
import { getSkillsToImprove } from "../services/recommendationApi";
import { useAuthStore } from "../store/authStore";
import { useHackathonTeamStore } from "../store/hackathonTeamStore";
import { useMatchStore } from "../store/matchStore";
import { useProfileStore } from "../store/profileStore";
import { useProjectStore } from "../store/projectStore";
import { useRoadmapStore } from "../store/roadmapStore";
import type { AppUser } from "../types/auth";
import type { HackathonTeam } from "../types/hackathonTeam";
import type { StudentMatch } from "../types/match";
import type { ProfilePayload, StudentProfile } from "../types/profile";
import type { Project } from "../types/project";
import type { Roadmap } from "../types/roadmap";
import type { SkillSuggestion } from "../types/recommendation";
import type { ActivitySummary, NotificationItem } from "../types/activity";

const GITHUB_PROFILE_REGEX = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/;
const LINKEDIN_PROFILE_REGEX = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?$/;

function userName(user: string | AppUser) {
  return typeof user === "string" ? "Student" : user.displayName;
}

function matchProfile(match: StudentMatch) {
  return typeof match.targetUser === "string" ? undefined : match.targetUser.profile;
}

function completionItems(profile: ReturnType<typeof useProfileStore.getState>["profile"]) {
  return [
    { label: "College and branch", complete: Boolean(profile?.college && profile.branch) },
    { label: "Skills", complete: Boolean(profile?.skills?.length) },
    { label: "Interests", complete: Boolean(profile?.interests?.length) },
    { label: "Career goals", complete: Boolean(profile?.goals?.length) },
    { label: "Projects", complete: Boolean(profile?.projects?.length) },
    { label: "Professional links", complete: Boolean(profile?.github || profile?.linkedin) }
  ];
}

function hasCompletedOnboarding(profile: ReturnType<typeof useProfileStore.getState>["profile"]) {
  return Boolean(
    profile?.college &&
      profile.branch &&
      profile.year &&
      profile.skills.length &&
      profile.interests.length &&
      profile.goals.length &&
      profile.github &&
      profile.linkedin
  );
}

function splitList(value: string) {
  return value
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeListText(value: string) {
  return splitList(value).join(", ");
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { profile, status: profileStatus, loadMyProfile, saveProfile } = useProfileStore();
  const { matches, status: matchStatus, loadMatches, refreshMatches } = useMatchStore();
  const { projects, status: projectStatus, loadProjects } = useProjectStore();
  const { teams, status: teamStatus, loadTeams } = useHackathonTeamStore();
  const { roadmaps, status: roadmapStatus, loadRoadmaps } = useRoadmapStore();
  const [skillSuggestions, setSkillSuggestions] = useState<SkillSuggestion[]>([]);
  const [skillStatus, setSkillStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [skillError, setSkillError] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<NotificationItem[]>([]);
  const [activityStatus, setActivityStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  async function loadSkillSuggestions() {
    setSkillStatus("loading");
    setSkillError(null);
    try {
      const response = await getSkillsToImprove();
      setSkillSuggestions(response.skillsToImprove ?? []);
      setSkillStatus("ready");
    } catch (err) {
      setSkillSuggestions([]);
      setSkillStatus("error");
      setSkillError(err instanceof Error ? err.message : "Unable to load skill suggestions");
    }
  }

  async function loadActivitySummary() {
    setActivityStatus("loading");
    try {
      const response = await getActivitySummary();
      setActivitySummary(response.summary);
      setRecentActivity(response.recentActivity ?? []);
      setActivityStatus("ready");
    } catch {
      setActivitySummary(null);
      setRecentActivity([]);
      setActivityStatus("error");
    }
  }

  useEffect(() => {
    void loadMyProfile();
    void loadMatches();
    void loadProjects({ status: "open", limit: 6 });
    void loadTeams({ status: "forming", limit: 6 });
    void loadRoadmaps();
    void loadSkillSuggestions();
    void loadActivitySummary();
  }, [loadMatches, loadMyProfile, loadProjects, loadRoadmaps, loadTeams]);

  const profileCompletion = completionItems(profile);
  const completedItems = profileCompletion.filter((item) => item.complete).length;
  const completionPercent = Math.round((completedItems / profileCompletion.length) * 100);
  const recommendedStudents = matches.slice(0, 3);
  const recommendedProjects = projects.slice(0, 3);
  const recommendedTeams = teams.slice(0, 3);
  const latestRoadmap = roadmaps[0];
  const showProfileSetup = !hasCompletedOnboarding(profile);

  async function handleProfileSetup(payload: ProfilePayload) {
    await saveProfile(payload);
    await loadMyProfile();
    await Promise.allSettled([
      refreshMatches(),
      loadProjects({ status: "open", limit: 6 }),
      loadTeams({ status: "forming", limit: 6 }),
      loadRoadmaps(),
      loadSkillSuggestions(),
      loadActivitySummary()
    ]);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground">
            <Sparkles size={16} className="text-primary" />
            Student collaboration workspace
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Welcome back, {profile?.name || user?.displayName || "Student"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Your dashboard is powered by live MongoDB data from profiles, matches, projects, hackathon teams, and roadmaps.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <Metric label="Matches" value={matches.length} />
          <Metric label="Projects" value={projects.length} />
          <Metric label="Roadmaps" value={roadmaps.length} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <ProfileCompletionCard
          completedItems={completedItems}
          completionPercent={completionPercent}
          items={profileCompletion}
          loading={profileStatus === "loading"}
          profileExists={Boolean(profile)}
        />

        <DashboardCard
          actionLabel="Open matches"
          actionTo="/matches"
          description="Students ranked by compatibility, shared skills, interests, and career goals."
          icon={<UserRound size={18} />}
          title="Recommended Students"
        >
          {matchStatus === "loading" ? (
            <LoadingState label="Loading recommended students..." />
          ) : recommendedStudents.length ? (
            <div className="grid gap-3">
              {recommendedStudents.map((match) => (
                <StudentPreview key={match._id} match={match} />
              ))}
            </div>
          ) : (
            <EmptyState
              label="No recommendations yet"
              text="Create a complete profile, then generate matches from the matches page."
              to="/matches"
              action="Generate matches"
            />
          )}
        </DashboardCard>
      </section>

      {showProfileSetup && (
        <section className="mt-4">
          <ProfileSetupCard
            defaultName={profile?.name || user?.displayName || "Student"}
            isSaving={profileStatus === "loading"}
            onSubmit={handleProfileSetup}
            profile={profile}
          />
        </section>
      )}

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.7fr_0.8fr_1.1fr]">
        <ActivityWidget
          icon={<Bell size={18} />}
          label="Pending Connection Requests"
          loading={activityStatus === "loading"}
          text="Requests waiting for your response."
          to="/activity"
          value={activitySummary?.pendingConnections ?? 0}
        />
        <ApplicationStatusWidget loading={activityStatus === "loading"} summary={activitySummary} />
        <DashboardCard
          actionLabel="Open activity"
          actionTo="/activity"
          description="Latest request, application, and notification updates."
          icon={<Bell size={18} />}
          title="Recent Activity"
        >
          {activityStatus === "loading" ? (
            <LoadingState label="Loading recent activity..." />
          ) : recentActivity.length ? (
            <div className="grid gap-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div className="rounded-lg border border-border p-3" key={activity._id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{activity.title}</p>
                    {!activity.readAt && <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">New</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{activity.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No recent activity" text="Requests, applications, and notifications will appear here." to="/activity" action="Open activity" />
          )}
        </DashboardCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <DashboardCard
          actionLabel="Browse projects"
          actionTo="/projects"
          description="Open collaborations from the project marketplace."
          icon={<FolderKanban size={18} />}
          title="Recommended Projects"
        >
          {projectStatus === "loading" ? (
            <LoadingState label="Loading projects..." />
          ) : recommendedProjects.length ? (
            <PreviewList>
              {recommendedProjects.map((project) => (
                <ProjectPreview key={project._id} project={project} />
              ))}
            </PreviewList>
          ) : (
            <EmptyState label="No open projects" text="Create the first project and invite collaborators." to="/projects/new" action="Create project" />
          )}
        </DashboardCard>

        <DashboardCard
          actionLabel="Open teams"
          actionTo="/hackathons"
          description="Teams currently forming for hackathons and build sprints."
          icon={<Trophy size={18} />}
          title="Hackathon Team Suggestions"
        >
          {teamStatus === "loading" ? (
            <LoadingState label="Loading teams..." />
          ) : recommendedTeams.length ? (
            <PreviewList>
              {recommendedTeams.map((team) => (
                <TeamPreview key={team._id} team={team} />
              ))}
            </PreviewList>
          ) : (
            <EmptyState label="No teams forming" text="Start a hackathon team and define the roles you need." to="/hackathons/new" action="Create team" />
          )}
        </DashboardCard>

        <DashboardCard
          actionLabel="Open roadmaps"
          actionTo="/roadmaps"
          description="Latest AI-generated plan for career growth."
          icon={<Map size={18} />}
          title="Career Roadmap Preview"
        >
          {roadmapStatus === "loading" ? (
            <LoadingState label="Loading roadmaps..." />
          ) : latestRoadmap ? (
            <RoadmapPreview roadmap={latestRoadmap} />
          ) : (
            <EmptyState label="No roadmap yet" text="Generate a Gemini roadmap for your target career." to="/roadmaps" action="Generate roadmap" />
          )}
        </DashboardCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <DashboardCard
          actionLabel="Edit profile"
          actionTo="/profile"
          description="Personalized technical gaps from your profile, career goal, latest roadmap, and open project needs."
          icon={<Target size={18} />}
          title="Skills To Improve"
        >
          {skillStatus === "loading" ? (
            <LoadingState label="Loading personalized skill suggestions..." />
          ) : skillStatus === "error" ? (
            <ErrorState label="Unable to load skills" text={skillError ?? "Try refreshing the dashboard after backend is running."} />
          ) : skillSuggestions.length ? (
            <div className="grid gap-3">
              {skillSuggestions.map((suggestion) => (
                <SkillSuggestionCard key={`${suggestion.skill}-${suggestion.source}`} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <EmptyState
              label="No skill gaps detected"
              text="Complete your profile and generate a career roadmap to get personalized skill suggestions."
              to="/roadmaps"
              action="Open roadmaps"
            />
          )}
        </DashboardCard>

        <DashboardCard
          actionLabel="Discover students"
          actionTo="/discover"
          description="Your active profile signals used by matching and marketplace discovery."
          icon={<GraduationCap size={18} />}
          title="Profile Signals"
        >
          {profile ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SignalBlock icon={<Code2 size={17} />} title="Skills" values={profile.skills} />
              <SignalBlock icon={<Lightbulb size={17} />} title="Interests" values={profile.interests} />
              <SignalBlock icon={<BriefcaseBusiness size={17} />} title="Goals" values={profile.goals} />
            </div>
          ) : (
            <EmptyState label="Profile needed" text="Create your student profile to unlock matching and recommendations." to="/profile" action="Create profile" />
          )}
        </DashboardCard>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardCard({
  actionLabel,
  actionTo,
  children,
  description,
  icon,
  title
}: {
  actionLabel: string;
  actionTo: string;
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            {icon}
            {title}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Link className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary sm:inline-flex" to={actionTo}>
          {actionLabel}
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ActivityWidget({
  icon,
  label,
  loading,
  text,
  to,
  value
}: {
  icon: ReactNode;
  label: string;
  loading: boolean;
  text: string;
  to: string;
  value: number;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {icon}
          {label}
        </div>
        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary" to={to}>
          View
          <ArrowRight size={15} />
        </Link>
      </div>
      <p className="mt-5 text-3xl font-semibold">{loading ? "..." : value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </section>
  );
}

function ApplicationStatusWidget({ loading, summary }: { loading: boolean; summary: ActivitySummary | null }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <FolderKanban size={18} />
          Project Application Status
        </div>
        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary" to="/activity">
          Track
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniStat label="Pending" value={loading ? 0 : (summary?.pendingApplications ?? 0)} />
        <MiniStat label="Accepted" value={loading ? 0 : (summary?.acceptedApplications ?? 0)} />
        <MiniStat label="Received" value={loading ? 0 : (summary?.receivedApplications ?? 0)} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Live status from applications sent by you and received on projects you own.</p>
    </section>
  );
}

function ProfileCompletionCard({
  completedItems,
  completionPercent,
  items,
  loading,
  profileExists
}: {
  completedItems: number;
  completionPercent: number;
  items: Array<{ label: string; complete: boolean }>;
  loading: boolean;
  profileExists: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 size={18} />
            Profile Completion
          </div>
          <h2 className="mt-3 text-2xl font-semibold">{loading ? "Checking profile..." : `${completionPercent}% complete`}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {profileExists
              ? "Complete profiles rank better in matching, project discovery, and team suggestions."
              : "Create a profile so recommendations can use your real skills, interests, and career goals."}
          </p>
        </div>
        <Link className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary" to="/profile">
          {profileExists ? "Update" : "Create"}
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.complete ? <CheckCircle2 size={16} className="text-primary" /> : <CircleAlert size={16} className="text-muted-foreground" />}
            <span className={item.complete ? "font-medium" : "text-muted-foreground"}>{item.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">
        {completedItems}/{items.length} profile signals ready
      </p>
    </section>
  );
}

function ProfileSetupCard({
  defaultName,
  isSaving,
  onSubmit,
  profile
}: {
  defaultName: string;
  isSaving: boolean;
  onSubmit: (payload: ProfilePayload) => Promise<void>;
  profile: StudentProfile | null;
}) {
  const initialForm = useMemo(
    () => ({
      college: profile?.college ?? "",
      branch: profile?.branch ?? "",
      year: String(profile?.year ?? 1),
      skills: profile?.skills?.join(", ") ?? "",
      interests: profile?.interests?.join(", ") ?? "",
      careerGoal: profile?.goals?.[0] ?? "",
      github: profile?.github ?? "",
      linkedin: profile?.linkedin ?? ""
    }),
    [profile]
  );
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ github?: string; linkedin?: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "github" || field === "linkedin") {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const skills = splitList(form.skills);
    const interests = splitList(form.interests);
    const careerGoal = form.careerGoal.trim();

    if (!skills.length || !interests.length || !careerGoal) {
      setError("Add at least one skill, one interest, and one career goal.");
      return;
    }

    const nextFieldErrors: { github?: string; linkedin?: string } = {};
    if (!form.github.trim()) {
      nextFieldErrors.github = "GitHub Link is required";
    } else if (!GITHUB_PROFILE_REGEX.test(form.github.trim())) {
      nextFieldErrors.github = "Please enter a valid GitHub profile URL. Example: https://github.com/username";
    }

    if (!form.linkedin.trim()) {
      nextFieldErrors.linkedin = "LinkedIn Link is required";
    } else if (!LINKEDIN_PROFILE_REGEX.test(form.linkedin.trim())) {
      nextFieldErrors.linkedin = "Please enter a valid LinkedIn profile URL. Example: https://www.linkedin.com/in/username";
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    const payload: ProfilePayload = {
      name: profile?.name || defaultName,
      college: form.college.trim(),
      branch: form.branch.trim(),
      year: Number(form.year),
      skills,
      interests,
      goals: [careerGoal],
      github: form.github.trim(),
      linkedin: form.linkedin.trim(),
      achievements: profile?.achievements ?? [],
      availability: profile?.availability ?? "open",
      headline: profile?.headline || `${form.branch.trim()} student exploring ${careerGoal}`,
      bio: profile?.bio ?? "",
      location: profile?.location ?? "",
      projects: profile?.projects ?? []
    };

    try {
      await onSubmit(payload);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    }
  }

  return (
    <section className="rounded-lg border border-primary/30 bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles size={18} />
            Profile Setup
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Complete your profile to unlock recommendations</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            These fields are saved to MongoDB and used by the matching engine, project marketplace, hackathon suggestions, and dashboard skill signals.
          </p>
        </div>
        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary" to="/profile">
          Full profile editor
          <ArrowRight size={15} />
        </Link>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <SetupField label="College" value={form.college} onChange={(value) => updateField("college", value)} required />
          <SetupField label="Branch" value={form.branch} onChange={(value) => updateField("branch", value)} required />
          <SetupField label="Year" type="number" min="1" max="6" value={form.year} onChange={(value) => updateField("year", value)} required />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SetupTextArea
            label="Skills"
            value={form.skills}
            onChange={(value) => updateField("skills", value)}
            onPasteValue={(value) => updateField("skills", normalizeListText(value))}
            placeholder="react, python, machine learning"
            required
          />
          <SetupTextArea
            label="Interests"
            value={form.interests}
            onChange={(value) => updateField("interests", value)}
            onPasteValue={(value) => updateField("interests", normalizeListText(value))}
            placeholder="hackathons, ai products, research"
            required
          />
          <SetupTextArea
            label="Career goal"
            value={form.careerGoal}
            onChange={(value) => updateField("careerGoal", value)}
            onPasteValue={(value) => updateField("careerGoal", normalizeListText(value))}
            placeholder="machine learning engineer"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SetupField
            label="GitHub Link"
            value={form.github}
            onChange={(value) => updateField("github", value)}
            placeholder="https://github.com/username"
            error={fieldErrors.github}
            required
          />
          <SetupField
            label="LinkedIn Link"
            value={form.linkedin}
            onChange={(value) => updateField("linkedin", value)}
            placeholder="https://www.linkedin.com/in/username"
            error={fieldErrors.linkedin}
            required
          />
        </div>

        {error && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Profile saved. Recommendations are refreshing.</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button disabled={isSaving}>
            <Save size={17} />
            {isSaving ? "Saving profile..." : "Save and refresh recommendations"}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">Use commas for multiple skills and interests.</p>
        </div>
      </form>
    </section>
  );
}

function StudentPreview({ match }: { match: StudentMatch }) {
  const profile = matchProfile(match);
  const name = profile?.name ?? (typeof match.targetUser === "string" ? "Student" : match.targetUser.displayName);

  return (
    <Link className="rounded-lg border border-border p-4 transition hover:border-primary/60 hover:bg-muted/45" to="/matches">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile ? `${profile.branch} · Year ${profile.year}` : "Profile details available in matches"}
          </p>
        </div>
        <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">{match.matchScore}%</span>
      </div>
      <TagRow values={[...(match.sharedSkills ?? []), ...(match.sharedInterests ?? [])].slice(0, 4)} />
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{match.reasons?.[0] ?? "Recommended from matching signals."}</p>
    </Link>
  );
}

function ProjectPreview({ project }: { project: Project }) {
  return (
    <Link className="block rounded-lg border border-border p-4 transition hover:border-primary/60 hover:bg-muted/45" to={`/projects/${project._id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{project.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {userName(project.owner)} · {project.members.length}/{project.maxMembers} members
          </p>
        </div>
        <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold capitalize">{project.status.replace("_", " ")}</span>
      </div>
      <TagRow values={project.requiredSkills.slice(0, 4)} />
    </Link>
  );
}

function TeamPreview({ team }: { team: HackathonTeam }) {
  return (
    <Link className="block rounded-lg border border-border p-4 transition hover:border-primary/60 hover:bg-muted/45" to={`/hackathons/${team._id}`}>
      <p className="font-semibold">{team.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {team.hackathonName} · {team.members.length}/{team.maxMembers} members
      </p>
      <TagRow values={[...team.requiredRoles.map((role) => role.role), ...team.skillsNeeded].slice(0, 4)} />
    </Link>
  );
}

function RoadmapPreview({ roadmap }: { roadmap: Roadmap }) {
  const roadmapTitle = roadmap.careerGoal || roadmap.desiredCareer || "Career roadmap";
  const roadmapProjects = roadmap.recommendedProjects?.length ?? roadmap.projects?.length ?? 0;
  const roadmapPhases = roadmap.phases?.length ?? roadmap.learningPath?.length ?? 0;
  const roadmapSkills = roadmap.skills || [];

  return (
    <Link className="block rounded-lg border border-border p-4 transition hover:border-primary/60 hover:bg-muted/45" to={`/roadmaps/${roadmap._id}`}>
      <p className="font-semibold">{roadmapTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">Generated {new Date(roadmap.createdAt).toLocaleDateString()}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium">
        <MiniStat label="Skills" value={roadmapSkills.length} />
        <MiniStat label="Projects" value={roadmapProjects} />
        <MiniStat label="Phases" value={roadmapPhases} />
      </div>
      <TagRow values={roadmapSkills.slice(0, 4)} />
    </Link>
  );
}

function SignalBlock({ icon, title, values }: { icon: ReactNode; title: string; values: string[] }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {values.length ? <TagRow values={values.slice(0, 5)} /> : <p className="mt-3 text-sm text-muted-foreground">Nothing added yet.</p>}
    </div>
  );
}

function TagRow({ values }: { values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {value}
        </span>
      ))}
    </div>
  );
}

function PreviewList({ children }: { children: ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-2 py-2">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <p className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">{label}</p>;
}

function ErrorState({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-semibold text-red-800">{label}</p>
      <p className="mt-1 text-sm leading-6 text-red-700">{text}</p>
    </div>
  );
}

function SkillSuggestionCard({ suggestion }: { suggestion: SkillSuggestion }) {
  const priorityClass =
    suggestion.priority === "High"
      ? "border-primary/30 bg-primary/10 text-primary"
      : suggestion.priority === "Medium"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-border bg-muted text-muted-foreground";

  return (
    <article className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">{suggestion.skill}</p>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${priorityClass}`}>{suggestion.priority}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{suggestion.source}</span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{suggestion.reason}</p>
    </article>
  );
}

function EmptyState({ action, label, text, to }: { action: string; label: string; text: string; to: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/35 p-4">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      <Link className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary" to={to}>
        {action}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function SetupField({
  error,
  label,
  max,
  min,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  error?: string;
  label: string;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <input
        className={`mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary ${
          error ? "border-red-500 focus:border-red-500" : "border-border"
        }`}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}

function SetupTextArea({
  label,
  onChange,
  onPasteValue,
  placeholder,
  required,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  onPasteValue?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full resize-y rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        onPaste={
          onPasteValue
            ? (event) => {
                window.setTimeout(() => onPasteValue(event.currentTarget.value), 0);
              }
            : undefined
        }
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}
