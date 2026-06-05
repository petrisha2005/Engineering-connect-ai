import {
  Award,
  BriefcaseBusiness,
  Check,
  Github,
  GraduationCap,
  Linkedin,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  UserRoundCheck,
  X
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { createOrGetConversation } from "../services/messageApi";
import { browseMentors, getMyMentorProfile, requestMentor, saveMyMentorProfile } from "../services/mentorApi";
import type { AppUser } from "../types/auth";
import type { MentorAvailability, MentorCardData, MentorPayload, MentorProfile } from "../types/mentor";

type PageStatus = "loading" | "ready" | "error";
type Mode = "student" | "mentor";

const availabilityOptions: Array<{ value: MentorAvailability; label: string }> = [
  { value: "resume_review", label: "Resume review" },
  { value: "project_guidance", label: "Project guidance" },
  { value: "interview_prep", label: "Interview prep" },
  { value: "career_guidance", label: "Career guidance" },
  { value: "hackathon_mentoring", label: "Hackathon mentoring" }
];

const emptyForm: MentorPayload = {
  name: "",
  currentRole: "",
  organization: "",
  expertise: "",
  yearsOfExperience: 0,
  skills: [],
  domains: [],
  availableFor: ["career_guidance"],
  linkedin: "",
  github: "",
  headline: "",
  active: true
};

function asUser(user: string | AppUser): AppUser | null {
  return typeof user === "string" ? null : user;
}

function userId(user: string | AppUser) {
  return typeof user === "string" ? user : user._id;
}

function csvToList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function listToCsv(values: string[]) {
  return values.join(", ");
}

function availabilityLabel(value: MentorAvailability) {
  return availabilityOptions.find((option) => option.value === value)?.label ?? value.replace(/_/g, " ");
}

function isValidExternalUrl(value?: string) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function MentorsPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("student");
  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorCardData[]>([]);
  const [myMentorProfile, setMyMentorProfile] = useState<MentorProfile | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorCardData | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadMentors() {
    setStatus("loading");
    setError(null);
    try {
      const [mentorResponse, meResponse] = await Promise.all([browseMentors(), getMyMentorProfile()]);
      setMentors(mentorResponse.mentors ?? []);
      setMyMentorProfile(meResponse.mentor ?? null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load mentor matching.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadMentors();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const recommended = useMemo(() => mentors.slice(0, 3), [mentors]);

  async function sendMentorRequest(mentor: MentorCardData, message = "") {
    const mentorUserId = userId(mentor.mentor.user);
    setBusyId(mentorUserId);
    try {
      await requestMentor(mentorUserId, message);
      setToast("Mentorship request sent.");
      setSelectedMentor(null);
      setRequestMessage("");
      await loadMentors();
    } finally {
      setBusyId(null);
    }
  }

  async function messageMentor(mentor: MentorCardData) {
    const mentorUserId = userId(mentor.mentor.user);
    setBusyId(mentorUserId);
    try {
      const response = await createOrGetConversation(mentorUserId);
      navigate(`/messages?conversation=${response.conversation._id}`);
    } finally {
      setBusyId(null);
    }
  }

  async function saveProfile(payload: MentorPayload) {
    await saveMyMentorProfile(payload);
    setToast("Mentor profile saved.");
    await loadMentors();
    setMode("student");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="overflow-hidden rounded-lg border border-emerald-200 bg-[linear-gradient(135deg,#022c22_0%,#064e3b_58%,#0f766e_100%)] p-6 text-white shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100">
              <Sparkles size={16} />
              AI mentor matching
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Find seniors, alumni, and mentors who match your goals.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
              Browse real mentor profiles, compare compatibility, request mentorship, and start chatting after the mentor accepts.
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-emerald-100">Recommended mentors</p>
            <p className="mt-2 text-4xl font-semibold">{recommended.length}</p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">Ranked from your profile skills, interests, career goals, branch, and roadmaps.</p>
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
        <button
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition sm:flex-none ${
            mode === "student" ? "bg-emerald-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
          }`}
          onClick={() => setMode("student")}
          type="button"
        >
          <Search size={16} />
          Find mentors
        </button>
        <button
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition sm:flex-none ${
            mode === "mentor" ? "bg-emerald-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
          }`}
          onClick={() => setMode("mentor")}
          type="button"
        >
          <UserRoundCheck size={16} />
          Become a mentor
        </button>
      </div>

      {status === "loading" && <StateCard title="Loading mentors..." text="Checking mentor profiles and compatibility scores." />}
      {status === "error" && <StateCard tone="error" title="Unable to load mentors" text={error ?? "Please try again."} />}

      {status === "ready" && mode === "student" && (
        <section className="mt-5">
          {mentors.length ? (
            <>
              <div className="mb-4 grid gap-4 md:grid-cols-3">
                {recommended.map((mentor) => (
                  <MiniRecommendation mentor={mentor} key={mentor.mentor._id} />
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {mentors.map((mentor) => (
                  <MentorCard
                    busy={busyId === userId(mentor.mentor.user)}
                    key={mentor.mentor._id}
                    mentor={mentor}
                    onDetails={() => setSelectedMentor(mentor)}
                    onMessage={() => messageMentor(mentor)}
                    onRequest={() => sendMentorRequest(mentor)}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="No mentors yet" text="Mentor profiles from seniors and alumni will appear here after they create a mentor profile." />
          )}
        </section>
      )}

      {status === "ready" && mode === "mentor" && <MentorProfileForm mentor={myMentorProfile} onCancel={() => setMode("student")} onSave={saveProfile} />}

      {selectedMentor && (
        <MentorModal
          busy={busyId === userId(selectedMentor.mentor.user)}
          mentor={selectedMentor}
          message={requestMessage}
          onClose={() => setSelectedMentor(null)}
          onMessageChange={setRequestMessage}
          onRequest={() => sendMentorRequest(selectedMentor, requestMessage)}
          onStartMessage={() => messageMentor(selectedMentor)}
        />
      )}

      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">{toast}</div>}
    </main>
  );
}

function MiniRecommendation({ mentor }: { mentor: MentorCardData }) {
  return (
    <article className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
      <p className="text-sm font-semibold text-emerald-700">{mentor.compatibilityScore}% match</p>
      <p className="mt-2 font-semibold">{mentor.mentor.name}</p>
      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{mentor.mentor.currentRole}</p>
    </article>
  );
}

function MentorCard({
  busy,
  mentor,
  onDetails,
  onMessage,
  onRequest
}: {
  busy?: boolean;
  mentor: MentorCardData;
  onDetails: () => void;
  onMessage: () => void;
  onRequest: () => void;
}) {
  const user = asUser(mentor.mentor.user);

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{mentor.mentor.name}</h2>
            <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{mentor.compatibilityScore}% compatible</span>
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{mentor.mentor.currentRole}</p>
          <p className="mt-1 text-sm text-muted-foreground">{mentor.mentor.organization}</p>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{mentor.mentor.expertise}</p>
        </div>
        <ScoreRing score={mentor.compatibilityScore} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoPill icon={<BriefcaseBusiness size={15} />} text={`${mentor.mentor.yearsOfExperience} years experience`} />
        <InfoPill icon={<GraduationCap size={15} />} text={mentor.mentor.availableFor.slice(0, 2).map(availabilityLabel).join(", ")} />
      </div>

      <TagSection title="Skills" values={mentor.mentor.skills.slice(0, 6)} />
      <TagSection title="Domains" values={mentor.mentor.domains.slice(0, 6)} />

      <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
        <p className="text-sm font-semibold text-emerald-800">Why this mentor fits</p>
        <ul className="mt-2 grid gap-1 text-sm leading-6 text-emerald-900/80">
          {mentor.matchingReasons.slice(0, 3).map((reason) => (
            <li className="flex gap-2" key={reason}>
              <Check className="mt-1 shrink-0" size={14} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <Button className="bg-muted text-foreground hover:bg-muted/80" onClick={onDetails}>
          View profile
        </Button>
        <div className="flex flex-wrap gap-2">
          {mentor.state === "accepted" ? (
            <Button disabled={busy || !user} onClick={onMessage}>
              <MessageCircle size={16} />
              Message
            </Button>
          ) : mentor.state === "request_sent" ? (
            <Button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100" disabled>
              Request sent
            </Button>
          ) : (
            <Button disabled={busy || !user} onClick={onRequest}>
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Request mentor
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function MentorProfileForm({ mentor, onCancel, onSave }: { mentor: MentorProfile | null; onCancel: () => void; onSave: (payload: MentorPayload) => Promise<void> }) {
  const [form, setForm] = useState<MentorPayload>(() =>
    mentor
      ? {
          name: mentor.name,
          currentRole: mentor.currentRole,
          organization: mentor.organization,
          expertise: mentor.expertise,
          yearsOfExperience: mentor.yearsOfExperience,
          skills: mentor.skills,
          domains: mentor.domains,
          availableFor: mentor.availableFor,
          linkedin: mentor.linkedin ?? "",
          github: mentor.github ?? "",
          headline: mentor.headline ?? "",
          active: mentor.active
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof MentorPayload>(key: K, value: MentorPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!form.name.trim() || !form.currentRole.trim() || !form.organization.trim() || !form.expertise.trim()) return "Please fill all required mentor profile fields.";
    if (!form.skills.length || !form.domains.length) return "Add at least one skill and one domain.";
    if (!form.availableFor.length) return "Choose at least one mentorship area.";
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save mentor profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-semibold">{mentor ? "Edit mentor profile" : "Create mentor profile"}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Make yourself discoverable for students who need guidance.</p>
        </div>
        {mentor && (
          <Button className="bg-muted text-foreground hover:bg-muted/80" onClick={onCancel} type="button">
            Cancel
          </Button>
        )}
      </div>

      <form className="mt-5 grid gap-4" onSubmit={submit}>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name *" value={form.name} onChange={(value) => update("name", value)} />
          <Field label="Current role *" value={form.currentRole} onChange={(value) => update("currentRole", value)} placeholder="Senior student, SDE intern, Alumni mentor" />
          <Field label="College / Company *" value={form.organization} onChange={(value) => update("organization", value)} />
          <Field
            label="Years of experience *"
            type="number"
            value={String(form.yearsOfExperience)}
            onChange={(value) => update("yearsOfExperience", Number(value))}
          />
          <Field label="Skills *" value={listToCsv(form.skills)} onChange={(value) => update("skills", csvToList(value))} placeholder="React, DSA, ML, Cloud" />
          <Field label="Domains *" value={listToCsv(form.domains)} onChange={(value) => update("domains", csvToList(value))} placeholder="Web development, AI, cybersecurity" />
          <Field label="LinkedIn" value={form.linkedin ?? ""} onChange={(value) => update("linkedin", value)} placeholder="https://www.linkedin.com/in/username" />
          <Field label="GitHub" value={form.github ?? ""} onChange={(value) => update("github", value)} placeholder="https://github.com/username" />
        </div>
        <Field label="Headline" value={form.headline ?? ""} onChange={(value) => update("headline", value)} placeholder="What kind of students can you help most?" />
        <label className="grid gap-2 text-sm font-semibold">
          Expertise *
          <textarea
            className="min-h-32 rounded-md border border-border bg-background px-3 py-3 text-sm font-normal outline-none transition focus:border-emerald-400"
            onChange={(event) => update("expertise", event.target.value)}
            placeholder="Describe your mentoring strengths, background, and the kind of guidance you offer."
            value={form.expertise}
          />
        </label>
        <div>
          <p className="text-sm font-semibold">Available for *</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availabilityOptions.map((option) => {
              const checked = form.availableFor.includes(option.value);
              return (
                <button
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    checked ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "border-border bg-background text-muted-foreground hover:border-emerald-200"
                  }`}
                  key={option.value}
                  onClick={() =>
                    update(
                      "availableFor",
                      checked ? form.availableFor.filter((value) => value !== option.value) : [...form.availableFor, option.value]
                    )
                  }
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <Button className="w-full sm:w-fit" disabled={saving} type="submit">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          {saving ? "Saving..." : "Save mentor profile"}
        </Button>
      </form>
    </section>
  );
}

function MentorModal({
  busy,
  mentor,
  message,
  onClose,
  onMessageChange,
  onRequest,
  onStartMessage
}: {
  busy?: boolean;
  mentor: MentorCardData;
  message: string;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onRequest: () => void;
  onStartMessage: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">{mentor.compatibilityScore}% compatibility</p>
            <h2 className="mt-1 text-2xl font-semibold">{mentor.mentor.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{mentor.mentor.currentRole} at {mentor.mentor.organization}</p>
          </div>
          <Button className="size-9 bg-muted p-0 text-foreground hover:bg-muted/80" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">{mentor.mentor.expertise}</p>
        <TagSection title="Skills" values={mentor.mentor.skills} />
        <TagSection title="Domains" values={mentor.mentor.domains} />
        <TagSection title="Available for" values={mentor.mentor.availableFor.map(availabilityLabel)} />

        <div className="mt-4 flex flex-wrap gap-2">
          {isValidExternalUrl(mentor.mentor.linkedin) && <ExternalLink href={mentor.mentor.linkedin!} icon={<Linkedin size={15} />} label="LinkedIn" />}
          {isValidExternalUrl(mentor.mentor.github) && <ExternalLink href={mentor.mentor.github!} icon={<Github size={15} />} label="GitHub" />}
        </div>

        {mentor.state === "accepted" ? (
          <Button className="mt-5" disabled={busy} onClick={onStartMessage}>
            <MessageCircle size={16} />
            Message mentor
          </Button>
        ) : mentor.state === "request_sent" ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Request already sent.</div>
        ) : (
          <div className="mt-5 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Optional request message
              <textarea
                className="min-h-24 rounded-md border border-border bg-background px-3 py-3 text-sm font-normal outline-none transition focus:border-emerald-400"
                onChange={(event) => onMessageChange(event.target.value)}
                placeholder="Share what kind of guidance you need."
                value={message}
              />
            </label>
            <Button disabled={busy} onClick={onRequest}>
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Request mentor
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-50 text-lg font-semibold text-emerald-700">
      {score}%
    </div>
  );
}

function InfoPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
      {icon}
      <span>{text || "Mentorship"}</span>
    </div>
  );
}

function TagSection({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" key={value}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        className="h-11 rounded-md border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function ExternalLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" href={href} rel="noopener noreferrer" target="_blank">
      {icon}
      {label}
    </a>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <Award className="mx-auto text-emerald-500" size={34} />
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
    </section>
  );
}

function StateCard({ text, title, tone = "default" }: { text: string; title: string; tone?: "default" | "error" }) {
  return (
    <section className={`mt-5 rounded-lg border p-5 ${tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-border bg-card"}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{text}</p>
    </section>
  );
}
