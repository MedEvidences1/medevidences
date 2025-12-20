import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lucide Icons
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  Cloud,
  CreditCard,
  Cpu,
  DollarSign,
  Globe,
  Home,
  Layers,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap,
  RefreshCw,
  ExternalLink,
  Play,
  Star,
  Shield,
  Target,
  MapPin,
  FileText,
  Building2,
  UserPlus,
  UserMinus,
  Lock,
  Key,
  Mail,
  Receipt,
  Download,
  Share2,
  Trash2,
  Plus,
  Eye,
  MoreVertical,
  Check,
  X,
  Copy,
  FolderOpen,
  Clock,
  Bell,
} from "lucide-react";

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// =============================================================================
// MULTI-LANGUAGE SUPPORT
// =============================================================================
const SUPPORTED_LANGUAGES = {
  en: { name: "English", native: "English", flag: "🇺🇸" },
  es: { name: "Spanish", native: "Español", flag: "🇪🇸" },
  fr: { name: "French", native: "Français", flag: "🇫🇷" },
  ar: { name: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true },
  id: { name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  sw: { name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
};

const useLanguage = () => {
  const [language, setLanguage] = useState(localStorage.getItem("plutus_lang") || "en");
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const res = await axios.get(`${API}/translations/${language}`);
        setTranslations(res.data.translations || {});
      } catch (e) {
        console.error("Failed to load translations:", e);
      }
    };
    loadTranslations();
    localStorage.setItem("plutus_lang", language);
  }, [language]);

  const t = (key) => translations[key] || key;

  return { language, setLanguage, translations, t, isRTL: SUPPORTED_LANGUAGES[language]?.rtl };
};

