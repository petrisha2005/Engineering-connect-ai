import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmpty } from "./ChartCard";
import type { SkillSuggestion } from "../../types/recommendation";

function valueForPriority(priority: string) {
  if (priority === "High") return 90;
  if (priority === "Medium") return 60;
  return 35;
}

export function SkillGapChart({ skills }: { skills: SkillSuggestion[] }) {
  const data = skills.slice(0, 8).map((skill) => ({ skill: skill.skill, value: valueForPriority(skill.priority), priority: skill.priority }));
  if (!data.length) return <ChartEmpty text="Complete your profile and roadmap to generate skill gap analytics." />;

  return (
    <div className="h-64">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 18, right: 10 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis domain={[0, 100]} fontSize={12} type="number" />
          <YAxis dataKey="skill" fontSize={12} type="category" width={92} />
          <Tooltip />
          <Bar dataKey="value" fill="#10b981" name="Priority" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
