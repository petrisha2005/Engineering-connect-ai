import { FolderPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../ui/Button";
import type { HackathonTeamPayload, RequiredRole } from "../../types/hackathonTeam";

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseRoles(value: string): RequiredRole[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [role = "", skills = "", importance = "High"] = line.split("|").map((item) => item.trim());
      return { role, roleName: role, skills: splitList(skills), requiredSkills: splitList(skills), importance: importance as RequiredRole["importance"], status: "open" as const };
    })
    .filter((role) => role.role);
}

export function HackathonTeamForm({ onSubmit, isSaving }: { onSubmit: (payload: HackathonTeamPayload) => Promise<void>; isSaving: boolean }) {
  const [form, setForm] = useState({
    name: "",
    hackathonName: "",
    theme: "",
    problemStatement: "",
    description: "",
    requiredRoles: "",
    skillsNeeded: "",
    maxMembers: "4",
    lookingFor: "",
    deadline: "",
    mode: "online",
    location: ""
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
        name: form.name,
        hackathonName: form.hackathonName,
        theme: form.theme,
        problemStatement: form.problemStatement,
        description: form.description,
        requiredRoles: parseRoles(form.requiredRoles),
        skillsNeeded: splitList(form.skillsNeeded),
        requiredSkills: splitList(form.skillsNeeded),
        maxMembers: Number(form.maxMembers),
        teamSize: Number(form.maxMembers),
        lookingFor: form.lookingFor,
        deadline: form.deadline || undefined,
        mode: form.mode as HackathonTeamPayload["mode"],
        location: form.location
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create team");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Team name" value={form.name} onChange={(value) => update("name", value)} required />
        <Field label="Hackathon name" value={form.hackathonName} onChange={(value) => update("hackathonName", value)} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Idea domain/theme" value={form.theme} onChange={(value) => update("theme", value)} placeholder="Healthcare AI" />
        <Field label="Deadline" type="date" value={form.deadline} onChange={(value) => update("deadline", value)} />
      </div>
      <TextArea label="Problem statement" value={form.problemStatement} onChange={(value) => update("problemStatement", value)} rows={3} />
      <TextArea label="Description" value={form.description} onChange={(value) => update("description", value)} rows={5} required />
      <TextArea label="Looking for" value={form.lookingFor} onChange={(value) => update("lookingFor", value)} rows={3} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Required roles" value={form.requiredRoles} onChange={(value) => update("requiredRoles", value)} rows={5} placeholder="AI/ML Engineer | python, machine learning, tensorflow | High" />
        <TextArea label="Skills needed" value={form.skillsNeeded} onChange={(value) => update("skillsNeeded", value)} rows={5} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Max members" type="number" min="1" max="10" value={form.maxMembers} onChange={(value) => update("maxMembers", value)} />
        <label className="block text-sm font-medium">
          Mode
          <select className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" value={form.mode} onChange={(event) => update("mode", event.target.value)}>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <Field label="Location" value={form.location} onChange={(value) => update("location", value)} />
      </div>
      {error && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button disabled={isSaving}>
        <FolderPlus size={17} />
        {isSaving ? "Creating..." : "Create team"}
      </Button>
    </form>
  );
}

function Field({ label, value, onChange, required, type = "text", min, max, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; min?: string; max?: string; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary" type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function TextArea({ label, value, onChange, rows, required, placeholder }: { label: string; value: string; onChange: (value: string) => void; rows: number; required?: boolean; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary" rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}
