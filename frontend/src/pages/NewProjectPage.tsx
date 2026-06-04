import { useNavigate } from "react-router-dom";
import { ProjectForm } from "../components/projects/ProjectForm";
import { useProjectStore } from "../store/projectStore";
import type { ProjectPayload } from "../types/project";

export function NewProjectPage() {
  const navigate = useNavigate();
  const { createNewProject, status } = useProjectStore();

  async function handleSubmit(payload: ProjectPayload) {
    const project = await createNewProject(payload);
    navigate(`/projects/${project._id}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Create project</p>
        <h1 className="mt-2 text-3xl font-semibold">Start a new collaboration</h1>
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        <ProjectForm isSaving={status === "loading"} onSubmit={handleSubmit} />
      </section>
    </main>
  );
}

