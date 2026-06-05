import { ChartEmpty } from "./ChartCard";

export function ProjectTeamProgress({ items }: { items: Array<{ title: string; currentMembers: number; maxMembers: number; percent: number; skills?: string[] }> }) {
  if (!items.length) return <ChartEmpty text="Create projects to see team completion analytics." />;

  return (
    <div className="grid gap-3">
      {items.slice(0, 6).map((item) => (
        <article className="rounded-lg border border-border p-4" key={item.title}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.currentMembers}/{item.maxMembers} members joined
              </p>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{item.percent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}
