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
  FileText,
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
    { id: "deep-forecast", label: "DEEP_FORECAST", icon: Sparkles },
    { id: "disasters", label: "DISASTERS", icon: AlertTriangle },
    { id: "astrology", label: "ASTROLOGY", icon: Moon },
    { id: "tabular", label: "TABULAR", icon: BarChart3 },
    { id: "holographic", label: "3D_VISUAL", icon: Globe },
    { id: "accuracy", label: "ACCURACY", icon: Target },
    { id: "my-dashboards", label: "MY_DASHBOARDS", icon: Layers },
    { id: "admin", label: "ADMIN", icon: Shield, adminOnly: true },
    { id: "osint", label: "OSINT", icon: Search },
    { id: "chat", label: "CHAT", icon: MessageSquare },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || (user?.role === "admin" || user?.role === "enterprise"));


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

// Disasters Component (Independent)
const Disasters = ({ getHeaders }) => {
  const [earthquakes, setEarthquakes] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [disasterSummary, setDisasterSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eqRes, wxRes, gdRes, summaryRes] = await Promise.all([
        axios.get(`${API}/disasters/earthquakes?min_magnitude=4.0&limit=20`),
        axios.get(`${API}/disasters/weather-alerts`),
        axios.get(`${API}/disasters/global`),
        axios.get(`${API}/disasters/summary`),
      ]);
      setEarthquakes(eqRes.data.earthquakes || []);
      setWeatherAlerts(wxRes.data.alerts || []);
      setGlobalDisasters(gdRes.data.disasters || []);
      setDisasterSummary(summaryRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6" data-testid="disasters-view">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#FF3333]" />
          AI_DISASTER_MONITORING
        </h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-[#FF3333]/30 text-[#FF3333]">
            <span className="w-2 h-2 bg-[#FF3333] rounded-full mr-1 animate-pulse" />LIVE
          </Badge>
          <Button onClick={loadData} variant="outline" size="sm" className="btn-secondary" data-testid="refresh-disasters-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />REFRESH
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
              <Activity className="w-4 h-4 text-[#FF3333]" />LIVE_EARTHQUAKES_USGS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {earthquakes.map((eq, i) => (
                  <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] border-l-2 border-l-[#FF3333] hover:border-[#FF3333]">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-[#FF3333]">M{eq.magnitude}</span>
                      <span className="text-xs text-[#888]">{new Date(eq.time).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[#EDEDED] mt-1">{eq.location}</p>
                    <div className="text-xs text-[#444] mt-1">Depth: {eq.depth_km}km</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="terminal-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#FFAA00]" />WEATHER_ALERTS_NOAA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {weatherAlerts.map((alert, i) => (
                  <div key={i} className={`p-2 bg-[#0A0A0A] border border-[#1F1F1F] border-l-2 ${alert.severity === "Extreme" ? "border-l-[#FF3333]" : "border-l-[#FFAA00]"}`}>
                    <div className="font-medium text-xs">{alert.event}</div>
                    <div className="text-xs text-[#888] mt-1 truncate">{alert.areas}</div>
                    <Badge className={`mt-1 text-xs ${alert.severity === "Extreme" ? "risk-critical" : "risk-elevated"}`}>{alert.severity}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00E5FF]" />GLOBAL_DISASTERS_GDACS
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

      <div className="text-xs text-[#444] text-center">
        Data reconciled with Astrology predictions for accuracy enhancement. View ASTROLOGY tab for predictions.
      </div>
    </div>
  );
};

// Astrology Component (Independent - for reconciliation)
const Astrology = ({ getHeaders, user }) => {
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
      const [channelsRes, storedRes, reconciledRes] = await Promise.all([
        axios.get(`${API}/astrology/channels`),
        axios.get(`${API}/astrology/stored?limit=20`),
        axios.get(`${API}/astrology/reconciled?limit=20`),
      ]);
      setChannels(channelsRes.data.channels || {});
      setStoredPredictions(storedRes.data.predictions || []);
      setReconciled(reconciledRes.data.predictions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); searchAstrology(); }, [loadData]);

  const searchAstrology = async () => {
    try {
      const res = await axios.get(`${API}/astrology/search?query=${encodeURIComponent(query)}`);
      setVideos(res.data.videos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const runDailyFetch = async () => {
    if (!user) { toast.error("Please login"); return; }
    setFetchingDaily(true);
    try {
      const res = await axios.post(`${API}/astrology/daily-fetch`, {}, { headers: getHeaders() });
      toast.success(`Fetched ${res.data.predictions_found} predictions`);
      loadData();
    } catch (e) { toast.error("Fetch failed"); }
    setFetchingDaily(false);
  };

  const importTranscripts = async () => {
    if (!user) { toast.error("Please login"); return; }
    setFetchingDaily(true);
    toast.info("Importing transcripts from all channels... This may take a minute.");
    try {
      const res = await axios.post(`${API}/astrology/import-transcripts?videos_per_channel=8`, {}, { headers: getHeaders() });
      toast.success(`Imported ${res.data.transcripts_fetched} transcripts, found ${res.data.predictions_extracted} predictions`);
      loadData();
    } catch (e) { toast.error("Import failed"); }
    setFetchingDaily(false);
  };

  const runReconciliation = async () => {
    if (!user) { toast.error("Please login"); return; }
    setReconciling(true);
    try {
      const res = await axios.post(`${API}/astrology/reconcile`, {}, { headers: getHeaders() });
      toast.success(`Found ${res.data.matches_found} matches with actual disasters`);
      loadData();
    } catch (e) { toast.error("Reconciliation failed"); }
    setReconciling(false);
  };

  return (
    <div className="space-y-6" data-testid="astrology-view">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Moon className="w-5 h-5 text-[#9D4EDD]" />
          VEDIC_ASTROLOGY_PREDICTIONS
        </h2>
        <div className="flex gap-2">
          <Button onClick={importTranscripts} disabled={fetchingDaily} size="sm" className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-black text-xs" data-testid="import-transcripts-btn">
            {fetchingDaily ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <FileText className="w-3 h-3 mr-1" />}IMPORT_TRANSCRIPTS
          </Button>
          <Button onClick={runReconciliation} disabled={reconciling} size="sm" variant="outline" className="text-xs border-[#00FF94] text-[#00FF94]" data-testid="reconcile-btn">
            {reconciling ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}RECONCILE_WITH_AI
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="terminal-card border-l-2 border-l-[#9D4EDD]">
          <CardContent className="p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[#9D4EDD]">{Object.keys(channels).length}</div>
            <div className="text-xs text-[#888]">TRACKED CHANNELS</div>
          </CardContent>
        </Card>
        <Card className="terminal-card border-l-2 border-l-[#FFD700]">
          <CardContent className="p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[#FFD700]">{storedPredictions.length}</div>
            <div className="text-xs text-[#888]">STORED PREDICTIONS</div>
          </CardContent>
        </Card>
        <Card className="terminal-card border-l-2 border-l-[#00FF94]">
          <CardContent className="p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[#00FF94]">{reconciled.length}</div>
            <div className="text-xs text-[#888]">RECONCILED</div>
          </CardContent>
        </Card>
        <Card className="terminal-card border-l-2 border-l-[#00E5FF]">
          <CardContent className="p-3 text-center">
            <div className="font-mono text-2xl font-bold text-[#00E5FF]">{videos.length}</div>
            <div className="text-xs text-[#888]">SEARCH RESULTS</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Channels & Search */}
        <Card className="terminal-card astrology-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-[#9D4EDD]" />VEDIC_ASTROLOGY_CHANNELS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(channels).map(([key, ch]) => (
                <div key={key} className="p-2 bg-[#0A0A0A] border border-[#9D4EDD]/30 hover:border-[#9D4EDD]">
                  <div className="font-medium text-xs text-[#EDEDED]">{ch.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ch.specialty?.slice(0, 2).map((s, i) => (
                      <Badge key={i} className="astrology-badge text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search predictions..." className="terminal-input flex-1 text-sm" onKeyDown={(e) => e.key === "Enter" && searchAstrology()} data-testid="astrology-search-input" />
              <Button onClick={searchAstrology} size="sm" className="bg-[#9D4EDD] hover:bg-[#9D4EDD]/80"><Search className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="h-[200px] mt-3">
              <div className="space-y-2">
                {videos.map((v, i) => (
                  <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#9D4EDD]">
                    <div className="font-medium text-xs text-[#EDEDED] line-clamp-2">{v.title}</div>
                    <div className="text-xs text-[#888] mt-1">{v.channel}</div>
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9D4EDD] flex items-center gap-1 mt-1"><Play className="w-3 h-3" />Watch</a>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Stored & Reconciled */}
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FFD700]" />STORED_PREDICTIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {storedPredictions.map((pred, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] border border-[#1F1F1F]">
                      <div className="font-medium text-xs text-[#EDEDED] line-clamp-1">{pred.title}</div>
                      <div className="flex gap-1 mt-1">
                        {pred.predictions?.slice(0, 2).map((p, j) => (
                          <Badge key={j} variant="outline" className="text-xs border-[#FFD700]/30 text-[#FFD700]">{p.category}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="terminal-card border-[#00FF94]/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00FF94]" />RECONCILED_WITH_AI_DISASTERS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {reconciled.length > 0 ? reconciled.map((pred, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] border border-[#00FF94]/30">
                      <div className="text-xs text-[#EDEDED] line-clamp-1">{pred.title}</div>
                      <div className="text-xs text-[#00FF94] mt-1">Matched: {pred.reconciliation_result?.matches?.length || 0} actual events</div>
                    </div>
                  )) : (
                    <div className="text-center text-[#888] py-4 text-xs">Click RECONCILE to match predictions with actual disasters</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-xs text-[#444] text-center">
        Astrology predictions are reconciled with AI disaster data for accuracy enhancement. View DISASTERS tab for live data.
      </div>
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

// Tabular Predictions Component
const TabularPredictions = () => {
  const [tables, setTables] = useState(null);
  const [activeTable, setActiveTable] = useState("terror_attacks");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/tabular/all`).then(res => { setTables(res.data.tables); setLoading(false); }).catch(console.error);
  }, []);

  const getRiskColor = (prob) => {
    if (prob >= 70) return "text-[#FF3333]";
    if (prob >= 50) return "text-[#FFAA00]";
    if (prob >= 30) return "text-[#FFD700]";
    return "text-[#00FF94]";
  };

  const tableOptions = [
    { id: "terror_attacks", label: "TERROR ATTACKS", icon: AlertTriangle },
    { id: "ceo_departures", label: "CEO DEPARTURES", icon: Users },
    { id: "geopolitical", label: "GEOPOLITICAL", icon: Globe },
  ];

  return (
    <div className="space-y-6" data-testid="tabular-view">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#00E5FF]" />TABULAR_PREDICTIONS
        </h2>
        <div className="flex gap-1">
          {tableOptions.map(t => (
            <Button key={t.id} onClick={() => setActiveTable(t.id)} variant={activeTable === t.id ? "default" : "outline"} size="sm" className={activeTable === t.id ? "btn-primary text-xs" : "btn-secondary text-xs"}>
              <t.icon className="w-3 h-3 mr-1" />{t.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#888]">Loading tables...</div>
      ) : tables && tables[activeTable] && (
        <Card className="terminal-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{tables[activeTable].title}</CardTitle>
            <CardDescription className="text-xs text-[#888]">Updated: {new Date(tables[activeTable].updated_at).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F1F]">
                    <th className="text-left py-2 text-xs text-[#888] uppercase">Name</th>
                    {activeTable === "ceo_departures" && <th className="text-left py-2 text-xs text-[#888] uppercase">Company</th>}
                    {activeTable === "terror_attacks" && <th className="text-left py-2 text-xs text-[#888] uppercase">Code</th>}
                    {activeTable === "geopolitical" && <th className="text-left py-2 text-xs text-[#888] uppercase">Timeframe</th>}
                    <th className="text-right py-2 text-xs text-[#888] uppercase">Probability</th>
                    <th className="text-right py-2 text-xs text-[#888] uppercase">30D Change</th>
                  </tr>
                </thead>
                <tbody>
                  {tables[activeTable].data?.map((row, i) => (
                    <tr key={i} className="border-b border-[#1F1F1F]/50 hover:bg-[#141414]">
                      <td className="py-2 text-[#EDEDED]">{row.name || row.country || row.event}</td>
                      {activeTable === "ceo_departures" && <td className="py-2 text-[#888]">{row.company}</td>}
                      {activeTable === "terror_attacks" && <td className="py-2 text-[#888]">{row.code}</td>}
                      {activeTable === "geopolitical" && <td className="py-2 text-[#888]">{row.timeframe}</td>}
                      <td className={`py-2 text-right font-mono font-bold ${getRiskColor(row.probability)}`}>{row.probability}%</td>
                      <td className={`py-2 text-right font-mono text-sm ${row.change_30d > 0 ? "text-[#FF3333]" : row.change_30d < 0 ? "text-[#00FF94]" : "text-[#888]"}`}>
                        {row.change_30d > 0 ? "+" : ""}{row.change_30d}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
      case "deep-forecast":
        return <DeepForecast getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "disasters":
        return <Disasters getHeaders={getHeaders} />;
      case "astrology":
        return <Astrology getHeaders={getHeaders} user={user} />;
      case "tabular":
        return <TabularPredictions />;
      case "accuracy":
        return <AccuracyDashboard getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "my-dashboards":
        return <CustomDashboards getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "osint":
        return <OSINTSearch />;
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
