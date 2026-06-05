import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function ProfileCompletionChart({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div className="relative h-44">
      <ResponsiveContainer height="100%" width="100%">
        <RadialBarChart data={[{ value: safeValue }]} endAngle={-270} innerRadius="70%" outerRadius="100%" startAngle={90}>
          <RadialBar background cornerRadius={12} dataKey="value" fill="#10b981" />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold text-emerald-600">{safeValue}%</p>
        <p className="text-xs font-medium text-muted-foreground">complete</p>
      </div>
    </div>
  );
}
