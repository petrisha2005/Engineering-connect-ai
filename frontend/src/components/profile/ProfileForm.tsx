import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "../ui/Button";
import type { Availability, ProfilePayload, ProfileProject, StudentProfile } from "../../types/profile";

interface ProfileFormProps {
  profile?: StudentProfile | null;
  onSubmit: (payload: ProfilePayload) => Promise<void>;
  onCancel?: () => void;
  onError?: (message: string) => void;
  isSaving: boolean;
}

function joinList(values?: string[]) {
  return values?.join(", ") ?? "";
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

function projectsToText(projects?: ProfileProject[]) {
  return (
    projects
      ?.map((project) => [project.title, project.description, joinList(project.skills), joinList(project.links)].join(" | "))
      .join("\n") ?? ""
  );
}

function parseProjects(value: string): ProfileProject[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", description = "", skills = "", links = ""] = line.split("|").map((item) => item.trim());
      return {
        title,
        description,
        skills: splitList(skills),
        links: splitList(links)
      };
    })
    .filter((project) => project.title && project.description);
}

const GITHUB_PROFILE_REGEX = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/;
const LINKEDIN_PROFILE_REGEX = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?$/;

type FieldErrors = Partial<Record<keyof ReturnType<typeof createEmptyErrors>, string>>;

function createEmptyErrors() {
  return {
    name: "",
    college: "",
    branch: "",
    year: "",
    skills: "",
    interests: "",
    goals: "",
    github: "",
    linkedin: ""
  };
}

export function ProfileForm({ profile, onSubmit, onCancel, onError, isSaving }: ProfileFormProps) {
  const initial = useMemo(
    () => ({
      name: profile?.name ?? "",
      college: profile?.college ?? "",
      branch: profile?.branch ?? "",
      year: String(profile?.year ?? 1),
      headline: profile?.headline ?? "",
      bio: profile?.bio ?? "",
      location: profile?.location ?? "",
      skills: joinList(profile?.skills),
      interests: joinList(profile?.interests),
      goals: joinList(profile?.goals),
      achievements: joinList(profile?.achievements),
      github: profile?.github ?? "",
      linkedin: profile?.linkedin ?? "",
      availability: profile?.availability ?? "open",
      projects: projectsToText(profile?.projects)
    }),
    [profile]
  );

  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function validateForm() {
    const errors: FieldErrors = {};

    if (!form.name.trim()) errors.name = "Full Name is required";
    if (!form.college.trim()) errors.college = "College is required";
    if (!form.branch.trim()) errors.branch = "Branch is required";
    if (!form.year.trim()) errors.year = "Year is required";
    if (!splitList(form.skills).length) errors.skills = "Skills are required";
    if (!splitList(form.interests).length) errors.interests = "Interests are required";
    if (!splitList(form.goals).length) errors.goals = "Career Goal is required";

    if (!form.github.trim()) {
      errors.github = "GitHub Link is required";
    } else if (!GITHUB_PROFILE_REGEX.test(form.github.trim())) {
      errors.github = "Please enter a valid GitHub profile URL. Example: https://github.com/username";
    }

    if (!form.linkedin.trim()) {
      errors.linkedin = "LinkedIn Link is required";
    } else if (!LINKEDIN_PROFILE_REGEX.test(form.linkedin.trim())) {
      errors.linkedin = "Please enter a valid LinkedIn profile URL. Example: https://www.linkedin.com/in/username";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    const payload: ProfilePayload = {
      name: form.name.trim(),
      college: form.college.trim(),
      branch: form.branch.trim(),
      year: Number(form.year),
      headline: form.headline,
      bio: form.bio,
      location: form.location,
      skills: splitList(form.skills),
      interests: splitList(form.interests),
      goals: splitList(form.goals),
      achievements: splitList(form.achievements),
      github: form.github.trim(),
      linkedin: form.linkedin.trim(),
      availability: form.availability as Availability,
      projects: parseProjects(form.projects)
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save profile";
      setError(message);
      onError?.(message);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name" value={form.name} onChange={(value) => updateField("name", value)} error={fieldErrors.name} required />
        <Field label="College" value={form.college} onChange={(value) => updateField("college", value)} error={fieldErrors.college} required />
        <Field label="Branch" value={form.branch} onChange={(value) => updateField("branch", value)} error={fieldErrors.branch} required />
        <Field label="Year" type="number" min="1" max="6" value={form.year} onChange={(value) => updateField("year", value)} error={fieldErrors.year} required />
        <Field label="Headline" value={form.headline} onChange={(value) => updateField("headline", value)} />
        <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
      </div>

      <TextArea label="Bio" value={form.bio} onChange={(value) => updateField("bio", value)} rows={4} />

      <div className="grid gap-4 md:grid-cols-3">
        <TextArea
          label="Skills"
          value={form.skills}
          onChange={(value) => updateField("skills", value)}
          onPasteValue={(value) => updateField("skills", normalizeListText(value))}
          rows={3}
          error={fieldErrors.skills}
          required
        />
        <TextArea
          label="Interests"
          value={form.interests}
          onChange={(value) => updateField("interests", value)}
          onPasteValue={(value) => updateField("interests", normalizeListText(value))}
          rows={3}
          error={fieldErrors.interests}
          required
        />
        <TextArea
          label="Career Goal"
          value={form.goals}
          onChange={(value) => updateField("goals", value)}
          onPasteValue={(value) => updateField("goals", normalizeListText(value))}
          rows={3}
          error={fieldErrors.goals}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="GitHub Link"
          value={form.github}
          onChange={(value) => updateField("github", value)}
          error={fieldErrors.github}
          placeholder="https://github.com/username"
          required
        />
        <Field
          label="LinkedIn Link"
          value={form.linkedin}
          onChange={(value) => updateField("linkedin", value)}
          error={fieldErrors.linkedin}
          placeholder="https://www.linkedin.com/in/username"
          required
        />
      </div>

      <TextArea label="Achievements" value={form.achievements} onChange={(value) => updateField("achievements", value)} rows={3} />
      <TextArea
        label="Projects"
        value={form.projects}
        onChange={(value) => updateField("projects", value)}
        rows={5}
        placeholder="Title | Description | skill one, skill two | https://github.com/example"
      />

      <label className="block text-sm font-medium">
        Availability
        <select
          className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={form.availability}
          onChange={(event) => updateField("availability", event.target.value)}
        >
          <option value="open">Open</option>
          <option value="selective">Selective</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </label>

      {error && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button disabled={isSaving}>
          <Save size={17} />
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
        {onCancel && (
          <Button className="border border-border bg-background text-foreground hover:bg-muted" disabled={isSaving} onClick={onCancel} type="button">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  error?: string;
  placeholder?: string;
}

function RequiredMark({ required }: { required?: boolean }) {
  return required ? <span className="ml-1 text-red-600">*</span> : null;
}

function Field({ label, value, onChange, required, type = "text", min, max, error, placeholder }: FieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <RequiredMark required={required} />
      <input
        className={`mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary ${
          error ? "border-red-500 focus:border-red-500" : "border-border"
        }`}
        type={type}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
  error?: string;
  required?: boolean;
  onPasteValue?: (value: string) => void;
}

function TextArea({ label, value, onChange, rows, placeholder, error, required, onPasteValue }: TextAreaProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <RequiredMark required={required} />
      <textarea
        className={`mt-2 w-full rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary ${
          error ? "border-red-500 focus:border-red-500" : "border-border"
        }`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onPaste={
          onPasteValue
            ? (event) => {
                window.setTimeout(() => onPasteValue(event.currentTarget.value), 0);
              }
            : undefined
        }
        required={required}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
