import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home, Brain, Sparkles, TrendingUp, AlertTriangle, Moon,
  BarChart3, Globe, Target, Star, Layers, Shield, Search,
  MessageSquare, Zap, User, LogIn, LogOut
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

const tabs = [
  { id: "dashboard", label: "DASHBOARD", icon: Home },
  { id: "forecast", label: "AI_FORECAST", icon: Brain },
  { id: "deep-forecast", label: "DEEP_FORECAST", icon: Sparkles },
  { id: "investment", label: "IB_SUITE", icon: TrendingUp },
  { id: "disasters", label: "DISASTERS", icon: AlertTriangle },
  { id: "astrology", label: "ASTROLOGY", icon: Moon },
  { id: "tabular", label: "TABULAR", icon: BarChart3 },
  { id: "holographic", label: "3D_VISUAL", icon: Globe },
  { id: "accuracy", label: "ACCURACY", icon: Target },
  { id: "compare", label: "COMPARE", icon: Star },
  { id: "my-dashboards", label: "MY_DASHBOARDS", icon: Layers },
  { id: "admin", label: "ADMIN", icon: Shield, adminOnly: true },
  { id: "osint", label: "OSINT", icon: Search },
  { id: "chat", label: "CHAT", icon: MessageSquare },
];

export const Navigation = ({ activeTab, setActiveTab, user, setShowAuth, logout, language, setLanguage }) => {
  const filteredTabs = tabs.filter(
    (tab) =>
      !tab.adminOnly ||
      user?.role === "admin" ||
      user?.role === "enterprise" ||
      user?.role === "enterprise_admin" ||
      user?.role === "owner" ||
      user?.role === "super_admin"
  );

  return (
    <header className="border-b border-[#1F1F1F] bg-[#050505] sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#00E5FF]" />
            <span className="font-bold text-lg tracking-wider" style={{ fontFamily: "IBM Plex Sans" }}>
              PLUTUS_PREDICT
            </span>
          </div>
          <Badge variant="outline" className="text-xs border-[#1F1F1F] text-[#888]">
            v1.0.0
          </Badge>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              data-testid={`nav-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item flex items-center gap-2 ${activeTab === tab.id ? "active" : ""} ${
                tab.adminOnly ? "text-[#FFD700]" : ""
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs border border-[#1F1F1F]">
                {SUPPORTED_LANGUAGES[language]?.flag} {language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#1F1F1F]">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`cursor-pointer ${language === code ? "bg-[#1F1F1F]" : ""}`}
                >
                  {info.flag} {info.native}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm" data-testid="user-menu-btn">
                  <User className="w-4 h-4 mr-2" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0A0A0A] border-[#1F1F1F]">
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setShowAuth(true)} className="btn-primary text-xs" data-testid="login-btn">
              <LogIn className="w-4 h-4 mr-2" />
              LOGIN
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden overflow-x-auto border-t border-[#1F1F1F]">
        <div className="flex px-4 py-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs whitespace-nowrap ${
                activeTab === tab.id ? "text-[#00E5FF] border-b-2 border-[#00E5FF]" : "text-[#888]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
