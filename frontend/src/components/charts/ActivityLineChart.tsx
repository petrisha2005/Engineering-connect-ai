import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmpty } from "./ChartCard";
import type { WeeklyActivityPoint } from "../../types/analytics";

export function ActivityLineChart({ data }: { data: WeeklyActivityPoint[] }) {
  if (!data.length || data.every((item) => item.total === 0)) return <ChartEmpty text="Activity will appear after you connect, apply, message, or generate roadmaps." />;

  return (
    <div className="h-64">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ left: -18, right: 12, top: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="day" fontSize={12} tickLine={false} />
          <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
          <Tooltip />
          <Line dataKey="total" name="Total activity" stroke="#0f766e" strokeWidth={3} type="monotone" />
          <Line dataKey="messages" name="Messages" stroke="#10b981" strokeWidth={2} type="monotone" />
          <Line dataKey="roadmaps" name="Roadmaps" stroke="#14b8a6" strokeWidth={2} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
