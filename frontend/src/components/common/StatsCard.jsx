import { Card, CardContent } from "@/components/ui/card";

const colorMap = {
  cyan: "text-[#00E5FF]",
  red: "text-[#FF3333]",
  gold: "text-[#FFD700]",
  green: "text-[#00FF94]",
  purple: "text-[#9D4EDD]",
};

export const StatsCard = ({ label, value, icon: Icon, trend, color = "cyan" }) => {
  return (
    <Card className="terminal-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-[#888]">{label}</span>
          {Icon && <Icon className={`w-4 h-4 ${colorMap[color]}`} />}
        </div>
        <div className={`text-2xl font-bold font-mono ${colorMap[color]}`}>{value}</div>
        {trend && (
          <div className={`text-xs mt-1 ${trend > 0 ? "text-[#00FF94]" : "text-[#FF3333]"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
