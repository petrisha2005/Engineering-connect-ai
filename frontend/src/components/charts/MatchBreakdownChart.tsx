import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmpty } from "./ChartCard";

export function MatchBreakdownChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data.length) return <ChartEmpty text="Generate matches to see compatibility analytics." />;

  return (
    <div className="h-56">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ left: -20, right: 10 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="label" fontSize={12} />
          <YAxis domain={[0, 100]} fontSize={12} />
          <Tooltip />
          <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
