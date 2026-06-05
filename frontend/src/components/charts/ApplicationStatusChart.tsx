import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartEmpty } from "./ChartCard";
import type { StatusCounts } from "../../types/analytics";

const colors = ["#f59e0b", "#10b981", "#ef4444"];

export function ApplicationStatusChart({ counts }: { counts: StatusCounts }) {
  const data = [
    { name: "Pending", value: counts.pending },
    { name: "Accepted", value: counts.accepted },
    { name: "Rejected", value: counts.rejected }
  ].filter((item) => item.value > 0);

  if (!data.length) return <ChartEmpty text="Application statuses will appear after you apply or receive applications." />;

  return (
    <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="h-44">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={44} outerRadius={78} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell fill={colors[index % colors.length]} key={entry.name} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2">
        {data.map((item, index) => (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm" key={item.name}>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              {item.name}
            </span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
