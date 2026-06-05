import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartEmpty } from "./ChartCard";

const colors = ["#0f766e", "#10b981", "#14b8a6", "#34d399", "#99f6e4"];

export function RoadmapDurationChart({ data }: { data: Array<{ name: string; weeks: number }> }) {
  const chartData = data.filter((item) => item.weeks > 0);
  if (!chartData.length) return <ChartEmpty text="Roadmap duration breakdown appears after a roadmap is generated." />;

  return (
    <div className="h-64">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie data={chartData} dataKey="weeks" innerRadius={50} outerRadius={92} paddingAngle={3}>
            {chartData.map((entry, index) => (
              <Cell fill={colors[index % colors.length]} key={entry.name} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