// Auth Context
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      toast.success("Login successful");
      return true;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Login failed");
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/auth/register`, { name, email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      toast.success("Registration successful");
      return true;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast.success("Logged out");
  };

  const getHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};

  return { user, token, login, register, logout, getHeaders, setUser };
};

// Navigation Component
const Navigation = ({ activeTab, setActiveTab, user, setShowAuth, logout, language, setLanguage }) => {
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

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || (user?.role === "admin" || user?.role === "enterprise" || user?.role === "enterprise_admin" || user?.role === "owner" || user?.role === "super_admin"));


  return (
    <header className="border-b border-[#1F1F1F] bg-[#050505] sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#00E5FF]" />
            <span className="font-bold text-lg tracking-wider" style={{ fontFamily: 'IBM Plex Sans' }}>
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
              className={`nav-item flex items-center gap-2 ${activeTab === tab.id ? "active" : ""} ${tab.adminOnly ? "text-[#FFD700]" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
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
              className={`px-3 py-1 text-xs whitespace-nowrap ${activeTab === tab.id ? "text-[#00E5FF] border-b-2 border-[#00E5FF]" : "text-[#888]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

// Stats Card Component
const StatsCard = ({ label, value, icon: Icon, trend, color = "cyan" }) => {
  const colorMap = {
    cyan: "text-[#00E5FF]",
    red: "text-[#FF3333]",
    gold: "text-[#FFD700]",
    green: "text-[#00FF94]",
    purple: "text-[#9D4EDD]",
  };

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

// Dashboard Component
const Dashboard = ({ getHeaders }) => {
  const [stats, setStats] = useState(null);
  const [earthquakes, setEarthquakes] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [disasterSummary, setDisasterSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eqRes, forecastsRes, disasterRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/disasters/earthquakes?min_magnitude=4.5&limit=10`),
        axios.get(`${API}/forecasts?limit=5`),
        axios.get(`${API}/disasters/summary`),
      ]);
      setStats(statsRes.data);
      setEarthquakes(eqRes.data.earthquakes || []);
      setForecasts(forecastsRes.data.forecasts || []);
      setDisasterSummary(disasterRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const riskScore = disasterSummary?.global_risk_score || 0;

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatsCard label="LLM ENSEMBLE" value="3" icon={Brain} color="cyan" />
        <StatsCard label="OSINT SOURCES" value="1M+" icon={Layers} color="gold" />
        <StatsCard label="EARTHQUAKES 24H" value={earthquakes.length} icon={Activity} color="red" />
        <StatsCard label="WEATHER ALERTS" value={disasterSummary?.weather_risk?.active_alerts || 0} icon={Cloud} color="purple" />
        <StatsCard label="GLOBAL RISK" value={`${riskScore}%`} icon={AlertTriangle} color={riskScore > 50 ? "red" : "green"} />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Forecasts */}
        <Card className="terminal-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00E5FF]" />
              RECENT_FORECASTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {forecasts.length > 0 ? (
                <div className="space-y-2">
                  {forecasts.map((f, i) => (
                    <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#00E5FF] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-[#EDEDED] flex-1 pr-4">{f.question}</span>
                        <span className="font-mono text-lg font-bold text-[#00E5FF]">{f.probability}%</span>
                      </div>
                      <div className="probability-bar">
                        <div className="probability-bar-fill" style={{ width: `${f.probability}%` }} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs border-[#1F1F1F]">{f.confidence}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#888] py-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No forecasts yet. Generate one!</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Earthquakes */}
        <Card className="terminal-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF3333]" />
                LIVE_EARTHQUAKES
              </CardTitle>
              <Badge variant="outline" className="text-xs border-[#FF3333]/30 text-[#FF3333]">
                <span className="w-2 h-2 bg-[#FF3333] rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {earthquakes.length > 0 ? (
                <div className="space-y-2">
                  {earthquakes.map((eq, i) => (
                    <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] border-l-2 border-l-[#FF3333] hover:border-[#FF3333] transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-lg font-bold text-[#FF3333]">M{eq.magnitude}</span>
                          <span className="text-xs text-[#888] ml-2">{new Date(eq.time).toLocaleString()}</span>
                        </div>
                        {eq.tsunami && <Badge className="bg-[#FF3333]/20 text-[#FF3333] text-xs">TSUNAMI</Badge>}
                      </div>
                      <p className="text-sm text-[#EDEDED] mt-1">{eq.location}</p>
                      <div className="text-xs text-[#888] mt-1">Depth: {eq.depth_km}km</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#888] py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Loading earthquake data...</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Disaster Risk Summary */}
      {disasterSummary && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="terminal-card">
            <CardContent className="p-4 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-[#FF3333]" />
              <div className="font-mono text-3xl font-bold text-[#FF3333]">{disasterSummary.earthquake_risk?.probability || 0}%</div>
              <div className="text-xs uppercase tracking-wider text-[#888] mt-1">EARTHQUAKE RISK</div>
              <Badge className={`mt-2 ${disasterSummary.earthquake_risk?.risk_level === "high" ? "risk-high" : disasterSummary.earthquake_risk?.risk_level === "elevated" ? "risk-elevated" : "risk-low"}`}>
                {disasterSummary.earthquake_risk?.risk_level?.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
          <Card className="terminal-card">
            <CardContent className="p-4 text-center">
              <Cloud className="w-8 h-8 mx-auto mb-2 text-[#FFAA00]" />
              <div className="font-mono text-3xl font-bold text-[#FFAA00]">{disasterSummary.weather_risk?.probability || 0}%</div>
              <div className="text-xs uppercase tracking-wider text-[#888] mt-1">WEATHER RISK</div>
              <Badge className={`mt-2 ${disasterSummary.weather_risk?.risk_level === "critical" ? "risk-critical" : disasterSummary.weather_risk?.risk_level === "high" ? "risk-high" : "risk-moderate"}`}>
                {disasterSummary.weather_risk?.risk_level?.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
          <Card className="terminal-card">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#00E5FF]" />
              <div className="font-mono text-3xl font-bold text-[#00E5FF]">{disasterSummary.global_risk_score || 0}%</div>
              <div className="text-xs uppercase tracking-wider text-[#888] mt-1">GLOBAL RISK SCORE</div>
              <Badge className="mt-2 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">COMBINED</Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// AI Forecast Component
const AIForecast = ({ getHeaders, user, setShowAuth }) => {
  const [question, setQuestion] = useState("");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Mantic.com style prediction categories
  const predictionCategories = [
    {
      id: "economics",
      label: "ECONOMICS",
      icon: "📈",
      color: "#00FF94",
      examples: [
        "Will US Fed cut interest rates in Q1 2025?",
        "Will inflation exceed 4% in the Eurozone by mid-2025?",
        "Will China's GDP growth fall below 4% in 2025?",
        "Will the US dollar strengthen against the Euro in 2025?"
      ],
      description: "Interest rates, inflation, GDP, currency, recession"
    },
    {
      id: "geopolitical",
      label: "GEOPOLITICAL",
      icon: "🌍",
      color: "#00E5FF",
      examples: [
        "Will Ukraine-Russia peace talks succeed in 2025?",
        "Will China take military action against Taiwan by 2026?",
        "Will Iran develop nuclear weapons by 2026?",
        "Will NATO expand to include new members in 2025?"
      ],
      description: "Wars, conflicts, treaties, international relations"
    },
    {
      id: "technology",
      label: "TECHNOLOGY",
      icon: "🤖",
      color: "#9D4EDD",
      examples: [
        "Will AGI be achieved by any lab before 2027?",
        "Will Apple release AR glasses in 2025?",
        "Will quantum computers break RSA encryption by 2030?",
        "Will self-driving cars be fully legal in the US by 2026?"
      ],
      description: "AI, quantum computing, autonomous systems, biotech"
    },
    {
      id: "finance",
      label: "FINANCE & MARKETS",
      icon: "💰",
      color: "#FFD700",
      examples: [
        "Will Bitcoin reach $150,000 by end of 2025?",
        "Will S&P 500 have a 20%+ correction in 2025?",
        "Will gold prices exceed $3,000/oz in 2025?",
        "Will a major hedge fund collapse in 2025?"
      ],
      description: "Stocks, crypto, commodities, M&A, IPOs"
    },
    {
      id: "disasters",
      label: "NATURAL DISASTERS",
      icon: "🌋",
      color: "#FF3333",
      examples: [
        "Will a magnitude 8+ earthquake hit Japan by 2026?",
        "Will a Category 5 hurricane make US landfall in 2025?",
        "Will there be a major volcanic eruption affecting air travel in 2025?",
        "Will global flooding events cause $100B+ damage in 2025?"
      ],
      description: "Earthquakes, hurricanes, tsunamis, volcanic activity"
    },
    {
      id: "politics",
      label: "POLITICS",
      icon: "🗳️",
      color: "#FF6B6B",
      examples: [
        "Will Republicans win the 2026 US midterms?",
        "Will UK hold a general election before 2025 ends?",
        "Will India's BJP retain power in 2024 elections?",
        "Will France's National Rally gain significant seats in 2025?"
      ],
      description: "Elections, policy changes, government stability"
    },
    {
      id: "corporate",
      label: "CORPORATE",
      icon: "🏢",
      color: "#FFAA00",
      examples: [
        "Will Elon Musk step down as Tesla CEO by 2026?",
        "Will Microsoft acquire a company for $50B+ in 2025?",
        "Will OpenAI go public before 2026?",
        "Will major tech layoffs continue through 2025?"
      ],
      description: "CEOs, acquisitions, IPOs, corporate strategy"
    },
    {
      id: "health",
      label: "HEALTH & PANDEMIC",
      icon: "🏥",
      color: "#00E5FF",
      examples: [
        "Will a new pandemic be declared by WHO before 2027?",
        "Will an mRNA cancer vaccine be approved in 2025?",
        "Will global life expectancy increase in 2025?",
        "Will bird flu cause significant human outbreaks in 2025?"
      ],
      description: "Diseases, vaccines, healthcare breakthroughs"
    },
    {
      id: "energy",
      label: "ENERGY & CLIMATE",
      icon: "⚡",
      color: "#00FF94",
      examples: [
        "Will oil prices exceed $100/barrel in 2025?",
        "Will renewable energy exceed 50% of global power by 2030?",
        "Will a major nuclear plant be commissioned in 2025?",
        "Will global carbon emissions decrease in 2025?"
      ],
      description: "Oil, renewables, nuclear, climate agreements"
    },
    {
      id: "space",
      label: "SPACE",
      icon: "🚀",
      color: "#9D4EDD",
      examples: [
        "Will SpaceX Starship reach orbit successfully in 2025?",
        "Will humans return to the Moon by 2026?",
        "Will evidence of extraterrestrial life be found by 2030?",
        "Will space tourism reach 1000 customers by 2026?"
      ],
      description: "Space exploration, satellites, astronomy"
    }
  ];

  const generateForecast = async () => {
    if (!user) {
      setShowAuth(true);
      toast.error("Please login to generate forecasts");
      return;
    }
    if (question.length < 10) {
      toast.error("Question must be at least 10 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/forecast`, { question }, { headers: getHeaders() });
      setForecast(res.data);
      toast.success("Forecast generated!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate forecast");
    }
    setLoading(false);
  };

  const selectExample = (example) => {
    setQuestion(example);
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6" data-testid="forecast-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00E5FF]" />
            AI_POWERED_FORECASTING_ENGINE
          </h2>
          <p className="text-xs text-[#888] mt-1">3-LLM Ensemble (GPT-4, Claude, Gemini) • 1M+ OSINT Sources • Bayesian Aggregation</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">{predictionCategories.length} CATEGORIES</Badge>
          <Badge variant="outline" className="border-[#FFD700] text-[#FFD700]">WORLD-CLASS</Badge>
        </div>
      </div>

      {/* Category Selection Grid */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">SELECT A PREDICTION CATEGORY</CardTitle>
          <CardDescription className="text-[#888] text-xs">Choose a category to see example questions or type your own below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {predictionCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`p-3 rounded border transition-all text-center ${
                  selectedCategory === cat.id 
                    ? `border-2 bg-[${cat.color}]/10` 
                    : "border-[#1F1F1F] hover:border-[#333]"
                }`}
                style={{borderColor: selectedCategory === cat.id ? cat.color : undefined}}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs font-bold" style={{color: cat.color}}>{cat.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Category Examples */}
      {selectedCategory && (
        <Card className="terminal-card border-l-4" style={{borderLeftColor: predictionCategories.find(c => c.id === selectedCategory)?.color}}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-xl">{predictionCategories.find(c => c.id === selectedCategory)?.icon}</span>
              {predictionCategories.find(c => c.id === selectedCategory)?.label} PREDICTIONS
            </CardTitle>
            <CardDescription className="text-[#888] text-xs">
              {predictionCategories.find(c => c.id === selectedCategory)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-[#888] mb-2">Click an example question or type your own:</div>
            <div className="grid md:grid-cols-2 gap-2">
              {predictionCategories.find(c => c.id === selectedCategory)?.examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => selectExample(ex)}
                  className="p-3 text-left text-sm bg-[#0A0A0A] border border-[#1F1F1F] rounded hover:border-[#00E5FF] hover:bg-[#0A0A0A]/80 transition-colors"
                >
                  <span className="text-[#EDEDED]">{ex}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Input */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">ASK YOUR PREDICTION QUESTION</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              data-testid="forecast-input"
              placeholder="e.g., Will there be a major earthquake in Japan by 2025?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="terminal-input flex-1"
              onKeyDown={(e) => e.key === "Enter" && generateForecast()}
            />
            <Button
              data-testid="forecast-generate-btn"
              onClick={generateForecast}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span className="ml-2">{loading ? "ANALYZING..." : "FORECAST"}</span>
            </Button>
          </div>

          {/* Quick category badges */}
          <div className="flex flex-wrap gap-1">
            {predictionCategories.map((cat) => (
              <Badge 
                key={cat.id}
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-[#1F1F1F]"
                style={{borderColor: `${cat.color}50`, color: cat.color}}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Result */}
      {forecast && (
        <Card className="terminal-card border-2 border-[#00E5FF]/30">
          <CardContent className="p-6" data-testid="forecast-result">
            <div className="text-center mb-6">
              <div className="font-mono text-6xl font-bold text-[#00E5FF]">{forecast.probability}%</div>
              <div className="text-[#888] text-sm mt-2">PROBABILITY ESTIMATE</div>
              <Badge className="mt-2 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">
                {forecast.confidence?.toUpperCase()} CONFIDENCE
              </Badge>
            </div>

            <Separator className="bg-[#1F1F1F] my-6" />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[#888] mb-2">RATIONALE</h4>
                <p className="text-sm text-[#EDEDED]">{forecast.rationale}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[#888] mb-2">INDIVIDUAL_LLM_FORECASTS</h4>
                <div className="space-y-2">
                  {forecast.individual_forecasts?.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-[#141414] border border-[#1F1F1F]">
                      <span className="text-sm text-[#888] uppercase">{f.provider}</span>
                      <span className="font-mono font-bold text-[#00E5FF]">{f.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-[#444]">
              Sources analyzed: {forecast.sources_analyzed?.toLocaleString()} | Method: {forecast.aggregation_method}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Summary Footer */}
      <div className="text-xs text-[#444] text-center">
        Prediction categories: Economics • Geopolitical • Technology • Finance • Disasters • Politics • Corporate • Health • Energy • Space
      </div>
    </div>
  );
};

// Disasters Component (Independent)
const Disasters = ({ getHeaders }) => {
  const [earthquakes, setEarthquakes] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [disasterSummary, setDisasterSummary] = useState(null);
  const [agencies, setAgencies] = useState(null);
  const [sensors, setSensors] = useState(null);
  const [economicImpact, setEconomicImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eqRes, wxRes, gdRes, summaryRes, agencyRes, sensorRes, econRes] = await Promise.all([
        axios.get(`${API}/disasters/earthquakes?min_magnitude=4.0&limit=20`),
        axios.get(`${API}/disasters/weather-alerts`),
        axios.get(`${API}/disasters/global`),
        axios.get(`${API}/disasters/summary`),
        axios.get(`${API}/disasters/agencies`),
        axios.get(`${API}/disasters/sensors`),
        axios.get(`${API}/disasters/economic-impact`),
      ]);
      setEarthquakes(eqRes.data.earthquakes || []);
      setWeatherAlerts(wxRes.data.alerts || []);
      setGlobalDisasters(gdRes.data.disasters || []);
      setDisasterSummary(summaryRes.data);
      setAgencies(agencyRes.data);
      setSensors(sensorRes.data);
      setEconomicImpact(econRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const views = [
    { id: "overview", label: "OVERVIEW", icon: Home },
    { id: "agencies", label: "AGENCIES", icon: Globe },
    { id: "sensors", label: "SENSORS", icon: Cpu },
    { id: "economic", label: "ECONOMIC", icon: DollarSign },
  ];

  return (
    <div className="space-y-6" data-testid="disasters-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF3333]" />
            AI_DISASTER_PREDICTION_ENGINE
          </h2>
          <p className="text-xs text-[#888] mt-1">Connected to {agencies?.total_agencies || 27} global agencies • {sensors?.total_sensors?.toLocaleString() || "57,213"} sensors • Save lives & $Trillions</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-[#FF3333]/30 text-[#FF3333]">
            <span className="w-2 h-2 bg-[#FF3333] rounded-full mr-1 animate-pulse" />LIVE
          </Badge>
          <Button onClick={loadData} variant="outline" size="sm" className="btn-secondary" data-testid="refresh-disasters-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />REFRESH
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 flex-wrap">
        {views.map((v) => (
          <Button
            key={v.id}
            size="sm"
            variant={activeView === v.id ? "default" : "outline"}
            onClick={() => setActiveView(v.id)}
            className={activeView === v.id ? "bg-[#FF3333] text-white" : "border-[#1F1F1F] text-[#888]"}
          >
            <v.icon className="w-3 h-3 mr-1" />
            {v.label}
          </Button>
        ))}
      </div>

      {/* OVERVIEW VIEW */}
      {activeView === "overview" && (
        <>
          {/* Risk Summary */}
          {disasterSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="terminal-card border-l-2 border-l-[#FF3333]">
                <CardContent className="p-3 text-center">
                  <div className="font-mono text-2xl font-bold text-[#FF3333]">{disasterSummary.earthquake_risk?.probability || 0}%</div>
                  <div className="text-xs text-[#888]">EARTHQUAKE RISK</div>
                  <Badge className={`mt-1 text-xs ${disasterSummary.earthquake_risk?.risk_level === "high" ? "risk-high" : "risk-moderate"}`}>
                    {disasterSummary.earthquake_risk?.risk_level?.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="terminal-card border-l-2 border-l-[#FFAA00]">
                <CardContent className="p-3 text-center">
                  <div className="font-mono text-2xl font-bold text-[#FFAA00]">{disasterSummary.weather_risk?.probability || 0}%</div>
                  <div className="text-xs text-[#888]">WEATHER RISK</div>
                  <Badge className={`mt-1 text-xs ${disasterSummary.weather_risk?.risk_level === "critical" ? "risk-critical" : "risk-elevated"}`}>
                    {disasterSummary.weather_risk?.risk_level?.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="terminal-card border-l-2 border-l-[#00E5FF]">
                <CardContent className="p-3 text-center">
                  <div className="font-mono text-2xl font-bold text-[#00E5FF]">{disasterSummary.global_risk_score || 0}%</div>
                  <div className="text-xs text-[#888]">GLOBAL RISK</div>
                  <Badge className="mt-1 text-xs bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">AI COMPUTED</Badge>
                </CardContent>
              </Card>
              <Card className="terminal-card border-l-2 border-l-[#00FF94]">
                <CardContent className="p-3 text-center">
                  <div className="font-mono text-2xl font-bold text-[#00FF94]">{earthquakes.length}</div>
                  <div className="text-xs text-[#888]">ACTIVE EVENTS</div>
                  <Badge className="mt-1 text-xs bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30">24H</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  🌍 LIVE EARTHQUAKES <Badge className="bg-[#FF3333]/20 text-[#FF3333]">USGS + EMSC</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {earthquakes.slice(0, 10).map((eq, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                      <div>
                        <div className="text-sm font-medium">{eq.location}</div>
                        <div className="text-xs text-[#888]">{new Date(eq.time).toLocaleString()}</div>
                      </div>
                      <Badge className={eq.magnitude >= 6 ? "bg-[#FF3333]" : eq.magnitude >= 5 ? "bg-[#FFAA00]" : "bg-[#00E5FF]"}>
                        M{eq.magnitude?.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  🌪️ WEATHER ALERTS <Badge className="bg-[#FFAA00]/20 text-[#FFAA00]">NOAA + MeteoAlarm</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {weatherAlerts.slice(0, 10).map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                      <div>
                        <div className="text-sm font-medium">{alert.event}</div>
                        <div className="text-xs text-[#888] truncate max-w-[200px]">{alert.areas}</div>
                      </div>
                      <Badge className={alert.severity === "Extreme" ? "bg-[#FF3333]" : alert.severity === "Severe" ? "bg-[#FFAA00]" : "bg-[#00E5FF]"}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* AGENCIES VIEW */}
      {activeView === "agencies" && agencies && (
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00E5FF]" />
                GLOBAL DISASTER AGENCIES CONNECTED
                <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{agencies.total_agencies} AGENCIES</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(agencies.agencies_by_region || {}).map(([region, agencyList]) => (
                  <div key={region} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-xs text-[#888] mb-2">{region.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="space-y-1">
                      {agencyList.map((agency, i) => (
                        <Badge key={i} className="mr-1 mb-1 bg-[#1F1F1F] text-[#EDEDED] text-xs">{agency}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">DATA COVERAGE BY HAZARD TYPE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(agencies.coverage || {}).map(([hazard, agencyList]) => (
                  <div key={hazard} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {hazard === "earthquake" ? "🌍" : hazard === "tsunami" ? "🌊" : hazard === "weather" ? "🌪️" : hazard === "volcano" ? "🌋" : hazard === "flood" ? "💧" : "⚠️"}
                      </span>
                      <span className="text-sm font-bold">{hazard.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-[#888]">{agencyList.join(", ")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SENSORS VIEW */}
      {activeView === "sensors" && sensors && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#00E5FF]">{sensors.total_sensors?.toLocaleString()}</div>
                <div className="text-xs text-[#888]">TOTAL SENSORS</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#00FF94]">{sensors.networks}</div>
                <div className="text-xs text-[#888]">NETWORKS</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{sensors.sensors_by_type?.seismic?.toLocaleString()}</div>
                <div className="text-xs text-[#888]">SEISMIC</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#9D4EDD]">{sensors.sensors_by_type?.weather?.toLocaleString()}</div>
                <div className="text-xs text-[#888]">WEATHER</div>
              </CardContent>
            </Card>
          </div>

          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00E5FF]" />
                IoT SENSOR NETWORKS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(sensors.sensor_networks || {}).map(([name, data]) => (
                  <div key={name} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{name.replace(/_/g, ' ')}</span>
                      <Badge className={data.status === "active" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#888]/20 text-[#888]"}>
                        {data.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#888]">{data.type?.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-[#00E5FF]">{data.region}</div>
                    <div className="text-lg font-bold mt-1">{data.sensors?.toLocaleString()} sensors</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">REAL-TIME CAPABILITIES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(sensors.capabilities || {}).map(([cap, desc]) => (
                  <div key={cap} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <span className="text-[#00FF94]">✓</span>
                    <div>
                      <div className="text-sm font-bold">{cap.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-xs text-[#888]">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ECONOMIC VIEW */}
      {activeView === "economic" && economicImpact && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#FF3333]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#FFD700]" />
                2024 GLOBAL DISASTER LOSSES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF3333]">{economicImpact["2024_losses"]?.total_economic}</div>
                  <div className="text-xs text-[#888]">ECONOMIC LOSS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FFAA00]">{economicImpact["2024_losses"]?.total_insured}</div>
                  <div className="text-xs text-[#888]">INSURED LOSS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#9D4EDD]">{economicImpact["2024_losses"]?.protection_gap}</div>
                  <div className="text-xs text-[#888]">PROTECTION GAP</div>
                </div>
              </div>
              <div className="space-y-2">
                {(economicImpact["2024_losses"]?.top_events || []).map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div>
                      <div className="text-sm font-bold">{event.event}</div>
                      <div className="text-xs text-[#888]">{event.region}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#FF3333]">{event.economic}</div>
                      <div className="text-xs text-[#888]">{event.insured} insured</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card border-l-4 border-l-[#00FF94]">
            <CardHeader>
              <CardTitle className="text-sm">PLUTUS VALUE PROPOSITION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0A0A0A] rounded border border-[#00FF94]/30">
                  <div className="text-lg font-bold text-[#00FF94]">Save Lives</div>
                  <div className="text-xs text-[#888] mt-1">50-90% casualty reduction with early warning</div>
                </div>
                <div className="p-4 bg-[#0A0A0A] rounded border border-[#FFD700]/30">
                  <div className="text-lg font-bold text-[#FFD700]">$15B+ Annual</div>
                  <div className="text-xs text-[#888] mt-1">10% better accuracy = $15B saved</div>
                </div>
                <div className="p-4 bg-[#0A0A0A] rounded border border-[#00E5FF]/30">
                  <div className="text-lg font-bold text-[#00E5FF]">$1B per Hour</div>
                  <div className="text-xs text-[#888] mt-1">Each hour of warning = $1B+ saved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-[#444] text-center">
        Connected to {agencies?.total_agencies || 27} disaster agencies worldwide • {sensors?.total_sensors?.toLocaleString() || "57,213"} IoT sensors • Save lives & $trillions
      </div>
    </div>
  );
};

// Astrology Component - Focus on Transcript Text & Disaster/War Predictions
const Astrology = ({ getHeaders, user }) => {
  const [channels, setChannels] = useState({});
  const [importedPredictions, setImportedPredictions] = useState([]);
  const [reconciledMatches, setReconciledMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [activeView, setActiveView] = useState("predictions");
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [channelsRes, predictionsRes, reconciledRes] = await Promise.all([
        axios.get(`${API}/astrology/channels`),
        axios.get(`${API}/astrology/imported-predictions?limit=50`),
        axios.get(`${API}/astrology/reconciled?limit=20`),
      ]);
      setChannels(channelsRes.data.channels || {});
      setImportedPredictions(predictionsRes.data.predictions || []);
      setReconciledMatches(reconciledRes.data.predictions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadCuratedPredictions = async () => {
    setImporting(true);
    toast.info("Loading curated predictions from 4 tracked channels...");
    try {
      const res = await axios.post(`${API}/astrology/load-curated`);
      toast.success(res.data.message);
      loadData();
    } catch (e) { 
      console.error(e);
      toast.error("Failed to load predictions"); 
    }
    setImporting(false);
  };

  const runReconciliation = async () => {
    if (!user) { toast.error("Please login"); return; }
    setReconciling(true);
    toast.info("Reconciling astrology predictions with AI disaster data...");
    try {
      const res = await axios.post(`${API}/astrology/reconcile`, {}, { headers: getHeaders() });
      toast.success(`Found ${res.data.matches_found} matches with actual disaster/conflict data`);
      loadData();
    } catch (e) { toast.error("Reconciliation failed"); }
    setReconciling(false);
  };

  const getCategoryColor = (cat) => {
    const colors = {
      earthquake: "#FF4444",
      war: "#FF6B6B",
      natural_disaster: "#00E5FF",
      pandemic: "#9D4EDD",
      volcanic: "#FF8C00",
      nuclear: "#FFD700",
      metals: "#FFD700",
      economic: "#00FF94",
      geopolitical: "#9D4EDD"
    };
    return colors[cat] || "#888";
  };

  const getCategoryIcon = (cat) => {
    if (cat === "earthquake") return "🌍";
    if (cat === "war") return "⚔️";
    if (cat === "natural_disaster") return "🌊";
    if (cat === "pandemic") return "🦠";
    if (cat === "volcanic") return "🌋";
    if (cat === "nuclear") return "☢️";
    if (cat === "metals") return "🥇";
    if (cat === "economic") return "📈";
    if (cat === "geopolitical") return "🌐";
    return "📊";
  };

  // Count predictions by category
  const predictionCounts = importedPredictions.reduce((acc, p) => {
    (p.predictions || []).forEach(pred => {
      acc[pred.category] = (acc[pred.category] || 0) + 1;
    });
    return acc;
  }, {});

  // Total predictions count
  const totalPredictions = Object.values(predictionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6" data-testid="astrology-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#9D4EDD]" />
            VEDIC_ASTROLOGY_PREDICTIONS
          </h2>
          <p className="text-xs text-[#888] mt-1">War, Disasters & Metal Prices from Abhigya Anand, Prashant Kapoor, Ashish Mehta & Preetika Rao</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadCuratedPredictions} disabled={importing} size="sm" className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-black text-xs">
            {importing ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
            LOAD_PREDICTIONS
          </Button>
          <Button onClick={runReconciliation} disabled={reconciling} size="sm" className="bg-[#00FF94] hover:bg-[#00FF94]/80 text-black text-xs">
            {reconciling ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}
            RECONCILE_WITH_AI
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#9D4EDD]">{Object.keys(channels).length}</div>
            <div className="text-xs text-[#888]">CHANNELS</div>
          </CardContent>
        </Card>
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#FFD700]">{totalPredictions}</div>
            <div className="text-xs text-[#888]">PREDICTIONS</div>
          </CardContent>
        </Card>
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#FF6B6B]">{predictionCounts.war || 0}</div>
            <div className="text-xs text-[#888]">WAR</div>
          </CardContent>
        </Card>
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#FF4444]">{predictionCounts.earthquake || 0}</div>
            <div className="text-xs text-[#888]">EARTHQUAKE</div>
          </CardContent>
        </Card>
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#00E5FF]">{(predictionCounts.natural_disaster || 0) + (predictionCounts.pandemic || 0)}</div>
            <div className="text-xs text-[#888]">DISASTERS</div>
          </CardContent>
        </Card>
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#FFD700]">{predictionCounts.metals || 0}</div>
            <div className="text-xs text-[#888]">METALS</div>
          </CardContent>
        </Card>
        <Card className="terminal-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-[#00FF94]">{reconciledMatches.length}</div>
            <div className="text-xs text-[#888]">RECONCILED</div>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-[#1F1F1F] pb-2">
        {[
          { id: "predictions", label: "EXTRACTED PREDICTIONS", icon: FileText },
          { id: "reconciled", label: "AI RECONCILED", icon: Target },
          { id: "channels", label: "SOURCE CHANNELS", icon: Star }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeView === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView(tab.id)}
            className={activeView === tab.id ? "bg-[#9D4EDD] text-white" : "text-[#888]"}
          >
            <tab.icon className="w-3 h-3 mr-1" />{tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#888]">Loading predictions...</div>
      ) : (
        <>
          {/* EXTRACTED PREDICTIONS VIEW - Shows actual transcript text */}
          {activeView === "predictions" && (
            <div className="space-y-4">
              {importedPredictions.length === 0 ? (
                <Card className="terminal-card">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-[#444] mx-auto mb-4" />
                    <h3 className="text-lg text-[#888] mb-2">No predictions loaded yet</h3>
                    <p className="text-sm text-[#666] mb-4">Click "LOAD_PREDICTIONS" to load curated predictions from Abhigya Anand, Prashant Kapoor, Ashish Mehta & Preetika Rao covering war, disasters, and metal prices for 2025-2030</p>
                    <Button onClick={loadCuratedPredictions} disabled={importing} className="bg-[#FFD700] text-black">
                      {importing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                      LOAD PREDICTIONS NOW
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {importedPredictions.map((item, idx) => (
                    <Card key={idx} className="terminal-card hover:border-[#9D4EDD]/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm text-[#EDEDED]">{item.title}</CardTitle>
                            <CardDescription className="text-xs text-[#9D4EDD]">{item.channel}</CardDescription>
                          </div>
                          <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">
                            {item.predictions?.length || 0} PREDICTIONS
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Show extracted predictions with context text */}
                        <div className="space-y-3">
                          {(item.predictions || []).map((pred, i) => (
                            <div key={i} className="p-4 bg-[#0A0A0A] border-l-4 rounded-lg" style={{borderColor: getCategoryColor(pred.category)}}>
                              <div className="flex items-center flex-wrap gap-2 mb-3">
                                <span className="text-2xl">{getCategoryIcon(pred.category)}</span>
                                <Badge className="text-sm px-3 py-1 font-bold" style={{backgroundColor: getCategoryColor(pred.category), color: '#000'}}>
                                  {pred.category?.toUpperCase().replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="border-[#FFD700] text-[#FFD700] px-2 py-1">
                                  📅 {pred.year_predicted}
                                </Badge>
                                <Badge variant="outline" className={`px-2 py-1 ${pred.confidence === "high" ? "border-[#00FF94] text-[#00FF94] bg-[#00FF94]/10" : "border-[#888] text-[#888]"}`}>
                                  {pred.confidence === "high" ? "⭐ HIGH CONFIDENCE" : pred.confidence?.toUpperCase()}
                                </Badge>
                              </div>
                              {/* ACTUAL TRANSCRIPT TEXT */}
                              <div className="text-sm text-[#EDEDED] bg-[#141414] p-3 rounded border border-[#1F1F1F] italic leading-relaxed">
                                "{pred.context}"
                              </div>
                              {/* Astrologer attribution */}
                              {pred.astrologer && (
                                <div className="mt-2 text-xs text-[#9D4EDD]">
                                  — {pred.astrologer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Transcript preview */}
                        {item.transcript_text && (
                          <details className="mt-3">
                            <summary className="text-xs text-[#888] cursor-pointer hover:text-[#EDEDED]">
                              View full transcript ({item.word_count} words)
                            </summary>
                            <div className="mt-2 p-3 bg-[#0A0A0A] text-xs text-[#888] max-h-[200px] overflow-y-auto border border-[#1F1F1F] rounded">
                              {item.transcript_text}
                            </div>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RECONCILED VIEW - Shows matches with AI disaster data */}
          {activeView === "reconciled" && (
            <div className="space-y-4">
              {reconciledMatches.length === 0 ? (
                <Card className="terminal-card">
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-[#444] mx-auto mb-4" />
                    <h3 className="text-lg text-[#888] mb-2">No reconciled predictions yet</h3>
                    <p className="text-sm text-[#666] mb-4">Click "RECONCILE_WITH_AI" to match astrology predictions with actual USGS earthquake data, NOAA alerts, and GDACS disaster reports</p>
                    <Button onClick={runReconciliation} disabled={reconciling} className="bg-[#00FF94] text-black">
                      {reconciling ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                      RECONCILE NOW
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card className="terminal-card bg-gradient-to-r from-[#00FF94]/10 to-transparent border-[#00FF94]/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#00FF94]/20 flex items-center justify-center">
                          <Target className="w-6 h-6 text-[#00FF94]" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#00FF94]">{reconciledMatches.length} MATCHES FOUND</div>
                          <div className="text-xs text-[#888]">Astrology predictions matched with actual disaster events from USGS/NOAA/GDACS</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {reconciledMatches.map((match, idx) => (
                    <Card key={idx} className="terminal-card border-l-4 border-l-[#00FF94]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{match.title}</CardTitle>
                        <CardDescription className="text-xs text-[#888]">{match.channel}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {match.reconciliation_result?.matches?.map((m, i) => (
                          <div key={i} className="p-3 bg-[#0A0A0A] border border-[#00FF94]/30 rounded mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{m.type?.toUpperCase()}</Badge>
                              <Badge variant="outline" className={m.match_confidence === "high" ? "border-[#00FF94] text-[#00FF94]" : "border-[#FFD700] text-[#FFD700]"}>
                                {m.match_confidence} confidence
                              </Badge>
                            </div>
                            <div className="text-sm text-[#EDEDED]">{m.event}</div>
                            <div className="text-xs text-[#888] mt-1">Date: {m.date}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHANNELS VIEW */}
          {activeView === "channels" && (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(channels).map(([key, ch]) => (
                <Card key={key} className="terminal-card hover:border-[#9D4EDD]/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#9D4EDD]/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-[#9D4EDD]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[#EDEDED]">{ch.name}</div>
                        <div className="text-xs text-[#888] mt-1">
                          {ch.specialty?.join(" • ")}
                        </div>
                        {ch.notable_predictions && (
                          <div className="mt-2 text-xs text-[#9D4EDD]">
                            Notable: {ch.notable_predictions?.slice(0, 2).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Info footer */}
      <div className="text-xs text-[#444] text-center p-2 border-t border-[#1F1F1F]">
        Predictions auto-reconciled daily at 7 AM with USGS earthquake data, NOAA alerts & GDACS disaster reports • Sources: Abhigya Anand, Prashant Kapoor, Ashish Mehta, Preetika Rao
      </div>
    </div>
  );
};

// Tabular Predictions Component
const TabularPredictions = () => {
  const [tables, setTables] = useState(null);
  const [activeTable, setActiveTable] = useState("business_tech");
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    axios.get(`${API}/tabular/all`).then(res => { 
      setTables(res.data.tables); 
      setMetadata({ source: res.data.source, osint: res.data.osint_sources, categories: res.data.categories });
      setLoading(false); 
    }).catch(console.error);
  }, []);

  const getRiskColor = (prob) => {
    if (prob >= 70) return "text-[#FF3333]";
    if (prob >= 50) return "text-[#FFAA00]";
    if (prob >= 30) return "text-[#FFD700]";
    return "text-[#00FF94]";
  };

  // Mantic-style categories (full coverage)
  const tableOptions = [
    { id: "business_tech", label: "BUSINESS", icon: TrendingUp },
    { id: "economics", label: "ECONOMICS", icon: BarChart3 },
    { id: "finance", label: "FINANCE", icon: DollarSign },
    { id: "technology", label: "TECHNOLOGY", icon: Cpu },
    { id: "energy", label: "ENERGY", icon: Zap },
    { id: "global_affairs", label: "GLOBAL", icon: Globe },
    { id: "geopolitical", label: "CONFLICT", icon: Shield },
    { id: "terror_attacks", label: "SECURITY", icon: AlertTriangle },
    { id: "ceo_departures", label: "CORPORATE", icon: Users },
  ];

  return (
    <div className="space-y-6" data-testid="tabular-view">
      {/* Header with OSINT badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00E5FF]" />PROBABILITY_STREAMS
          </h2>
          <p className="text-xs text-[#888] mt-1">AI-powered predictions across business, economics, geopolitics & more</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#00FF94]/20 text-[#00FF94] text-xs">1M+ OSINT SOURCES</Badge>
          <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD] text-xs">3-LLM ENSEMBLE</Badge>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#1F1F1F] pb-2">
        {tableOptions.map(t => (
          <Button 
            key={t.id} 
            onClick={() => setActiveTable(t.id)} 
            variant={activeTable === t.id ? "default" : "ghost"} 
            size="sm" 
            className={activeTable === t.id ? "bg-[#00E5FF] text-black text-xs" : "text-[#888] hover:text-white text-xs"}
          >
            <t.icon className="w-3 h-3 mr-1" />{t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#888]">Loading probability streams...</div>
      ) : tables && tables[activeTable] && (
        <Card className="terminal-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">{tables[activeTable].title}</CardTitle>
                <CardDescription className="text-xs text-[#888]">
                  Updated: {new Date(tables[activeTable].updated_at).toLocaleString()}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[#00E5FF] border-[#00E5FF]/30">
                {tables[activeTable].data?.length || 0} FORECASTS
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F1F]">
                    <th className="text-left py-3 text-xs text-[#888] uppercase w-[50%]">Prediction</th>
                    {(activeTable === "ceo_departures") && <th className="text-left py-3 text-xs text-[#888] uppercase">Company</th>}
                    {(activeTable === "terror_attacks") && <th className="text-left py-3 text-xs text-[#888] uppercase">Region</th>}
                    {(activeTable === "business_tech" || activeTable === "global_affairs") && <th className="text-left py-3 text-xs text-[#888] uppercase">Category</th>}
                    <th className="text-center py-3 text-xs text-[#888] uppercase">Probability</th>
                    <th className="text-center py-3 text-xs text-[#888] uppercase">Change</th>
                    <th className="text-center py-3 text-xs text-[#888] uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {tables[activeTable].data?.map((row, i) => (
                    <tr key={i} className="border-b border-[#1F1F1F]/50 hover:bg-[#141414] cursor-pointer">
                      <td className="py-3 text-[#EDEDED]">{row.question || row.name || row.country || row.event}</td>
                      {(activeTable === "ceo_departures") && <td className="py-3 text-[#888]">{row.company}</td>}
                      {(activeTable === "terror_attacks") && <td className="py-3 text-[#888]">{row.code}</td>}
                      {(activeTable === "business_tech" || activeTable === "global_affairs") && (
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs border-[#333]">{row.category || row.region}</Badge>
                        </td>
                      )}
                      <td className="py-3 text-center">
                        <span className={`font-mono font-bold text-lg ${getRiskColor(row.probability)}`}>{row.probability}%</span>
                      </td>
                      <td className={`py-3 text-center font-mono text-sm ${(row.change_30d || row.change_7d) > 0 ? "text-[#00FF94]" : (row.change_30d || row.change_7d) < 0 ? "text-[#FF3333]" : "text-[#888]"}`}>
                        {(row.change_30d || row.change_7d) > 0 ? "↑" : (row.change_30d || row.change_7d) < 0 ? "↓" : "–"} {Math.abs(row.change_30d || row.change_7d || 0)}%
                      </td>
                      <td className="py-3 text-center">
                        <Badge className={`text-xs ${row.confidence === "high" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FFD700]/20 text-[#FFD700]"}`}>
                          {row.confidence || "medium"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Overview */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PREDICTION_CATEGORIES</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {["Business", "Economics", "Finance", "Global Affairs", "Politics", "Conflict", "Technology", "Space", "Earthquake", "Weather", "Pandemic", "Energy", "India", "China", "USA", "Europe"].map((cat, i) => (
              <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-center">
                <div className="text-xs text-[#888]">{cat.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Deep Forecast Component
const DeepForecast = ({ getHeaders, user, setShowAuth }) => {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/deep-forecasts?limit=10`).then(res => setReports(res.data.reports || [])).catch(console.error);
  }, []);

  const generateReport = async () => {
    if (!user) { setShowAuth(true); toast.error("Please login"); return; }
    if (topic.length < 5) { toast.error("Topic must be at least 5 characters"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/deep-forecast`, { topic, num_questions: numQuestions, timeframe: "2025" }, { headers: getHeaders() });
      setReport(res.data);
      toast.success("Deep forecast generated!");
    } catch (e) { toast.error("Failed to generate report"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="deep-forecast-view">
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFD700]" />DEEP_FORECAST_ENGINE
          </CardTitle>
          <CardDescription className="text-[#888]">Generate comprehensive AI forecast reports with multiple related questions and executive summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Taiwan conflict, US recession, AI regulation..." className="terminal-input flex-1" data-testid="deep-forecast-topic" />
            <select value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))} className="terminal-input w-20">
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} Qs</option>)}
            </select>
            <Button onClick={generateReport} disabled={loading} className="btn-primary" data-testid="deep-forecast-btn">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}GENERATE
            </Button>
          </div>

          {report && (
            <div className="bg-[#0A0A0A] border border-[#FFD700]/30 p-6 glow-primary" data-testid="deep-forecast-result">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-[#FFD700]">{report.topic}</h3>
                <div className="font-mono text-4xl font-bold text-[#00E5FF] mt-2">{report.executive_summary?.average_probability}%</div>
                <div className="text-xs text-[#888] mt-1">AVERAGE PROBABILITY</div>
              </div>
              <div className="text-sm text-[#EDEDED] mb-4 p-3 bg-[#141414] border border-[#1F1F1F]">{report.executive_summary?.key_finding}</div>
              <div className="space-y-3">
                {report.forecasts?.map((f, i) => (
                  <div key={i} className="p-3 bg-[#141414] border border-[#1F1F1F]">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-[#EDEDED] flex-1">{f.question}</span>
                      <span className="font-mono text-lg font-bold text-[#00E5FF] ml-4">{f.probability}%</span>
                    </div>
                    <div className="probability-bar mt-2"><div className="probability-bar-fill" style={{ width: `${f.probability}%` }} /></div>
                    <p className="text-xs text-[#888] mt-2">{f.rationale}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-[#444]">Sources: {report.osint_summary?.articles_analyzed} articles | Method: {report.methodology}</div>
            </div>
          )}

          {reports.length > 0 && !report && (
            <div>
              <h4 className="text-xs uppercase text-[#888] mb-3">RECENT DEEP FORECASTS</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {reports.map((r, i) => (
                  <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#FFD700] cursor-pointer" onClick={() => setReport(r)}>
                    <div className="font-medium text-sm text-[#EDEDED]">{r.topic}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[#888]">{r.forecasts?.length} questions</span>
                      <span className="font-mono text-lg text-[#FFD700]">{r.executive_summary?.average_probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// =============================================================================
// INVESTMENT BANKER SUITE - World Class Analysis
// =============================================================================
const InvestmentBankerSuite = () => {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [maPredictions, setMaPredictions] = useState(null);
  const [ipoTiming, setIpoTiming] = useState(null);
  const [sectorRotation, setSectorRotation] = useState(null);
  
  const getHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/investment/dashboard`, { headers: getHeaders() });
      setDashboardData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  const loadPortfolioRisk = async () => {
    try {
      const res = await axios.post(`${API}/investment/portfolio-risk`, {}, { headers: getHeaders() });
      setPortfolioRisk(res.data);
    } catch (e) { console.error(e); }
  };

  const loadMAPredictions = async () => {
    try {
      const res = await axios.get(`${API}/investment/ma-predictions`, { headers: getHeaders() });
      setMaPredictions(res.data);
    } catch (e) { console.error(e); }
  };

  const loadIPOTiming = async () => {
    try {
      const res = await axios.get(`${API}/investment/ipo-timing`, { headers: getHeaders() });
      setIpoTiming(res.data);
    } catch (e) { console.error(e); }
  };

  const loadSectorRotation = async () => {
    try {
      const res = await axios.get(`${API}/investment/sector-rotation`, { headers: getHeaders() });
      setSectorRotation(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadDashboard();
    loadPortfolioRisk();
    loadMAPredictions();
    loadIPOTiming();
    loadSectorRotation();
  }, [loadDashboard]);

  const getRiskColor = (level) => {
    if (level === "HIGH") return "#FF4444";
    if (level === "MEDIUM") return "#FFD700";
    return "#00FF94";
  };

  const getWindowColor = (status) => {
    if (status === "OPEN") return "#00FF94";
    if (status === "FAVORABLE") return "#00E5FF";
    if (status === "CAUTIOUS") return "#FFD700";
    return "#FF4444";
  };

  const views = [
    { id: "dashboard", label: "EXECUTIVE SUMMARY", icon: Home },
    { id: "portfolio", label: "PORTFOLIO RISK", icon: Shield },
    { id: "ma", label: "M&A DEALS", icon: Users },
    { id: "ipo", label: "IPO TIMING", icon: TrendingUp },
    { id: "sectors", label: "SECTOR ROTATION", icon: RefreshCw },
  ];

  return (
    <div className="space-y-6" data-testid="investment-banking-suite">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00FF94]" />
            INVESTMENT_BANKER_SUITE
          </h2>
          <p className="text-xs text-[#888] mt-1">World-class analysis for professional investors • Portfolio Risk • M&A • IPO • Sectors</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]">PROFESSIONAL</Badge>
          <Badge variant="outline" className="border-[#FFD700] text-[#FFD700]">REAL-TIME</Badge>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 flex-wrap">
        {views.map((v) => (
          <Button
            key={v.id}
            size="sm"
            variant={activeView === v.id ? "default" : "outline"}
            onClick={() => setActiveView(v.id)}
            className={activeView === v.id ? "bg-[#00FF94] text-black" : "border-[#1F1F1F] text-[#888]"}
          >
            <v.icon className="w-3 h-3 mr-1" />
            {v.label}
          </Button>
        ))}
      </div>

      {/* Executive Summary Dashboard */}
      {activeView === "dashboard" && dashboardData && (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="terminal-card">
              <CardContent className="p-4">
                <div className="text-xs text-[#888] mb-1">RISK SCORE</div>
                <div className="text-3xl font-bold" style={{color: getRiskColor(dashboardData.dashboard?.risk_level)}}>
                  {dashboardData.dashboard?.risk_score || 0}
                </div>
                <Badge className="mt-2" style={{backgroundColor: `${getRiskColor(dashboardData.dashboard?.risk_level)}30`, color: getRiskColor(dashboardData.dashboard?.risk_level)}}>
                  {dashboardData.dashboard?.risk_level}
                </Badge>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4">
                <div className="text-xs text-[#888] mb-1">IPO WINDOW</div>
                <div className="text-3xl font-bold" style={{color: getWindowColor(dashboardData.dashboard?.ipo_window)}}>
                  {dashboardData.dashboard?.ipo_window_score || 0}
                </div>
                <Badge className="mt-2" style={{backgroundColor: `${getWindowColor(dashboardData.dashboard?.ipo_window)}30`, color: getWindowColor(dashboardData.dashboard?.ipo_window)}}>
                  {dashboardData.dashboard?.ipo_window}
                </Badge>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4">
                <div className="text-xs text-[#888] mb-1">ECONOMIC PHASE</div>
                <div className="text-xl font-bold text-[#00E5FF]">
                  {dashboardData.dashboard?.economic_phase}
                </div>
                <div className="text-xs text-[#888] mt-2">Cycle Position</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4">
                <div className="text-xs text-[#888] mb-1">VAR (95%)</div>
                <div className="text-2xl font-bold text-[#FF6B6B]">
                  ${dashboardData.quick_stats?.var_95?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-[#888] mt-2">Daily at Risk</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Picks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9D4EDD]" />
                  TOP M&A TARGET
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.dashboard?.top_ma_target && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{dashboardData.dashboard.top_ma_target.target}</span>
                      <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">{dashboardData.dashboard.top_ma_target.probability}%</Badge>
                    </div>
                    <div className="text-xs text-[#888]">Acquirer: {dashboardData.dashboard.top_ma_target.acquirer}</div>
                    <div className="text-xs text-[#00E5FF]">{dashboardData.dashboard.top_ma_target.deal_value}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00FF94]" />
                  TOP IPO
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.dashboard?.top_ipo && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{dashboardData.dashboard.top_ipo.company}</span>
                      <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{dashboardData.dashboard.top_ipo.probability}%</Badge>
                    </div>
                    <div className="text-xs text-[#888]">{dashboardData.dashboard.top_ipo.sector} • {dashboardData.dashboard.top_ipo.exchange}</div>
                    <div className="text-xs text-[#FFD700]">{dashboardData.dashboard.top_ipo.valuation}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sector Recommendations */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SECTOR POSITIONING</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#00FF94] mb-2">✓ OVERWEIGHT</div>
                  <div className="space-y-1">
                    {(dashboardData.dashboard?.top_sectors || []).map((s, i) => (
                      <Badge key={i} className="mr-2 bg-[#00FF94]/20 text-[#00FF94]">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#FF4444] mb-2">✗ UNDERWEIGHT</div>
                  <div className="space-y-1">
                    {(dashboardData.dashboard?.avoid_sectors || []).map((s, i) => (
                      <Badge key={i} className="mr-2 bg-[#FF4444]/20 text-[#FF4444]">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Risk Analysis */}
      {activeView === "portfolio" && portfolioRisk && (
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00E5FF]" />
                RISK FACTOR BREAKDOWN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(portfolioRisk.risk_metrics?.factor_scores || {}).map(([factor, score]) => (
                  <div key={factor} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-xs text-[#888] mb-1">{factor.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-2xl font-bold" style={{color: score > 60 ? '#FF4444' : score > 40 ? '#FFD700' : '#00FF94'}}>
                      {score}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stress Tests */}
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">STRESS TEST SCENARIOS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(portfolioRisk.stress_tests || []).map((test, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div>
                      <div className="font-medium">{test.scenario}</div>
                      <div className="text-xs text-[#888]">{test.probability}% probability</div>
                    </div>
                    <div className="text-lg font-bold text-[#FF4444]">
                      ${test.impact?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">RISK RECOMMENDATIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(portfolioRisk.recommendations || []).map((rec, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded border-l-4" style={{borderColor: rec.priority === 'high' ? '#FF4444' : rec.priority === 'medium' ? '#FFD700' : '#00FF94'}}>
                    <Badge style={{backgroundColor: rec.priority === 'high' ? '#FF4444' : rec.priority === 'medium' ? '#FFD700' : '#00FF94', color: '#000'}}>
                      {rec.priority?.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{rec.action}</div>
                      <div className="text-xs text-[#888]">Target: {rec.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* M&A Predictions */}
      {activeView === "ma" && maPredictions && (
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9D4EDD]" />
                  M&A DEAL PREDICTIONS
                </CardTitle>
                <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">{maPredictions.total_predicted_value}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(maPredictions.predictions || []).map((deal, i) => (
                  <div key={i} className="p-4 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#9D4EDD] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#EDEDED]">{deal.acquirer}</span>
                        <ChevronRight className="w-4 h-4 text-[#888]" />
                        <span className="text-lg font-bold text-[#9D4EDD]">{deal.target}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={deal.confidence === 'high' ? 'bg-[#00FF94]/20 text-[#00FF94]' : deal.confidence === 'medium' ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-[#888]/20 text-[#888]'}>
                          {deal.probability}%
                        </Badge>
                        <span className={`text-xs ${deal.change_30d >= 0 ? 'text-[#00FF94]' : 'text-[#FF4444]'}`}>
                          {deal.change_30d >= 0 ? '↑' : '↓'}{Math.abs(deal.change_30d)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#888]">
                      <span className="bg-[#1F1F1F] px-2 py-1 rounded">{deal.sector}</span>
                      <span className="text-[#FFD700]">{deal.deal_value}</span>
                      <span>{deal.timeline}</span>
                    </div>
                    <div className="mt-2 text-xs text-[#888]">{deal.rationale}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* IPO Timing */}
      {activeView === "ipo" && ipoTiming && (
        <div className="space-y-4">
          {/* Market Window */}
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">IPO MARKET WINDOW</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold" style={{color: getWindowColor(ipoTiming.market_window?.status)}}>
                    {ipoTiming.market_window?.score}
                  </div>
                  <Badge className="mt-2" style={{backgroundColor: `${getWindowColor(ipoTiming.market_window?.status)}30`, color: getWindowColor(ipoTiming.market_window?.status)}}>
                    {ipoTiming.market_window?.status}
                  </Badge>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(ipoTiming.market_window?.indicators || {}).map(([key, value]) => (
                    <div key={key} className="p-2 bg-[#0A0A0A] rounded text-center">
                      <div className="text-xs text-[#888]">{key.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm font-bold text-[#00E5FF]">{typeof value === 'number' ? value.toFixed(1) : value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming IPOs */}
          <Card className="terminal-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">UPCOMING IPO PIPELINE</CardTitle>
                <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{ipoTiming.total_pipeline_value}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(ipoTiming.upcoming_ipos || []).map((ipo, i) => (
                  <div key={i} className="p-4 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#00FF94] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-lg font-bold text-[#EDEDED]">{ipo.company}</span>
                        <Badge className="ml-2 bg-[#1F1F1F] text-[#888]">{ipo.sector}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={ipo.recommendation === 'SUBSCRIBE' ? 'bg-[#00FF94] text-black' : ipo.recommendation === 'WATCH' ? 'bg-[#FFD700] text-black' : 'bg-[#888] text-black'}>
                          {ipo.recommendation}
                        </Badge>
                        <span className="text-[#00E5FF] font-bold">{ipo.probability}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#888]">
                      <span className="text-[#FFD700]">{ipo.valuation}</span>
                      <span>{ipo.timing}</span>
                      <span>{ipo.exchange}</span>
                      <span className="text-[#00FF94]">Est. Pop: {ipo.first_day_pop_estimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sector Rotation */}
      {activeView === "sectors" && sectorRotation && (
        <div className="space-y-4">
          {/* Economic Cycle */}
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">ECONOMIC CYCLE POSITION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#00E5FF]">{sectorRotation.economic_cycle?.current_phase}</div>
                  <div className="text-xs text-[#888] mt-1">Est. Duration: {sectorRotation.economic_cycle?.phase_duration_estimate}</div>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(sectorRotation.economic_cycle?.indicators || {}).map(([key, value]) => (
                    <div key={key} className="p-2 bg-[#0A0A0A] rounded text-center">
                      <div className="text-xs text-[#888]">{key.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm font-bold text-[#FFD700]">{typeof value === 'number' ? value.toFixed(1) : value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector Rankings */}
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">SECTOR RANKINGS & SIGNALS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(sectorRotation.sector_rankings || []).map((sector, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-[#0A0A0A] rounded border-l-4" style={{borderColor: sector.signal === 'OVERWEIGHT' ? '#00FF94' : sector.signal === 'UNDERWEIGHT' ? '#FF4444' : '#888'}}>
                    <div className="w-8 text-center font-bold text-[#888]">#{i+1}</div>
                    <div className="flex-1">
                      <div className="font-medium">{sector.sector}</div>
                      <div className="text-xs text-[#888]">{sector.key_drivers?.join(' • ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{color: sector.score > 60 ? '#00FF94' : sector.score > 40 ? '#FFD700' : '#FF4444'}}>
                        {sector.score}
                      </div>
                      <Badge className={sector.signal === 'OVERWEIGHT' ? 'bg-[#00FF94] text-black' : sector.signal === 'UNDERWEIGHT' ? 'bg-[#FF4444] text-white' : 'bg-[#888] text-white'}>
                        {sector.signal}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#888]">
                      <div className={sector.relative_strength >= 0 ? 'text-[#00FF94]' : 'text-[#FF4444]'}>
                        RS: {sector.relative_strength >= 0 ? '+' : ''}{sector.relative_strength}
                      </div>
                      <div>{sector.momentum}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rotation Recommendations */}
          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">RECOMMENDED ROTATIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(sectorRotation.recommended_rotations || []).map((rot, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <Badge className="bg-[#FF4444]/20 text-[#FF4444]">{rot.from}</Badge>
                    <ChevronRight className="w-4 h-4 text-[#FFD700]" />
                    <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{rot.to}</Badge>
                    <Badge variant="outline" className={rot.conviction === 'HIGH' ? 'border-[#00FF94] text-[#00FF94]' : 'border-[#888] text-[#888]'}>
                      {rot.conviction}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-[#888]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading investment analysis...
        </div>
      )}
    </div>
  );
};

// OSINT Search Component
const OSINTSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API}/osint/stats`).then((res) => setStats(res.data)).catch(console.error);
  }, []);

  const search = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/osint/search?query=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (e) {
      toast.error("Search failed");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="osint-view">
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-5 h-5 text-[#00E5FF]" />
            OSINT_SEARCH
          </CardTitle>
          <CardDescription className="text-[#888]">
            Search across {stats?.total_sources?.toLocaleString() || "1,000,000+"} open-source intelligence sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              data-testid="osint-input"
              placeholder="Search news, academic papers, government data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="terminal-input flex-1"
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search} disabled={loading} className="btn-primary" data-testid="osint-search-btn">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="ml-2">SEARCH</span>
            </Button>
          </div>

          {results && (
            <div className="grid md:grid-cols-2 gap-4" data-testid="osint-results">
              {Object.entries(results.sources || {}).map(([source, items]) => (
                items.length > 0 && (
                  <Card key={source} className="terminal-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase text-[#888]">{source.replace("_", " ")} ({items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {items.slice(0, 5).map((item, i) => (
                            <div key={i} className="p-2 bg-[#141414] border border-[#1F1F1F] text-sm">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#00E5FF] hover:underline line-clamp-2">
                                {item.title}
                              </a>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Backtest Component
const Backtest = ({ getHeaders }) => {
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-01");
  const [sampleSize, setSampleSize] = useState(1000);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/backtest/run`, { start_date: startDate, end_date: endDate, sample_size: sampleSize }, { headers: getHeaders() });
      setResults(res.data);
      toast.success("Backtest complete!");
    } catch (e) {
      toast.error("Backtest failed");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="backtest-view">
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00E5FF]" />
            BACKTESTING_ENGINE
          </CardTitle>
          <CardDescription className="text-[#888]">
            Evaluate forecasting accuracy against historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-xs text-[#888] uppercase">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="terminal-input mt-1" data-testid="backtest-start" />
            </div>
            <div>
              <label className="text-xs text-[#888] uppercase">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="terminal-input mt-1" data-testid="backtest-end" />
            </div>
            <div>
              <label className="text-xs text-[#888] uppercase">Sample Size</label>
              <Input type="number" value={sampleSize} onChange={(e) => setSampleSize(parseInt(e.target.value))} className="terminal-input mt-1" data-testid="backtest-size" />
            </div>
            <div className="flex items-end">
              <Button onClick={runBacktest} disabled={loading} className="btn-primary w-full" data-testid="backtest-run-btn">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                RUN
              </Button>
            </div>
          </div>

          {results && (
            <div data-testid="backtest-results">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#00FF94]/10 border-[#00FF94]/30">
                  <CardContent className="p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-[#00FF94]">{results.results?.brier_score}</div>
                    <div className="text-xs text-[#888] uppercase">Brier Score</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#00E5FF]/10 border-[#00E5FF]/30">
                  <CardContent className="p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-[#00E5FF]">{(results.results?.calibration * 100).toFixed(1)}%</div>
                    <div className="text-xs text-[#888] uppercase">Calibration</div>
                  </CardContent>
                </Card>
                <Card className="bg-[#FFD700]/10 border-[#FFD700]/30">
                  <CardContent className="p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-[#FFD700]">{results.results?.accuracy}%</div>
                    <div className="text-xs text-[#888] uppercase">Accuracy</div>
                  </CardContent>
                </Card>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.monthly_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid #1F1F1F" }} />
                    <Line type="monotone" dataKey="calibration" stroke="#00E5FF" strokeWidth={2} dot={{ fill: "#00E5FF" }} />
                    <Line type="monotone" dataKey="brier" stroke="#FF3333" strokeWidth={2} dot={{ fill: "#FF3333" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Risk Grid Component
const RiskGrid = () => {
  const [countries, setCountries] = useState([]);
  const [ceos, setCeos] = useState([]);

  useEffect(() => {
    axios.get(`${API}/grid/countries`).then((res) => setCountries(res.data.countries || [])).catch(console.error);
    axios.get(`${API}/grid/ceos`).then((res) => setCeos(res.data.ceos || [])).catch(console.error);
  }, []);

  const getRiskColor = (risk) => {
    if (risk < 25) return "bg-[#00FF94]";
    if (risk < 50) return "bg-[#FFD700]";
    if (risk < 70) return "bg-[#FFAA00]";
    return "bg-[#FF3333]";
  };

  return (
    <div className="space-y-6" data-testid="grid-view">
      {/* Country Risk */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00E5FF]" />
            COUNTRY_RISK_GRID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {countries.map((c, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`${getRiskColor(c.risk)} p-2 text-center text-black font-bold text-xs cursor-pointer hover:scale-105 transition-transform`} data-testid={`country-${c.code}`}>
                      {c.code}
                      <div className="font-mono">{c.risk}%</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="terminal-tooltip">
                    <p>{c.name}</p>
                    <p className="text-xs text-[#888]">{c.category}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CEO Departures */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FFD700]" />
            CEO_DEPARTURE_PROBABILITY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {ceos.map((c, i) => (
              <div key={i} className="p-4 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#FFD700] transition-colors" data-testid={`ceo-${c.company}`}>
                <div className="font-medium text-[#EDEDED]">{c.name}</div>
                <div className="text-xs text-[#888]">{c.company}</div>
                <div className="font-mono text-2xl font-bold text-[#FFD700] mt-2">{c.departure_prob}%</div>
                <Progress value={c.departure_prob} className="h-1 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Competitor Comparison Component
const CompetitorComparison = () => {
  const [activeTab, setActiveTab] = useState("forecasting");

  // Forecasting Platform Comparison Data
  const forecastingComparison = {
    title: "AI Forecasting Platforms",
    subtitle: "Plutus Predict vs Mantic.com & Others",
    competitors: [
      {
        name: "Plutus Predict",
        isUs: true,
        features: {
          "AI-Powered Engine": { value: "3 LLMs", details: "GPT-4 + Claude + Gemini ensemble", highlight: true },
          "OSINT Aggregation": { value: "1M+", details: "Sources integrated", highlight: true },
          "Prediction Categories": { value: "10+", details: "Economics, Geopolitical, Tech, etc." },
          "Probability Streams": { value: "✓", details: "Mantic-style tabular forecasts" },
          "Deep Forecast Reports": { value: "AI-Gen", details: "On-demand analysis" },
          "Disaster Prediction": { value: "✓", details: "27 agencies, 57K+ IoT sensors", highlight: true },
          "Investment Banking Suite": { value: "AI-Powered", details: "M&A, IPO, Risk Analysis", highlight: true },
          "Vedic Astrology": { value: "✓", details: "Curated predictions", highlight: true },
          "Real-time Alerts": { value: "✓", details: "Email & in-app" },
          "Admin Panel": { value: "Enterprise", details: "Full management suite" },
          "Multi-language": { value: "6", details: "EN, ES, FR, AR, ID, SW" },
          "3D Visualization": { value: "✓", details: "Globe view" },
          "Pricing": { value: "Competitive", details: "Enterprise & Pro tiers" },
        }
      },
      {
        name: "Mantic.com",
        features: {
          "AI-Powered Engine": { value: "1 LLM", details: "Proprietary AI model" },
          "OSINT Aggregation": { value: "✓", details: "Multiple sources" },
          "Prediction Categories": { value: "5+", details: "Geopolitics, Business, Policy" },
          "Probability Streams": { value: "✓", details: "Tabular outputs" },
          "Deep Forecast Reports": { value: "✓", details: "On-demand" },
          "Disaster Prediction": { value: "Limited", details: "Not primary focus" },
          "Investment Banking Suite": { value: "✗", details: "Not available" },
          "Vedic Astrology": { value: "✗", details: "Not available" },
          "Real-time Alerts": { value: "✓", details: "Dashboard alerts" },
          "Admin Panel": { value: "Custom", details: "Client dashboards" },
          "Multi-language": { value: "1", details: "English only" },
          "3D Visualization": { value: "✗", details: "Not available" },
          "Pricing": { value: "Enterprise", details: "Custom pricing" },
        }
      },
      {
        name: "OneConcern",
        features: {
          "AI-Powered Engine": { value: "1 LLM", details: "Proprietary only" },
          "OSINT Aggregation": { value: "Limited", details: "Disaster-focused" },
          "Prediction Categories": { value: "3", details: "Earthquake, Flood, Fire" },
          "Probability Streams": { value: "✗", details: "Risk scores only" },
          "Deep Forecast Reports": { value: "✓", details: "Risk reports" },
          "Disaster Prediction": { value: "✓", details: "Primary focus" },
          "Investment Banking Suite": { value: "✗", details: "Not available" },
          "Vedic Astrology": { value: "✗", details: "Not available" },
          "Real-time Alerts": { value: "✓", details: "Government alerts" },
          "Admin Panel": { value: "Limited", details: "Basic" },
          "Multi-language": { value: "2-3", details: "Limited" },
          "3D Visualization": { value: "✓", details: "Map-based" },
          "Pricing": { value: "Enterprise", details: "Government contracts" },
        }
      }
    ]
  };

  // Investment Banking Suite Comparison
  const ibComparison = {
    title: "Investment Banking Tools",
    subtitle: "Plutus IB Suite vs Bloomberg & Competitors",
    competitors: [
      {
        name: "Plutus IB Suite",
        isUs: true,
        features: {
          "M&A Deal Predictions": { value: "AI-Powered", details: "Probability-based", highlight: true },
          "IPO Window Analysis": { value: "✓", details: "Market timing AI", highlight: true },
          "Sector Rotation": { value: "✓", details: "AI recommendations", highlight: true },
          "Risk Analytics": { value: "Multi-factor", details: "VaR, stress tests" },
          "Real-time Data": { value: "Simulated", details: "Demo environment" },
          "Company Screening": { value: "AI-Enhanced", details: "Pattern recognition" },
          "Price": { value: "$5K/yr", details: "Enterprise tier", highlight: true },
          "API Access": { value: "✓", details: "Full API" },
          "Custom Dashboards": { value: "✓", details: "Drag & drop" },
        }
      },
      {
        name: "Bloomberg Terminal",
        features: {
          "M&A Deal Predictions": { value: "Historical", details: "Data-based analysis" },
          "IPO Window Analysis": { value: "✓", details: "Market data" },
          "Sector Rotation": { value: "Manual", details: "Research required" },
          "Risk Analytics": { value: "Comprehensive", details: "Industry standard" },
          "Real-time Data": { value: "✓", details: "Live feeds" },
          "Company Screening": { value: "✓", details: "Extensive filters" },
          "Price": { value: "$25K/yr", details: "Per seat" },
          "API Access": { value: "Limited", details: "Additional cost" },
          "Custom Dashboards": { value: "✓", details: "Bloomberg functions" },
        }
      },
      {
        name: "S&P Capital IQ",
        features: {
          "M&A Deal Predictions": { value: "Historical", details: "Transaction data" },
          "IPO Window Analysis": { value: "✓", details: "Pipeline data" },
          "Sector Rotation": { value: "Manual", details: "Research tools" },
          "Risk Analytics": { value: "Good", details: "Credit ratings" },
          "Real-time Data": { value: "Delayed", details: "15-20 min" },
          "Company Screening": { value: "✓", details: "Advanced screening" },
          "Price": { value: "$15K/yr", details: "Per seat" },
          "API Access": { value: "✓", details: "Full API" },
          "Custom Dashboards": { value: "Limited", details: "Template-based" },
        }
      },
      {
        name: "Koyfin",
        features: {
          "M&A Deal Predictions": { value: "✗", details: "Not available" },
          "IPO Window Analysis": { value: "Limited", details: "Market data only" },
          "Sector Rotation": { value: "✓", details: "Analytics" },
          "Risk Analytics": { value: "Basic", details: "Stock metrics" },
          "Real-time Data": { value: "✓", details: "Live quotes" },
          "Company Screening": { value: "✓", details: "Good screener" },
          "Price": { value: "$840/yr", details: "Pro plan" },
          "API Access": { value: "Limited", details: "Premium only" },
          "Custom Dashboards": { value: "✓", details: "Flexible" },
        }
      }
    ]
  };

  const currentData = activeTab === "forecasting" ? forecastingComparison : ibComparison;

  return (
    <div className="space-y-6" data-testid="comparison-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#00E5FF]" />
            COMPETITIVE_LANDSCAPE
          </h2>
          <p className="text-sm text-[#888] mt-1">
            How Plutus Predict compares to market alternatives
          </p>
        </div>
        <Badge className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
          MARKET ANALYSIS
        </Badge>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeTab === "forecasting" ? "default" : "outline"}
          onClick={() => setActiveTab("forecasting")}
          className={activeTab === "forecasting" ? "bg-[#00E5FF] text-black" : ""}
        >
          <Brain className="w-4 h-4 mr-2" />
          AI Forecasting
        </Button>
        <Button
          size="sm"
          variant={activeTab === "investment" ? "default" : "outline"}
          onClick={() => setActiveTab("investment")}
          className={activeTab === "investment" ? "bg-[#FFD700] text-black" : ""}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Investment Banking
        </Button>
      </div>

      {/* Comparison Table */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{currentData.title}</CardTitle>
          <CardDescription>{currentData.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F1F1F]">
                  <th className="text-left py-3 px-2 text-[#888]">Feature</th>
                  {currentData.competitors.map((comp, i) => (
                    <th key={i} className={`text-center py-3 px-2 ${comp.isUs ? "text-[#00FF94]" : "text-[#888]"}`}>
                      {comp.name}
                      {comp.isUs && <span className="ml-1 text-[10px]">⭐</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(currentData.competitors[0].features).map((feature, i) => (
                  <tr key={i} className="border-b border-[#1F1F1F] hover:bg-[#0A0A0A]">
                    <td className="py-3 px-2 text-[#EDEDED]">{feature}</td>
                    {currentData.competitors.map((comp, j) => {
                      const feat = comp.features[feature];
                      const isHighlight = feat.highlight && comp.isUs;
                      return (
                        <td key={j} className={`text-center py-3 px-2 ${
                          isHighlight ? "bg-[#00FF94]/10" : ""
                        }`}>
                          <div className={`font-medium ${
                            feat.value === "✓" ? "text-[#00FF94]" :
                            feat.value === "✗" ? "text-[#FF4444]" :
                            feat.value === "Limited" ? "text-[#FFD700]" :
                            comp.isUs ? "text-[#00E5FF]" : "text-[#EDEDED]"
                          }`}>
                            {feat.value}
                          </div>
                          <div className="text-[10px] text-[#666] mt-0.5">{feat.details}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Differentiators */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="terminal-card border-[#00FF94]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-[#00FF94]" />
              <h3 className="font-medium text-[#00FF94]">Unique to Plutus</h3>
            </div>
            <ul className="text-xs text-[#888] space-y-1">
              <li>• Combined forecasting + disaster prediction</li>
              <li>• Investment banking AI suite integrated</li>
              <li>• Vedic astrology predictions</li>
              <li>• 6 languages including Swahili</li>
              <li>• 27 disaster agencies connected</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="terminal-card border-[#00E5FF]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[#00E5FF]" />
              <h3 className="font-medium text-[#00E5FF]">Market Position</h3>
            </div>
            <ul className="text-xs text-[#888] space-y-1">
              <li>• Only platform with full-stack approach</li>
              <li>• Enterprise + consumer focus</li>
              <li>• Cost-effective vs Bloomberg ($5K vs $25K)</li>
              <li>• AI-first architecture</li>
              <li>• Real-time OSINT pipeline</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="terminal-card border-[#FFD700]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-[#FFD700]" />
              <h3 className="font-medium text-[#FFD700]">Global Reach</h3>
            </div>
            <ul className="text-xs text-[#888] space-y-1">
              <li>• No direct competitor exists globally</li>
              <li>• Mantic: Forecasting only</li>
              <li>• OneConcern: Disasters only</li>
              <li>• Bloomberg: Finance only</li>
              <li>• Plutus: All-in-one platform</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Market Summary */}
      <Card className="terminal-card bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A]">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">📊 Market Summary</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-[#00E5FF] font-medium mb-2">vs Mantic.com</h4>
              <p className="text-[#888]">
                Mantic focuses purely on AI forecasting for geopolitical/business predictions. 
                Plutus Predict offers similar forecasting capabilities PLUS disaster prediction, 
                investment banking tools, and unique features like Vedic astrology. 
                Mantic targets enterprise clients only; Plutus serves both enterprise and pro users.
              </p>
            </div>
            <div>
              <h4 className="text-[#00E5FF] font-medium mb-2">vs IB Tools (Bloomberg, Capital IQ)</h4>
              <p className="text-[#888]">
                Traditional IB tools focus on historical data and manual analysis. 
                Plutus IB Suite adds AI-powered predictions for M&A, IPO timing, and sector rotation. 
                At ~80% lower cost than Bloomberg, with unique AI-driven insights not available elsewhere.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[#00FF94]/10 rounded border border-[#00FF94]/30">
            <p className="text-sm text-[#00FF94]">
              <strong>Conclusion:</strong> No single platform in the world combines AI forecasting, 
              disaster prediction, investment banking tools, and alternative data (astrology) like Plutus Predict. 
              This creates a unique market position with no direct competitors.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Chat Component
const Chat = ({ getHeaders, user, setShowAuth }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [suggestions] = useState([
    "What's the current global risk assessment?",
    "Show me earthquake predictions for Asia",
    "Analyze M&A trends in tech sector",
    "What are the top geopolitical risks?",
    "Compare disaster risks across regions",
    "What's the IPO market outlook?"
  ]);
  const [context, setContext] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (user) {
      axios.get(`${API}/chat/history`, { headers: getHeaders() })
        .then((res) => setMessages(res.data.history || []))
        .catch(console.error);
    }
  }, [user, getHeaders]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText = null) => {
    const msgToSend = messageText || input;
    if (!msgToSend.trim()) return;
    
    if (!user) {
      // Allow guest usage with limited features
      toast.info("Login for full features and history");
    }
    
    const userMsg = { 
      role: "user", 
      content: msgToSend, 
      timestamp: new Date().toISOString(),
      session_id: sessionId
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Use interactive endpoint for context-aware responses
      const res = await axios.post(`${API}/chat/interactive`, { 
        message: msgToSend,
        session_id: sessionId,
        context: context
      }, { headers: user ? getHeaders() : {} });
      
      const assistantMsg = {
        role: "assistant",
        content: res.data.response,
        timestamp: new Date().toISOString(),
        context: res.data.context,
        interactive: res.data.interactive
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      setContext(res.data.context);
    } catch (e) {
      // Fallback to basic chat
      try {
        const res = await axios.post(`${API}/chat`, { message: msgToSend }, { headers: user ? getHeaders() : {} });
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: res.data.response, 
          timestamp: res.data.timestamp || new Date().toISOString() 
        }]);
      } catch (e2) {
        toast.error("Failed to send message");
      }
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    setContext(null);
  };

  const exportChat = () => {
    const chatText = messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plutus_chat_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6" data-testid="chat-view">
      {/* Chat Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#00E5FF]" />
            PLUTUS_AI_ASSISTANT
          </h2>
          <p className="text-sm text-[#888] mt-1">
            Ask about forecasts, disasters, markets, risk analysis & more
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30">
            <div className="w-2 h-2 rounded-full bg-[#00FF94] mr-2 animate-pulse" />
            GPT-4 POWERED
          </Badge>
          {context && (
            <Badge variant="outline" className="text-[#00E5FF]">
              Context: {context}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat */}
        <div className="lg:col-span-3">
          <Card className="terminal-card h-[600px] flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#00E5FF]" />
                CONVERSATION
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={exportChat} title="Export Chat">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={clearChat} title="Clear Chat">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-[#1F1F1F] mx-auto mb-4" />
                      <h3 className="text-lg text-[#888] mb-2">Start a Conversation</h3>
                      <p className="text-sm text-[#666] max-w-md mx-auto">
                        I can help with forecasts, disaster analysis, investment insights, 
                        risk assessment, and platform navigation.
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-lg ${
                        msg.role === "user" 
                          ? "bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/10 border border-[#00E5FF]/30" 
                          : "bg-[#0A0A0A] border border-[#1F1F1F]"
                      }`}>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {msg.role === "user" ? (
                              <User className="w-3 h-3 text-[#00E5FF]" />
                            ) : (
                              <Brain className="w-3 h-3 text-[#00FF94]" />
                            )}
                            <span className="text-[10px] text-[#888] uppercase">
                              {msg.role === "user" ? "You" : "Plutus AI"}
                            </span>
                            {msg.interactive && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0">Interactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#EDEDED] whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-[10px] text-[#444] mt-2 block">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-[#00FF94] animate-pulse" />
                          <span className="text-xs text-[#888]">Thinking...</span>
                          <div className="flex gap-1 ml-2">
                            <span className="w-2 h-2 bg-[#00E5FF] rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <span className="w-2 h-2 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    data-testid="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about forecasts, disasters, markets..."
                    className="terminal-input flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="btn-primary" data-testid="chat-send-btn">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Actions & Suggestions */}
        <div className="space-y-4">
          {/* Quick Suggestions */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                QUICK_PROMPTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading}
                  className="w-full text-left text-xs p-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded border border-[#1F1F1F] hover:border-[#333] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00FF94]" />
                CAPABILITIES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Brain, label: "AI Forecasting", color: "#00E5FF" },
                { icon: AlertTriangle, label: "Disaster Analysis", color: "#FF6B6B" },
                { icon: TrendingUp, label: "Market Insights", color: "#00FF94" },
                { icon: Globe, label: "Geopolitical Risk", color: "#FFD700" },
                { icon: Target, label: "Risk Assessment", color: "#9D4EDD" },
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#888]">
                  <cap.icon className="w-3 h-3" style={{ color: cap.color }} />
                  {cap.label}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className="terminal-card">
            <CardContent className="p-3">
              <div className="text-[10px] text-[#666] space-y-1">
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="text-[#00E5FF]">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session:</span>
                  <span className="text-[#888] font-mono">{sessionId.slice(-8)}</span>
                </div>
                {user && (
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="text-[#00FF94]">{user.name || user.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Accuracy Dashboard Component
const AccuracyDashboard = ({ getHeaders, user, setShowAuth }) => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes, leaderRes] = await Promise.all([
        axios.get(`${API}/accuracy/stats?days=${days}`),
        axios.get(`${API}/accuracy/trends?months=6`),
        axios.get(`${API}/accuracy/leaderboard`)
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setLeaderboard(leaderRes.data.leaderboard || []);
    } catch (e) {
      console.error("Error loading accuracy data:", e);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGradeColor = (grade) => {
    if (grade?.startsWith("A")) return "text-[#00FF94]";
    if (grade?.startsWith("B")) return "text-[#00E5FF]";
    if (grade?.startsWith("C")) return "text-[#FFD700]";
    return "text-[#FF4444]";
  };

  return (
    <div className="space-y-6" data-testid="accuracy-dashboard">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-[#00FF94]" />PREDICTION_ACCURACY
        </h2>
        <div className="flex gap-2">
          {[30, 90, 180, 365].map(d => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              onClick={() => setDays(d)}
              className={days === d ? "bg-[#00FF94] text-black" : "border-[#333]"}
            >
              {d}D
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#888]">Loading accuracy data...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#00FF94]">{stats?.total_predictions || 0}</div>
                <div className="text-xs text-[#888] mt-1">TOTAL RESOLVED</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#00E5FF]">{stats?.overall_accuracy || 0}%</div>
                <div className="text-xs text-[#888] mt-1">ACCURACY RATE</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{stats?.average_brier_score || 0}</div>
                <div className="text-xs text-[#888] mt-1">BRIER SCORE</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${getGradeColor(stats?.calibration_grade)}`}>
                  {stats?.calibration_grade || "N/A"}
                </div>
                <div className="text-xs text-[#888] mt-1">CALIBRATION</div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00E5FF]" />ACCURACY_TREND
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                    <XAxis dataKey="month" stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                    <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 10 }} domain={[0, 100]} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid #1F1F1F" }}
                      labelStyle={{ color: "#EDEDED" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#00FF94"
                      fill="#00FF94"
                      fillOpacity={0.2}
                      name="Accuracy %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Leaderboard */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-[#FFD700]" />CATEGORY_LEADERBOARD
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#444]">#{i + 1}</span>
                        <div>
                          <div className="font-medium text-[#EDEDED] uppercase">{cat.category}</div>
                          <div className="text-xs text-[#888]">{cat.total} predictions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#00FF94]">{cat.accuracy}%</div>
                        <div className="text-xs text-[#888]">Brier: {cat.brier_score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#888]">No resolved predictions yet. Start tracking accuracy by resolving predictions.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Custom Dashboards Component
const CustomDashboards = ({ getHeaders, user, setShowAuth }) => {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [availableWidgets, setAvailableWidgets] = useState([]);

  const loadDashboards = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/dashboards`, { headers: getHeaders() });
      setDashboards(res.data.dashboards || []);
    } catch (e) {
      console.error("Error loading dashboards:", e);
    }
    setLoading(false);
  }, [getHeaders]);

  const loadWidgets = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/dashboards/widgets`);
      setAvailableWidgets(res.data.widgets || []);
    } catch (e) {
      console.error("Error loading widgets:", e);
    }
  }, []);

  useEffect(() => {
    if (user) loadDashboards();
    loadWidgets();
  }, [user, loadDashboards, loadWidgets]);

  const createDashboard = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!newDashboardName.trim()) return;
    
    try {
      const res = await axios.post(`${API}/dashboards`, {
        name: newDashboardName,
        config: {
          widgets: [
            { type: "risk_gauge" },
            { type: "predictions_list", category: "disaster", limit: 5 },
            { type: "disaster_feed", region: "global" }
          ]
        }
      }, { headers: getHeaders() });
      
      toast.success("Dashboard created!");
      setDashboards([...dashboards, res.data.dashboard]);
      setNewDashboardName("");
      setCreating(false);
    } catch (e) {
      toast.error("Failed to create dashboard");
    }
  };

  const loadDashboard = async (dashboardId) => {
    try {
      const res = await axios.get(`${API}/dashboards/${dashboardId}`, { headers: getHeaders() });
      setSelectedDashboard(res.data);
    } catch (e) {
      toast.error("Failed to load dashboard");
    }
  };

  const deleteDashboard = async (dashboardId) => {
    try {
      await axios.delete(`${API}/dashboards/${dashboardId}`, { headers: getHeaders() });
      setDashboards(dashboards.filter(d => d.id !== dashboardId));
      if (selectedDashboard?.id === dashboardId) setSelectedDashboard(null);
      toast.success("Dashboard deleted");
    } catch (e) {
      toast.error("Failed to delete dashboard");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Layers className="w-12 h-12 text-[#444] mx-auto mb-4" />
        <h3 className="text-lg text-[#888] mb-4">Login to create custom dashboards</h3>
        <Button onClick={() => setShowAuth(true)} className="btn-primary">
          <LogIn className="w-4 h-4 mr-2" />LOGIN
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="custom-dashboards">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#9D4EDD]" />MY_DASHBOARDS
        </h2>
        {!creating ? (
          <Button onClick={() => setCreating(true)} className="btn-primary">
            <Sparkles className="w-4 h-4 mr-2" />CREATE_NEW
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              placeholder="Dashboard name..."
              className="terminal-input w-48"
            />
            <Button onClick={createDashboard} className="bg-[#00FF94] text-black hover:bg-[#00FF94]/80">CREATE</Button>
            <Button onClick={() => setCreating(false)} variant="outline" className="border-[#333]">CANCEL</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dashboard List */}
        <div className="space-y-2">
          <h3 className="text-sm text-[#888] mb-2">YOUR DASHBOARDS ({dashboards.length})</h3>
          {dashboards.length > 0 ? (
            dashboards.map((dash) => (
              <Card
                key={dash.id}
                className={`terminal-card cursor-pointer transition-all ${selectedDashboard?.id === dash.id ? 'border-[#9D4EDD]' : 'hover:border-[#333]'}`}
                onClick={() => loadDashboard(dash.id)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#EDEDED]">{dash.name}</div>
                    <div className="text-xs text-[#888]">{dash.widgets?.length || 0} widgets</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); deleteDashboard(dash.id); }}
                    className="text-[#FF4444] hover:bg-[#FF4444]/20"
                  >
                    ×
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-[#888]">No dashboards yet. Create one!</div>
          )}
        </div>

        {/* Dashboard Preview */}
        <div className="md:col-span-2">
          {selectedDashboard ? (
            <Card className="terminal-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{selectedDashboard.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDashboard.widgets?.map((widget, i) => (
                    <div key={i} className="p-4 bg-[#0A0A0A] border border-[#1F1F1F] rounded">
                      <div className="text-xs text-[#9D4EDD] mb-2 uppercase">{widget.type?.replace("_", " ")}</div>
                      {widget.data ? (
                        <div className="text-sm text-[#888]">
                          {widget.type === "risk_gauge" && (
                            <div className="text-center">
                              <div className="text-3xl font-bold text-[#FFD700]">{widget.data?.global_risk_score || 52}%</div>
                              <div className="text-xs">Global Risk Score</div>
                            </div>
                          )}
                          {widget.type === "predictions_list" && (
                            <div className="space-y-1">
                              {widget.data?.slice(0, 3).map((p, j) => (
                                <div key={j} className="text-xs truncate">{p.title}</div>
                              ))}
                            </div>
                          )}
                          {widget.type === "disaster_feed" && (
                            <div className="space-y-1">
                              {widget.data?.earthquakes?.slice(0, 3).map((eq, j) => (
                                <div key={j} className="text-xs">M{eq.magnitude} - {eq.location?.slice(0, 30)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-[#666]">Widget configured</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-[#888]">
              Select a dashboard to view
            </div>
          )}
        </div>
      </div>

      {/* Available Widgets */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#888]" />AVAILABLE_WIDGETS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {availableWidgets.map((widget, i) => (
              <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-center">
                <div className="text-xs font-medium text-[#EDEDED]">{widget.name}</div>
                <div className="text-xs text-[#666] mt-1">{widget.description?.slice(0, 40)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Holographic 3D Visualization Component
const HolographicVisualization = ({ getHeaders }) => {
  const [holoData, setHoloData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("globe");

  useEffect(() => {
    loadHolographicData();
  }, []);

  const loadHolographicData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/visualization/holographic-dashboard`);
      setHoloData(res.data);
    } catch (e) {
      console.error("Error loading holographic data:", e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="holographic-view">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-[#00E5FF]" />3D_HOLOGRAPHIC_VISUALIZATION
        </h2>
        <div className="flex gap-2">
          {["globe", "probability", "timeline"].map(view => (
            <Button
              key={view}
              size="sm"
              variant={activeView === view ? "default" : "outline"}
              onClick={() => setActiveView(view)}
              className={activeView === view ? "bg-[#00E5FF] text-black" : "border-[#333]"}
            >
              {view.toUpperCase()}
            </Button>
          ))}
          <Button onClick={loadHolographicData} size="sm" variant="outline" className="border-[#333]">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#888]">Loading 3D visualization data...</div>
      ) : (
        <>
          {/* Live Metrics Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="terminal-card bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#FF4444]">{holoData?.live_metrics?.active_earthquakes_m5plus || 0}</div>
                <div className="text-xs text-[#888] mt-1">ACTIVE_M5+_QUAKES</div>
              </CardContent>
            </Card>
            <Card className="terminal-card bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#FFD700]">{holoData?.live_metrics?.global_risk_index || 0}%</div>
                <div className="text-xs text-[#888] mt-1">GLOBAL_RISK_INDEX</div>
              </CardContent>
            </Card>
            <Card className="terminal-card bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#00FF94]">{holoData?.live_metrics?.predictions_active || 0}</div>
                <div className="text-xs text-[#888] mt-1">ACTIVE_PREDICTIONS</div>
              </CardContent>
            </Card>
            <Card className="terminal-card bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#9D4EDD]">{holoData?.live_metrics?.astrology_matches || 0}</div>
                <div className="text-xs text-[#888] mt-1">ASTROLOGY_MATCHES</div>
              </CardContent>
            </Card>
          </div>

          {/* 3D Globe Simulation */}
          {activeView === "globe" && (
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00E5FF]" />GLOBAL_RISK_HEATMAP_3D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] bg-[#050505] rounded-lg border border-[#1F1F1F] relative overflow-hidden">
                  {/* Simulated 3D Globe with CSS */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#0A2540] via-[#1E3A5F] to-[#0A1628] relative animate-pulse" style={{boxShadow: "0 0 60px #00E5FF30, inset 0 0 60px #00E5FF20"}}>
                      {/* Hotspots */}
                      {holoData?.globe_visualization?.regions?.map((region, i) => (
                        <div
                          key={i}
                          className="absolute w-3 h-3 rounded-full animate-ping"
                          style={{
                            backgroundColor: region.risk_score > 60 ? "#FF4444" : region.risk_score > 40 ? "#FFD700" : "#00FF94",
                            top: `${30 + Math.random() * 40}%`,
                            left: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 text-xs text-[#888]">
                    HOLOGRAPHIC_SIMULATION • {holoData?.globe_visualization?.regions?.length || 0} RISK_ZONES
                  </div>
                </div>
                {/* Region Risk List */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                  {holoData?.globe_visualization?.regions?.slice(0, 8).map((region, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded">
                      <div className="text-xs text-[#888] uppercase">{region.region_id?.replace("_", " ")}</div>
                      <div className={`text-lg font-bold ${region.risk_score > 60 ? "text-[#FF4444]" : region.risk_score > 40 ? "text-[#FFD700]" : "text-[#00FF94]"}`}>
                        {region.risk_score}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Probability Distribution */}
          {activeView === "probability" && (
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">PROBABILITY_DISTRIBUTION_3D</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(holoData?.probability_chart?.distribution || {}).map(([range, count]) => ({range, count}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                      <XAxis dataKey="range" stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                      <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid #1F1F1F" }} />
                      <Bar dataKey="count" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Animation */}
          {activeView === "timeline" && (
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">FORECAST_TIMELINE_ANIMATION</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={holoData?.forecast_animation?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                      <XAxis dataKey="date" stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                      <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 10 }} domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid #1F1F1F" }} />
                      <Area type="monotone" dataKey="value" stroke="#FFD700" fill="#FFD700" fillOpacity={0.2} name="Risk Forecast" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-[#888] mt-2">
                  30-DAY_GLOBAL_RISK_FORECAST • CONFIDENCE_INTERVAL_SHOWN
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Enterprise Admin Component - Stripe-like Admin Panel
const EnterpriseAdmin = ({ getHeaders, user, setShowAuth }) => {
  const [adminData, setAdminData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  
  // Team Management State
  const [employees, setEmployees] = useState([]);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);
  
  // Document Management State
  const [documents, setDocuments] = useState([]);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", type: "report", content: "", tags: "" });
  const [shareDocId, setShareDocId] = useState(null);
  const [shareEmails, setShareEmails] = useState("");
  
  // Payment State
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  // Email State
  const [emailSettings, setEmailSettings] = useState(null);
  const [orgEmailSubject, setOrgEmailSubject] = useState("");
  const [orgEmailMessage, setOrgEmailMessage] = useState("");
  
  // Password Management State
  const [passwordPolicy, setPasswordPolicy] = useState({
    min_length: 8,
    require_uppercase: true,
    require_numbers: true,
    require_special: false,
    expiry_days: 90
  });
  const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
  const [tempPassword, setTempPassword] = useState("");
  
  // Organization State
  const [organizations, setOrganizations] = useState([]);
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const isOwner = user?.role === "owner" || user?.role === "super_admin" || user?.role === "admin";
  const isEnterpriseAdmin = user?.role === "enterprise_admin" || user?.role === "enterprise";
  const orgId = user?.organization_id || "default-org";

  useEffect(() => {
    if (user && (isOwner || isEnterpriseAdmin)) {
      loadAdminData();
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === "team") loadEmployees();
    if (activeSection === "documents") loadDocuments();
    if (activeSection === "payments") loadPayments();
    if (activeSection === "emails") loadEmailSettings();
    if (activeSection === "organizations" && isOwner) loadOrganizations();
  }, [activeSection]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, { headers: getHeaders() }),
        axios.get(`${API}/admin/analytics`, { headers: getHeaders() })
      ]);
      setAdminData(dashRes.data);
      setAnalytics(analyticsRes.data);
    } catch (e) {
      console.error("Error loading admin data:", e);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get(`${API}/admin/organization/${orgId}/employees`, { headers: getHeaders() });
      setEmployees(res.data.employees || []);
    } catch (e) {
      console.error("Error loading employees:", e);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await axios.get(`${API}/admin/documents`, { headers: getHeaders() });
      setDocuments(res.data.documents || res.data || []);
    } catch (e) {
      console.error("Error loading documents:", e);
      setDocuments([]);
    }
  };

  const loadPayments = async () => {
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/admin/payments/history`, { headers: getHeaders() }),
        axios.get(`${API}/admin/invoices`, { headers: getHeaders() })
      ]);
      setPayments(paymentsRes.data.payments || []);
      setInvoices(invoicesRes.data.invoices || []);
    } catch (e) {
      console.error("Error loading payments:", e);
    }
  };

  const loadEmailSettings = async () => {
    try {
      const res = await axios.get(`${API}/admin/email-settings`, { headers: getHeaders() });
      setEmailSettings(res.data);
    } catch (e) {
      console.error("Error loading email settings:", e);
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await axios.get(`${API}/admin/users`, { headers: getHeaders() });
      setOrganizations(res.data || []);
    } catch (e) {
      console.error("Error loading organizations:", e);
    }
  };

  // Employee Management
  const addEmployee = async () => {
    if (!newEmployeeEmail || employees.length >= 10) return;
    setAddingEmployee(true);
    try {
      await axios.post(`${API}/admin/organization/${orgId}/employees`, 
        { email: newEmployeeEmail }, 
        { headers: getHeaders() }
      );
      toast.success("Employee added successfully");
      setNewEmployeeEmail("");
      loadEmployees();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to add employee");
    }
    setAddingEmployee(false);
  };

  const removeEmployee = async (employeeId) => {
    try {
      await axios.delete(`${API}/admin/organization/${orgId}/employees/${employeeId}`, { headers: getHeaders() });
      toast.success("Employee removed");
      loadEmployees();
    } catch (e) {
      toast.error("Failed to remove employee");
    }
  };

  // Document Management
  const saveDocument = async () => {
    try {
      await axios.post(`${API}/admin/documents`, {
        title: newDoc.title,
        type: newDoc.type,
        content: { text: newDoc.content },
        tags: newDoc.tags.split(",").map(t => t.trim()).filter(Boolean)
      }, { headers: getHeaders() });
      toast.success("Document saved");
      setShowNewDocModal(false);
      setNewDoc({ title: "", type: "report", content: "", tags: "" });
      loadDocuments();
    } catch (e) {
      toast.error("Failed to save document");
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await axios.delete(`${API}/admin/documents/${docId}`, { headers: getHeaders() });
      toast.success("Document deleted");
      loadDocuments();
    } catch (e) {
      toast.error("Failed to delete document");
    }
  };

  const shareDocument = async (docId) => {
    try {
      const userIds = shareEmails.split(",").map(e => e.trim()).filter(Boolean);
      await axios.post(`${API}/admin/documents/${docId}/share`, { user_ids: userIds }, { headers: getHeaders() });
      toast.success("Document shared");
      setShareDocId(null);
      setShareEmails("");
    } catch (e) {
      toast.error("Failed to share document");
    }
  };

  // Password Management
  const resetUserPassword = async (userId) => {
    try {
      const res = await axios.post(`${API}/admin/users/${userId}/reset-password`, {}, { headers: getHeaders() });
      setTempPassword(res.data.temporary_password);
      setResetPasswordUserId(userId);
      toast.success("Password reset successful");
    } catch (e) {
      toast.error("Failed to reset password");
    }
  };

  const updatePasswordPolicy = async () => {
    try {
      await axios.post(`${API}/admin/organization/${orgId}/password-policy`, passwordPolicy, { headers: getHeaders() });
      toast.success("Password policy updated");
    } catch (e) {
      toast.error("Failed to update password policy");
    }
  };

  // Email Management
  const updateEmailSettings = async (key, value) => {
    try {
      const updatedSettings = { ...emailSettings, [key]: value };
      await axios.put(`${API}/admin/email-settings`, updatedSettings, { headers: getHeaders() });
      setEmailSettings(updatedSettings);
      toast.success("Settings updated");
    } catch (e) {
      toast.error("Failed to update settings");
    }
  };

  const sendOrgEmail = async () => {
    try {
      await axios.post(`${API}/admin/organization/${orgId}/send-email`, {
        subject: orgEmailSubject,
        message: orgEmailMessage
      }, { headers: getHeaders() });
      toast.success("Email sent to organization");
      setOrgEmailSubject("");
      setOrgEmailMessage("");
    } catch (e) {
      toast.error("Failed to send email");
    }
  };

  // Organization Management
  const createOrganization = async () => {
    try {
      await axios.post(`${API}/admin/organization/create`, { name: newOrgName }, { headers: getHeaders() });
      toast.success("Organization created");
      setShowNewOrgModal(false);
      setNewOrgName("");
      loadOrganizations();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create organization");
    }
  };

  // Admin Sidebar Menu Items
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home, color: "#00FF94" },
    { id: "team", label: "Team", icon: Users, color: "#00E5FF", badge: employees.length > 0 ? `${employees.length}/10` : null },
    { id: "documents", label: "Documents", icon: FolderOpen, color: "#FFD700" },
    { id: "security", label: "Security", icon: Shield, color: "#9D4EDD" },
    { id: "emails", label: "Emails", icon: Mail, color: "#FF6B6B" },
    { id: "payments", label: "Payments", icon: CreditCard, color: "#00FF94" },
    ...(isOwner ? [{ id: "organizations", label: "Organizations", icon: Building2, color: "#FFD700" }] : []),
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "#00E5FF" },
  ];

  if (!user) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-[#FFD700] mx-auto mb-4" />
        <h3 className="text-lg text-[#888] mb-4">Admin access required</h3>
        <Button onClick={() => setShowAuth(true)} className="btn-primary">
          <LogIn className="w-4 h-4 mr-2" />LOGIN
        </Button>
      </div>
    );
  }

  if (!isOwner && !isEnterpriseAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-[#FF4444] mx-auto mb-4" />
        <h3 className="text-lg text-[#888]">Insufficient permissions</h3>
        <p className="text-sm text-[#666] mt-2">Enterprise or Owner access required</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6" data-testid="admin-dashboard">
      {/* Sidebar Navigation - Stripe Style */}
      <div className="w-56 flex-shrink-0">
        <Card className="terminal-card sticky top-4">
          <CardContent className="p-2">
            <div className="p-3 border-b border-[#1F1F1F] mb-2">
              <div className="text-xs text-[#888] uppercase tracking-wide">Admin Panel</div>
              <div className="text-sm font-medium text-[#FFD700] mt-1">{user.role?.toUpperCase()}</div>
            </div>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all ${
                    activeSection === item.id 
                      ? "bg-[#1F1F1F] text-white" 
                      : "text-[#888] hover:text-white hover:bg-[#1A1A1A]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" style={{ color: activeSection === item.id ? item.color : undefined }} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{item.badge}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FFD700]" />
              {sidebarItems.find(i => i.id === activeSection)?.label || "Overview"}
            </h2>
            <p className="text-sm text-[#888] mt-1">
              {activeSection === "overview" && "Platform statistics and system health"}
              {activeSection === "team" && "Manage team members (max 10 for enterprise)"}
              {activeSection === "documents" && "Create, share, and manage documents"}
              {activeSection === "security" && "Password policies and user security"}
              {activeSection === "emails" && "Email notifications and organization communications"}
              {activeSection === "payments" && "Payment history and invoices"}
              {activeSection === "organizations" && "Manage platform organizations"}
              {activeSection === "analytics" && "Prediction and usage analytics"}
            </p>
          </div>
          <Badge className="bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30">
            <div className="w-2 h-2 rounded-full bg-[#00FF94] mr-2 animate-pulse" />
            LIVE
          </Badge>
        </div>

        {loading && activeSection === "overview" ? (
          <div className="text-center py-12 text-[#888]">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            Loading admin data...
          </div>
        ) : (
          <>
            {/* OVERVIEW SECTION */}
            {activeSection === "overview" && adminData && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Total Users", value: adminData.platform_stats?.total_users || 0, color: "#00FF94", icon: Users },
                    { label: "Forecasts", value: adminData.platform_stats?.total_forecasts || 0, color: "#00E5FF", icon: Brain },
                    { label: "Predictions", value: adminData.platform_stats?.total_predictions || 0, color: "#FFD700", icon: Target },
                    { label: "Deep Forecasts", value: adminData.platform_stats?.total_deep_forecasts || 0, color: "#9D4EDD", icon: Layers },
                    { label: "OSINT Articles", value: (adminData.platform_stats?.osint_articles_processed || 0).toLocaleString(), color: "#FF6B6B", icon: Globe },
                  ].map((stat, i) => (
                    <Card key={i} className="terminal-card hover:border-[#333] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                          <span className="text-[10px] text-[#888] uppercase">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* System Status */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#00FF94]" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Cron Jobs", active: adminData.system_status?.cron_jobs_active },
                        { label: "Email Alerts", active: adminData.system_status?.email_alerts_active },
                        { label: "LLM Integration", active: adminData.system_status?.llm_integration },
                        { label: "OSINT Pipeline", active: true },
                      ].map((status, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-[#0A0A0A] rounded">
                          <div className={`w-2.5 h-2.5 rounded-full ${status.active ? "bg-[#00FF94]" : "bg-[#FF4444]"}`} />
                          <span className="text-sm">{status.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Users by Plan */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#00E5FF]" />
                      Users by Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(adminData.users_by_plan || { free: 0, pro: 0, enterprise: 0 }).map(([plan, count]) => (
                        <div key={plan} className="p-4 bg-[#0A0A0A] rounded text-center">
                          <div className="text-2xl font-bold text-white">{count}</div>
                          <div className="text-xs text-[#888] uppercase mt-1">{plan}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TEAM SECTION */}
            {activeSection === "team" && (
              <div className="space-y-6">
                {/* Add Employee */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#00FF94]" />
                      Add Team Member
                    </CardTitle>
                    <CardDescription>Add employees to your organization (max 10)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter employee email..."
                        value={newEmployeeEmail}
                        onChange={(e) => setNewEmployeeEmail(e.target.value)}
                        className="terminal-input flex-1"
                        disabled={employees.length >= 10}
                      />
                      <Button 
                        onClick={addEmployee} 
                        disabled={!newEmployeeEmail || addingEmployee || employees.length >= 10}
                        className="btn-primary"
                      >
                        {addingEmployee ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                      </Button>
                    </div>
                    {employees.length >= 10 && (
                      <p className="text-xs text-[#FF6B6B] mt-2">Maximum team size reached (10 members)</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={(employees.length / 10) * 100} className="h-2 flex-1" />
                      <span className="text-xs text-[#888]">{employees.length}/10</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee List */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#00E5FF]" />
                      Team Members ({employees.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employees.length === 0 ? (
                      <div className="text-center py-8 text-[#888]">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No team members yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {employees.map((emp, i) => (
                          <div key={emp.id || i} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded hover:bg-[#1A1A1A] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center">
                                <User className="w-4 h-4 text-[#888]" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{emp.name || emp.email}</div>
                                <div className="text-xs text-[#888]">{emp.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{emp.role || "member"}</Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => resetUserPassword(emp.id)}
                                className="text-[#FFD700] hover:text-[#FFD700] hover:bg-[#FFD700]/10"
                              >
                                <Key className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => removeEmployee(emp.id)}
                                className="text-[#FF4444] hover:text-[#FF4444] hover:bg-[#FF4444]/10"
                              >
                                <UserMinus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Password Reset Modal */}
                {tempPassword && (
                  <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword("")}>
                    <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-[#FFD700]" />
                          Password Reset
                        </DialogTitle>
                        <DialogDescription>Share this temporary password with the user</DialogDescription>
                      </DialogHeader>
                      <div className="p-4 bg-[#1A1A1A] rounded border border-[#333]">
                        <div className="flex items-center justify-between">
                          <code className="text-lg text-[#00FF94]">{tempPassword}</code>
                          <Button size="sm" variant="ghost" onClick={() => {
                            navigator.clipboard.writeText(tempPassword);
                            toast.success("Copied to clipboard");
                          }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-[#888]">User will be prompted to change password on next login</p>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* DOCUMENTS SECTION */}
            {activeSection === "documents" && (
              <div className="space-y-6">
                {/* Create Document */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-[#FFD700]" />
                        Documents
                      </CardTitle>
                      <CardDescription>Create and manage documents, reports, and analyses</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewDocModal(true)} className="btn-primary">
                      <Plus className="w-4 h-4 mr-1" />New Document
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <div className="text-center py-8 text-[#888]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No documents yet</p>
                        <Button size="sm" variant="ghost" onClick={() => setShowNewDocModal(true)} className="mt-2">
                          Create your first document
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded hover:bg-[#1A1A1A] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-[#1F1F1F] flex items-center justify-center">
                                <FileText className="w-5 h-5 text-[#FFD700]" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{doc.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5">{doc.type}</Badge>
                                  {doc.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] text-[#888]">#{tag}</span>
                                  ))}
                                  <span className="text-[10px] text-[#666]">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {new Date(doc.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setShareDocId(doc.id)}>
                                <Share2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => {
                                const blob = new Blob([JSON.stringify(doc.content, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${doc.title}.json`;
                                a.click();
                              }}>
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)} className="text-[#FF4444] hover:text-[#FF4444]">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* New Document Modal */}
                <Dialog open={showNewDocModal} onOpenChange={setShowNewDocModal}>
                  <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F] max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FFD700]" />
                        New Document
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Document title..."
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                        className="terminal-input"
                      />
                      <div className="flex gap-2">
                        {["report", "forecast", "analysis"].map(type => (
                          <Button
                            key={type}
                            size="sm"
                            variant={newDoc.type === type ? "default" : "outline"}
                            onClick={() => setNewDoc({...newDoc, type})}
                            className={newDoc.type === type ? "bg-[#FFD700] text-black" : ""}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Document content..."
                        value={newDoc.content}
                        onChange={(e) => setNewDoc({...newDoc, content: e.target.value})}
                        className="w-full h-32 bg-[#0A0A0A] border border-[#1F1F1F] rounded p-3 text-sm resize-none focus:outline-none focus:border-[#FFD700]"
                      />
                      <Input
                        placeholder="Tags (comma separated)..."
                        value={newDoc.tags}
                        onChange={(e) => setNewDoc({...newDoc, tags: e.target.value})}
                        className="terminal-input"
                      />
                      <Button onClick={saveDocument} disabled={!newDoc.title} className="btn-primary w-full">
                        <Check className="w-4 h-4 mr-2" />Save Document
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Share Document Modal */}
                <Dialog open={!!shareDocId} onOpenChange={() => setShareDocId(null)}>
                  <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-[#00E5FF]" />
                        Share Document
                      </DialogTitle>
                      <DialogDescription>Enter user IDs to share with (comma separated)</DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="user-id-1, user-id-2..."
                      value={shareEmails}
                      onChange={(e) => setShareEmails(e.target.value)}
                      className="terminal-input"
                    />
                    <Button onClick={() => shareDocument(shareDocId)} className="btn-primary">
                      <Share2 className="w-4 h-4 mr-2" />Share
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* SECURITY SECTION */}
            {activeSection === "security" && (
              <div className="space-y-6">
                {/* Password Policy */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#9D4EDD]" />
                      Password Policy
                    </CardTitle>
                    <CardDescription>Configure password requirements for your organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                        <div>
                          <div className="text-sm">Minimum Length</div>
                          <div className="text-xs text-[#888]">Required password length</div>
                        </div>
                        <Input
                          type="number"
                          min="6"
                          max="32"
                          value={passwordPolicy.min_length}
                          onChange={(e) => setPasswordPolicy({...passwordPolicy, min_length: parseInt(e.target.value)})}
                          className="terminal-input w-20 text-center"
                        />
                      </div>
                      {[
                        { key: "require_uppercase", label: "Require Uppercase", desc: "At least one uppercase letter" },
                        { key: "require_numbers", label: "Require Numbers", desc: "At least one number" },
                        { key: "require_special", label: "Require Special Characters", desc: "At least one special character" },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                          <div>
                            <div className="text-sm">{item.label}</div>
                            <div className="text-xs text-[#888]">{item.desc}</div>
                          </div>
                          <Button
                            size="sm"
                            variant={passwordPolicy[item.key] ? "default" : "outline"}
                            onClick={() => setPasswordPolicy({...passwordPolicy, [item.key]: !passwordPolicy[item.key]})}
                            className={passwordPolicy[item.key] ? "bg-[#00FF94] text-black hover:bg-[#00FF94]/80" : ""}
                          >
                            {passwordPolicy[item.key] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                        <div>
                          <div className="text-sm">Password Expiry</div>
                          <div className="text-xs text-[#888]">Days until password must be changed</div>
                        </div>
                        <Input
                          type="number"
                          min="30"
                          max="365"
                          value={passwordPolicy.expiry_days}
                          onChange={(e) => setPasswordPolicy({...passwordPolicy, expiry_days: parseInt(e.target.value)})}
                          className="terminal-input w-20 text-center"
                        />
                      </div>
                      <Button onClick={updatePasswordPolicy} className="btn-primary w-full">
                        <Check className="w-4 h-4 mr-2" />Save Password Policy
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#FFD700]" />
                      Security Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Shield className="w-5 h-5" />
                        <span className="text-xs">Force Password Reset</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Lock className="w-5 h-5" />
                        <span className="text-xs">Enable 2FA (Coming Soon)</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* EMAILS SECTION */}
            {activeSection === "emails" && (
              <div className="space-y-6">
                {/* Email Settings */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#FF6B6B]" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>Configure which email notifications you receive</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {emailSettings ? (
                      <div className="space-y-3">
                        {[
                          { key: "forecast_alerts", label: "Forecast Alerts", desc: "Get notified when forecasts are ready" },
                          { key: "disaster_alerts", label: "Disaster Alerts", desc: "Urgent notifications for disaster predictions" },
                          { key: "weekly_digest", label: "Weekly Digest", desc: "Summary of platform activity" },
                          { key: "reconciliation_matches", label: "Reconciliation Matches", desc: "When predictions match real-world events" },
                          { key: "marketing", label: "Marketing Emails", desc: "Product updates and news" },
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                            <div>
                              <div className="text-sm">{item.label}</div>
                              <div className="text-xs text-[#888]">{item.desc}</div>
                            </div>
                            <Button
                              size="sm"
                              variant={emailSettings[item.key] ? "default" : "outline"}
                              onClick={() => updateEmailSettings(item.key, !emailSettings[item.key])}
                              className={emailSettings[item.key] ? "bg-[#00FF94] text-black hover:bg-[#00FF94]/80" : ""}
                            >
                              {emailSettings[item.key] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#888]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading settings...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Send Organization Email */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#00E5FF]" />
                      Send Organization Email
                    </CardTitle>
                    <CardDescription>Broadcast a message to all organization members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Email subject..."
                        value={orgEmailSubject}
                        onChange={(e) => setOrgEmailSubject(e.target.value)}
                        className="terminal-input"
                      />
                      <textarea
                        placeholder="Email message..."
                        value={orgEmailMessage}
                        onChange={(e) => setOrgEmailMessage(e.target.value)}
                        className="w-full h-32 bg-[#0A0A0A] border border-[#1F1F1F] rounded p-3 text-sm resize-none focus:outline-none focus:border-[#00E5FF]"
                      />
                      <Button 
                        onClick={sendOrgEmail} 
                        disabled={!orgEmailSubject || !orgEmailMessage}
                        className="btn-primary"
                      >
                        <Send className="w-4 h-4 mr-2" />Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PAYMENTS SECTION */}
            {activeSection === "payments" && (
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="terminal-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Receipt className="w-4 h-4 text-[#00FF94]" />
                        <span className="text-[10px] text-[#888]">TOTAL SPENT</span>
                      </div>
                      <div className="text-2xl font-bold text-[#00FF94]">
                        ${payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="terminal-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <CreditCard className="w-4 h-4 text-[#00E5FF]" />
                        <span className="text-[10px] text-[#888]">TRANSACTIONS</span>
                      </div>
                      <div className="text-2xl font-bold text-[#00E5FF]">{payments.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="terminal-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <FileText className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-[10px] text-[#888]">INVOICES</span>
                      </div>
                      <div className="text-2xl font-bold text-[#FFD700]">{invoices.length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment History */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#00FF94]" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {payments.length === 0 ? (
                      <div className="text-center py-8 text-[#888]">
                        <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No payments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((payment, i) => (
                          <div key={payment.id || i} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                payment.status === "succeeded" ? "bg-[#00FF94]/20" : "bg-[#FFD700]/20"
                              }`}>
                                {payment.status === "succeeded" ? (
                                  <Check className="w-4 h-4 text-[#00FF94]" />
                                ) : (
                                  <Clock className="w-4 h-4 text-[#FFD700]" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm">{payment.description || "Payment"}</div>
                                <div className="text-xs text-[#888]">{new Date(payment.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-[#00FF94]">${payment.amount?.toFixed(2)}</div>
                              <div className="text-[10px] text-[#888] uppercase">{payment.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Invoices */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FFD700]" />
                      Invoices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invoices.length === 0 ? (
                      <div className="text-center py-8 text-[#888]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No invoices yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {invoices.map((invoice, i) => (
                          <div key={invoice.id || i} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                            <div>
                              <div className="text-sm">{invoice.number || `INV-${i + 1}`}</div>
                              <div className="text-xs text-[#888]">{new Date(invoice.date).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#00FF94]">${invoice.amount?.toFixed(2)}</span>
                              <Button size="sm" variant="ghost">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ORGANIZATIONS SECTION (Owner Only) */}
            {activeSection === "organizations" && isOwner && (
              <div className="space-y-6">
                {/* Create Organization */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#FFD700]" />
                        Organizations
                      </CardTitle>
                      <CardDescription>Manage enterprise organizations on the platform</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewOrgModal(true)} className="btn-primary">
                      <Plus className="w-4 h-4 mr-1" />New Organization
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {organizations.length === 0 ? (
                      <div className="text-center py-8 text-[#888]">
                        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No organizations yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {organizations.filter(u => u.organization_id).map((org, i) => (
                          <div key={org.id || i} className="p-4 bg-[#0A0A0A] rounded hover:bg-[#1A1A1A] transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded bg-[#FFD700]/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#FFD700]" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{org.name || "Organization"}</div>
                                <div className="text-xs text-[#888]">{org.organization_id}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#888]">
                              <span>Role: {org.role}</span>
                              <span>Plan: {org.plan}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* New Organization Modal */}
                <Dialog open={showNewOrgModal} onOpenChange={setShowNewOrgModal}>
                  <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#FFD700]" />
                        Create Organization
                      </DialogTitle>
                      <DialogDescription>Create a new enterprise organization</DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="Organization name..."
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="terminal-input"
                    />
                    <Button onClick={createOrganization} disabled={!newOrgName} className="btn-primary">
                      <Check className="w-4 h-4 mr-2" />Create Organization
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* ANALYTICS SECTION */}
            {activeSection === "analytics" && analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* By Category */}
                  <Card className="terminal-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
                        Predictions by Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.predictions_by_category || {}).map(([cat, count]) => (
                          <div key={cat} className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="uppercase">{cat}</span>
                                <span className="text-[#00FF94]">{count}</span>
                              </div>
                              <Progress value={Math.min((count / 50) * 100, 100)} className="h-1.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reconciliation */}
                  <Card className="terminal-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#00FF94]" />
                        Reconciliation Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-5xl font-bold text-[#00FF94]">
                          {analytics.reconciliation?.success_rate || 0}%
                        </div>
                        <div className="text-sm text-[#888] mt-2">Success Rate</div>
                        <div className="flex justify-center gap-8 mt-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-[#00E5FF]">{analytics.reconciliation?.reconciled || 0}</div>
                            <div className="text-xs text-[#888]">Matched</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-[#FFD700]">{analytics.reconciliation?.total || 0}</div>
                            <div className="text-xs text-[#888]">Total</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* OSINT Sources */}
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#9D4EDD]" />
                      OSINT Data Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-[#00E5FF]">1M+</div>
                      <div className="text-sm text-[#888]">Sources Configured</div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {["GDELT", "USGS", "NOAA", "GDACS", "SEC EDGAR", "arXiv"].map(source => (
                        <div key={source} className="p-2 bg-[#0A0A0A] rounded text-center">
                          <div className="text-xs text-[#00FF94]">✓ {source}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Auth Modal
const AuthModal = ({ isOpen, onClose, login, register }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = isLogin ? await login(email, password) : await register(name, email, password);
    setLoading(false);
    if (success) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F] max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-lg">{isLogin ? "LOGIN" : "REGISTER"}</DialogTitle>
          <DialogDescription className="text-[#888]">
            {isLogin ? "Access your Plutus Predict account" : "Create a new account"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {!isLogin && (
            <Input
              data-testid="auth-name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="terminal-input"
            />
          )}
          <Input
            data-testid="auth-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="terminal-input"
          />
          <Input
            data-testid="auth-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="terminal-input"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button onClick={handleSubmit} disabled={loading} className="btn-primary w-full" data-testid="auth-submit-btn">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLogin ? "LOGIN" : "REGISTER"}
          </Button>
          <div className="text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-[#00E5FF] hover:underline">
              {isLogin ? "Need an account? Register" : "Already have an account? Login"}
            </button>
          </div>
          <div className="text-center text-xs text-[#888]">
            Demo: admin@plutuspredict.com / admin123
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main App Component
const MainApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAuth, setShowAuth] = useState(false);
  const { user, token, login, register, logout, getHeaders, setUser } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();

  // Check auth on load
  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
        });
    }
  }, [token, setUser]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard getHeaders={getHeaders} />;
      case "forecast":
        return <AIForecast getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "deep-forecast":
        return <DeepForecast getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "investment":
        return <InvestmentBankerSuite />;
      case "disasters":
        return <Disasters getHeaders={getHeaders} />;
      case "astrology":
        return <Astrology getHeaders={getHeaders} user={user} />;
      case "tabular":
        return <TabularPredictions />;
      case "holographic":
        return <HolographicVisualization getHeaders={getHeaders} />;
      case "accuracy":
        return <AccuracyDashboard getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "compare":
        return <CompetitorComparison />;
      case "my-dashboards":
        return <CustomDashboards getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "admin":
        return <EnterpriseAdmin getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "osint":
        return <OSINTSearch />;
      case "chat":
        return <Chat getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      default:
        return <Dashboard getHeaders={getHeaders} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Toaster position="top-right" theme="dark" />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        setShowAuth={setShowAuth}
        logout={logout}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        login={login}
        register={register}
      />

      {/* Footer */}
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
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
