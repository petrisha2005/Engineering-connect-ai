import { ChartEmpty } from "./ChartCard";

export function RoadmapTimeline({ phases }: { phases: Array<{ phase: string; duration?: string; progress?: number }> }) {
  if (!phases.length) return <ChartEmpty text="Generate a roadmap to see the learning timeline." />;

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => (
        <div className="grid gap-3 sm:grid-cols-[32px_1fr]" key={`${phase.phase}-${index}`}>
          <div className="flex flex-col items-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
            {index < phases.length - 1 && <span className="mt-2 h-full w-px min-h-8 bg-emerald-200" />}
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{phase.phase}</p>
              {phase.duration && <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{phase.duration}</span>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${phase.progress ?? 0}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
