import type { FormEvent } from "react";
import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "../ui/Button";
import type { ProjectPayload } from "../../types/project";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProjectForm({ onSubmit, isSaving }: { onSubmit: (payload: ProjectPayload) => Promise<void>; isSaving: boolean }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    interests: "",
    maxMembers: "5",
    repositoryUrl: "",
    demoUrl: ""
  });
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title: form.title,
        description: form.description,
        requiredSkills: splitList(form.requiredSkills),
        interests: splitList(form.interests),
        maxMembers: Number(form.maxMembers),
        repositoryUrl: form.repositoryUrl,
        demoUrl: form.demoUrl
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Field label="Title" value={form.title} onChange={(value) => update("title", value)} required />
      <TextArea label="Description" value={form.description} onChange={(value) => update("description", value)} rows={5} required />
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Required skills" value={form.requiredSkills} onChange={(value) => update("requiredSkills", value)} rows={3} />
        <TextArea label="Interests" value={form.interests} onChange={(value) => update("interests", value)} rows={3} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Max members" type="number" min="1" max="20" value={form.maxMembers} onChange={(value) => update("maxMembers", value)} />
        <Field label="Repository URL" value={form.repositoryUrl} onChange={(value) => update("repositoryUrl", value)} />
        <Field label="Demo URL" value={form.demoUrl} onChange={(value) => update("demoUrl", value)} />
      </div>
      {error && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button disabled={isSaving}>
        <FolderPlus size={17} />
        {isSaving ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  min,
  max
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

