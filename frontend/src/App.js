import { useState, useEffect, useCallback } from "react";
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
const Navigation = ({ activeTab, setActiveTab, user, setShowAuth, logout }) => {
  const tabs = [
    { id: "dashboard", label: "DASHBOARD", icon: Home },
    { id: "forecast", label: "AI_FORECAST", icon: Brain },
    { id: "disasters-astrology", label: "DISASTERS_&_ASTROLOGY", icon: AlertTriangle },
    { id: "osint", label: "OSINT", icon: Search },
    { id: "backtest", label: "BACKTEST", icon: BarChart3 },
    { id: "grid", label: "RISK_GRID", icon: Globe },
    { id: "chat", label: "CHAT", icon: MessageSquare },
  ];

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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-testid={`nav-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item flex items-center gap-2 ${activeTab === tab.id ? "active" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
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

  return (
    <div className="space-y-6" data-testid="forecast-view">
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00E5FF]" />
            AI_POWERED_FORECASTING_ENGINE
          </CardTitle>
          <CardDescription className="text-[#888]">
            Uses 3-LLM ensemble (GPT-4, Claude, Gemini) with Bayesian aggregation and 1M+ OSINT sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
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

          {forecast && (
            <div className="bg-[#0A0A0A] border border-[#00E5FF]/30 p-6 glow-primary" data-testid="forecast-result">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Combined Disasters & Astrology Component (Side-by-Side)
const DisastersAndAstrology = ({ getHeaders, user }) => {
  const [earthquakes, setEarthquakes] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [disasterSummary, setDisasterSummary] = useState(null);
  const [channels, setChannels] = useState({});
  const [videos, setVideos] = useState([]);
  const [storedPredictions, setStoredPredictions] = useState([]);
  const [reconciled, setReconciled] = useState([]);
  const [query, setQuery] = useState("earthquake prediction 2025");
  const [loading, setLoading] = useState(true);
  const [fetchingDaily, setFetchingDaily] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eqRes, wxRes, gdRes, summaryRes, channelsRes, storedRes, reconciledRes] = await Promise.all([
        axios.get(`${API}/disasters/earthquakes?min_magnitude=4.0&limit=15`),
        axios.get(`${API}/disasters/weather-alerts`),
        axios.get(`${API}/disasters/global`),
        axios.get(`${API}/disasters/summary`),
        axios.get(`${API}/astrology/channels`),
        axios.get(`${API}/astrology/stored?limit=10`),
        axios.get(`${API}/astrology/reconciled?limit=10`),
      ]);
      setEarthquakes(eqRes.data.earthquakes || []);
      setWeatherAlerts(wxRes.data.alerts || []);
      setGlobalDisasters(gdRes.data.disasters || []);
      setDisasterSummary(summaryRes.data);
      setChannels(channelsRes.data.channels || {});
      setStoredPredictions(storedRes.data.predictions || []);
      setReconciled(reconciledRes.data.predictions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchAstrology = async () => {
    try {
      const res = await axios.get(`${API}/astrology/search?query=${encodeURIComponent(query)}`);
      setVideos(res.data.videos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const runDailyFetch = async () => {
    if (!user) {
      toast.error("Please login to run daily fetch");
      return;
    }
    setFetchingDaily(true);
    try {
      const res = await axios.post(`${API}/astrology/daily-fetch`, {}, { headers: getHeaders() });
      toast.success(`Fetched ${res.data.predictions_found} predictions from ${res.data.videos_processed} videos`);
      loadData();
    } catch (e) {
      toast.error("Daily fetch failed");
    }
    setFetchingDaily(false);
  };

  const runReconciliation = async () => {
    if (!user) {
      toast.error("Please login to reconcile");
      return;
    }
    setReconciling(true);
    try {
      const res = await axios.post(`${API}/astrology/reconcile`, {}, { headers: getHeaders() });
      toast.success(`Found ${res.data.matches_found} matches from ${res.data.predictions_checked} predictions`);
      loadData();
    } catch (e) {
      toast.error("Reconciliation failed");
    }
    setReconciling(false);
  };

  return (
    <div className="space-y-6" data-testid="disasters-astrology-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#FF3333]" />
          DISASTERS
          <span className="text-[#888] mx-2">&</span>
          <Moon className="w-5 h-5 text-[#9D4EDD]" />
          ASTROLOGY_PREDICTIONS
        </h2>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm" className="btn-secondary" data-testid="refresh-all-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            REFRESH
          </Button>
        </div>
      </div>

      {/* Risk Summary */}
      {disasterSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="terminal-card border-l-2 border-l-[#FF3333]">
            <CardContent className="p-3 text-center">
              <div className="font-mono text-2xl font-bold text-[#FF3333]">{disasterSummary.earthquake_risk?.probability || 0}%</div>
              <div className="text-xs text-[#888]">EARTHQUAKE RISK</div>
            </CardContent>
          </Card>
          <Card className="terminal-card border-l-2 border-l-[#FFAA00]">
            <CardContent className="p-3 text-center">
              <div className="font-mono text-2xl font-bold text-[#FFAA00]">{disasterSummary.weather_risk?.probability || 0}%</div>
              <div className="text-xs text-[#888]">WEATHER RISK</div>
            </CardContent>
          </Card>
          <Card className="terminal-card border-l-2 border-l-[#00E5FF]">
            <CardContent className="p-3 text-center">
              <div className="font-mono text-2xl font-bold text-[#00E5FF]">{disasterSummary.global_risk_score || 0}%</div>
              <div className="text-xs text-[#888]">GLOBAL RISK</div>
            </CardContent>
          </Card>
          <Card className="terminal-card border-l-2 border-l-[#9D4EDD]">
            <CardContent className="p-3 text-center">
              <div className="font-mono text-2xl font-bold text-[#9D4EDD]">{storedPredictions.length}</div>
              <div className="text-xs text-[#888]">STORED PREDICTIONS</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Side-by-Side Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* LEFT: Disasters */}
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF3333]" />
                LIVE_EARTHQUAKES_USGS
                <Badge variant="outline" className="ml-2 text-xs border-[#FF3333]/30 text-[#FF3333]">
                  <span className="w-2 h-2 bg-[#FF3333] rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {earthquakes.map((eq, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] border-l-2 border-l-[#FF3333]">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-[#FF3333]">M{eq.magnitude}</span>
                        <span className="text-xs text-[#888]">{new Date(eq.time).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#EDEDED] mt-1">{eq.location}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#FFAA00]" />
                WEATHER_ALERTS_NOAA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {weatherAlerts.slice(0, 8).map((alert, i) => (
                    <div key={i} className={`p-2 bg-[#0A0A0A] border border-[#1F1F1F] border-l-2 ${alert.severity === "Extreme" ? "border-l-[#FF3333]" : "border-l-[#FFAA00]"}`}>
                      <div className="font-medium text-xs">{alert.event}</div>
                      <div className="text-xs text-[#888] truncate">{alert.areas}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Astrology */}
        <div className="space-y-4">
          <Card className="terminal-card astrology-accent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="w-4 h-4 text-[#9D4EDD]" />
                  VEDIC_ASTROLOGY_PREDICTIONS
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={runDailyFetch} disabled={fetchingDaily} size="sm" className="bg-[#9D4EDD] hover:bg-[#9D4EDD]/80 text-white text-xs" data-testid="daily-fetch-btn">
                    {fetchingDaily ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    <span className="ml-1">FETCH</span>
                  </Button>
                  <Button onClick={runReconciliation} disabled={reconciling} size="sm" variant="outline" className="text-xs border-[#9D4EDD] text-[#9D4EDD]" data-testid="reconcile-btn">
                    {reconciling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
                    <span className="ml-1">RECONCILE</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex gap-2 mb-3">
                <Input
                  data-testid="astrology-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search predictions..."
                  className="terminal-input flex-1 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && searchAstrology()}
                />
                <Button onClick={searchAstrology} size="sm" className="bg-[#9D4EDD] hover:bg-[#9D4EDD]/80">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Channels */}
              <div className="mb-3">
                <div className="text-xs text-[#888] uppercase mb-2">TRACKED CHANNELS</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(channels).map(([key, ch]) => (
                    <Badge key={key} className="astrology-badge text-xs">{ch.name.split(" ")[0]}</Badge>
                  ))}
                </div>
              </div>

              {/* Stored Predictions */}
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {storedPredictions.length > 0 ? storedPredictions.map((pred, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] border border-[#9D4EDD]/30 hover:border-[#9D4EDD]">
                      <div className="font-medium text-xs text-[#EDEDED] line-clamp-2">{pred.title}</div>
                      <div className="text-xs text-[#888] mt-1">{pred.channel}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pred.predictions?.slice(0, 2).map((p, j) => (
                          <Badge key={j} variant="outline" className="text-xs border-[#9D4EDD]/30 text-[#9D4EDD]">{p.category}</Badge>
                        ))}
                      </div>
                      {pred.reconciled && (
                        <Badge className="mt-1 bg-[#00FF94]/20 text-[#00FF94] text-xs">RECONCILED</Badge>
                      )}
                    </div>
                  )) : videos.map((v, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#9D4EDD]">
                      <div className="font-medium text-xs text-[#EDEDED] line-clamp-2">{v.title}</div>
                      <div className="text-xs text-[#888] mt-1">{v.channel}</div>
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9D4EDD] mt-1 flex items-center gap-1">
                        <Play className="w-3 h-3" /> Watch
                      </a>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Reconciled Predictions */}
          {reconciled.length > 0 && (
            <Card className="terminal-card border-[#00FF94]/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00FF94]" />
                  RECONCILED_WITH_ACTUAL_EVENTS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {reconciled.map((pred, i) => (
                      <div key={i} className="p-2 bg-[#0A0A0A] border border-[#00FF94]/30">
                        <div className="text-xs text-[#EDEDED]">{pred.title}</div>
                        <div className="text-xs text-[#00FF94] mt-1">
                          Matched: {pred.reconciliation_result?.matches?.length || 0} events
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Global Disasters */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00E5FF]" />
            GLOBAL_DISASTERS_GDACS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
            {globalDisasters.slice(0, 8).map((d, i) => (
              <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#00E5FF]">
                <div className="font-medium text-xs text-[#EDEDED] line-clamp-2">{d.title}</div>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00E5FF] mt-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Details
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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

// Chat Component
const Chat = ({ getHeaders, user, setShowAuth }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get(`${API}/chat/history`, { headers: getHeaders() })
        .then((res) => setMessages(res.data.history || []))
        .catch(console.error);
    }
  }, [user, getHeaders]);

  const sendMessage = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages([...messages, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/chat`, { message: input }, { headers: getHeaders() });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response, timestamp: res.data.timestamp }]);
    } catch (e) {
      toast.error("Failed to send message");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="chat-view">
      <Card className="terminal-card h-[600px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00E5FF]" />
            PLUTUS_AI_CHAT
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 ${msg.role === "user" ? "bg-[#00E5FF]/20 border border-[#00E5FF]/30" : "bg-[#0A0A0A] border border-[#1F1F1F]"}`}>
                    <p className="text-sm text-[#EDEDED]">{msg.content}</p>
                    <span className="text-xs text-[#444] mt-1 block">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#00E5FF] rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about forecasts, disasters, risk analysis..."
              className="terminal-input flex-1"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={loading} className="btn-primary" data-testid="chat-send-btn">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
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
      case "disasters-astrology":
        return <DisastersAndAstrology getHeaders={getHeaders} user={user} />;
      case "osint":
        return <OSINTSearch />;
      case "backtest":
        return <Backtest getHeaders={getHeaders} />;
      case "grid":
        return <RiskGrid />;
      case "chat":
        return <Chat getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      default:
        return <Dashboard getHeaders={getHeaders} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <Toaster position="top-right" theme="dark" />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        setShowAuth={setShowAuth}
        logout={logout}
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
