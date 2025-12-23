/**
 * Stats Card Component for Plutus Predict
 */
import React from 'react';

const colorMap = {
  cyan: { bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/30', text: 'text-[#00E5FF]' },
  gold: { bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', text: 'text-[#FFD700]' },
  green: { bg: 'bg-[#00FF94]/10', border: 'border-[#00FF94]/30', text: 'text-[#00FF94]' },
  red: { bg: 'bg-[#FF3333]/10', border: 'border-[#FF3333]/30', text: 'text-[#FF3333]' },
  purple: { bg: 'bg-[#9D4EDD]/10', border: 'border-[#9D4EDD]/30', text: 'text-[#9D4EDD]' },
};

export const StatsCard = ({ label, value, icon: Icon, trend, color = "cyan" }) => {
  const colors = colorMap[color] || colorMap.cyan;
  
  return (
    <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border} transition-all hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#888] uppercase tracking-wider">{label}</div>
          <div className={`text-xl font-bold ${colors.text}`} style={{fontFamily: 'JetBrains Mono, monospace'}}>
            {value}
          </div>
          {trend && (
            <div className={`text-xs ${trend > 0 ? 'text-[#00FF94]' : 'text-[#FF3333]'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && <Icon className={`w-6 h-6 ${colors.text} opacity-70`} />}
      </div>
    </div>
  );
};

export default StatsCard;
