import { Zap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-[#1F1F1F] mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-[#00E5FF]" />
          <span className="font-bold tracking-wider">PLUTUS_PREDICT</span>
        </div>
        <p className="text-xs text-[#888]">AI Forecasting & Disaster Prediction Platform</p>
        <p className="text-xs text-[#444] mt-2">Team: Parimal Shah (CEO) • Neil Shah (COO) • Aditya Jyoti (CTO)</p>
      </div>
    </footer>
  );
};

export default Footer;
