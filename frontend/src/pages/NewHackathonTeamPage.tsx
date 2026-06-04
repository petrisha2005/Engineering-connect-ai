import { useNavigate } from "react-router-dom";
import { HackathonTeamForm } from "../components/hackathons/HackathonTeamForm";
import { useHackathonTeamStore } from "../store/hackathonTeamStore";
import type { HackathonTeamPayload } from "../types/hackathonTeam";

export function NewHackathonTeamPage() {
  const navigate = useNavigate();
  const { createTeam, status } = useHackathonTeamStore();

  async function handleSubmit(payload: HackathonTeamPayload) {
    const team = await createTeam(payload);
    navigate(`/hackathons/${team._id}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Create hackathon team</p>
        <h1 className="mt-2 text-3xl font-semibold">Build a team around roles</h1>
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        <HackathonTeamForm isSaving={status === "loading"} onSubmit={handleSubmit} />
      </section>
    </main>
  );
}

