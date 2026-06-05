import type { ReactNode } from "react";

export function ChartCard({ children, description, title }: { children: ReactNode; description?: string; title: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ChartEmpty({ text = "No analytics data yet." }: { text?: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">{text}</p>;
}
