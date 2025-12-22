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
  ChevronLeft,
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
  EyeOff,
  MoreVertical,
  Check,
  X,
  Copy,
  FolderOpen,
  Clock,
  Bell,
  Radio,
  Truck,
  Wrench,
  Network,
  Server,
  Factory,
  Ship,
  Package,
  Wifi,
  WifiOff,
  Droplet,
  Archive,
  Satellite,
  Wind,
  Phone,
  MessageCircle,
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
// ADVERTISEMENT COMPONENTS
// =============================================================================

// Banner Ad Component
const BannerAd = ({ placement = "homepage_banner", className = "" }) => {
  const [ad, setAd] = useState(null);
  
  useEffect(() => {
    const loadAd = async () => {
      try {
        const res = await axios.get(`${API}/ads/placement/${placement}`);
        if (res.data.ads && res.data.ads.length > 0) {
          setAd(res.data.ads[0]);
        }
      } catch (e) {
        console.log("No ads available");
      }
    };
    loadAd();
  }, [placement]);
  
  const handleClick = async () => {
    if (ad) {
      await axios.post(`${API}/ads/${ad.id}/click`);
      if (ad.click_url) window.open(ad.click_url, '_blank');
    }
  };
  
  if (!ad) return null;
  
  return (
    <div className={`ad-banner ${className}`} onClick={handleClick} style={{cursor: 'pointer'}}>
      <div className="text-xs text-[#444] text-right mb-1">Advertisement</div>
      <img 
        src={ad.media_url} 
        alt={ad.title} 
        className="w-full h-auto rounded border border-[#1F1F1F]"
        onError={(e) => e.target.style.display = 'none'}
      />
    </div>
  );
};

// Video Ad Component (30 sec max, skippable after 5 sec)
const VideoAd = ({ placement = "modal_interstitial", onComplete, onSkip }) => {
  const [ad, setAd] = useState(null);
  const [canSkip, setCanSkip] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [playing, setPlaying] = useState(true);
  
  useEffect(() => {
    const loadAd = async () => {
      try {
        const res = await axios.get(`${API}/ads/placement/${placement}`);
        const videoAd = res.data.ads?.find(a => a.type === 'video');
        if (videoAd) setAd(videoAd);
      } catch (e) {
        onComplete?.();
      }
    };
    loadAd();
  }, [placement, onComplete]);
  
  useEffect(() => {
    if (ad && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanSkip(true);
    }
  }, [ad, countdown]);
  
  const handleSkip = async () => {
    if (canSkip) {
      await axios.post(`${API}/ads/${ad.id}/click`);
      onSkip?.();
    }
  };
  
  if (!ad) return null;
  
  return (
    <div className="video-ad fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative max-w-3xl w-full">
        <video 
          src={ad.media_url} 
          autoPlay 
          muted={!playing}
          onEnded={() => onComplete?.()}
          className="w-full rounded"
        />
        <div className="absolute top-4 right-4">
          {canSkip ? (
            <Button onClick={handleSkip} size="sm" className="bg-white text-black">
              Skip Ad →
            </Button>
          ) : (
            <Badge className="bg-black/50 text-white">Skip in {countdown}s</Badge>
          )}
        </div>
        <div className="absolute bottom-4 left-4 text-xs text-white/70">
          Ad • {ad.title}
        </div>
      </div>
    </div>
  );
};

// Live Video Feed Component
const LiveVideoFeed = ({ disasterType, location }) => {
  const [feeds, setFeeds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  
  const loadFeeds = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/video/live/${disasterType}?location=${encodeURIComponent(location || '')}`);
      setFeeds(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    if (disasterType) loadFeeds();
  }, [disasterType, location]);
  
  if (!feeds) return null;
  
  return (
    <Card className="terminal-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Play className="w-4 h-4 text-[#FF3333]" />
          LIVE VIDEO FEEDS
          <Badge className="bg-[#FF3333]">{feeds.total_sources} SOURCES</Badge>
        </CardTitle>
        <CardDescription className="text-xs text-[#888]">
          Real-time video coverage from YouTube, Twitter, and news agencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* YouTube Live */}
          {feeds.youtube_live?.map((feed, i) => (
            <a 
              key={i}
              href={feed.search_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#FF0000] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-[#FF0000] rounded-full animate-pulse" />
                <span className="text-xs font-bold text-[#FF0000]">YouTube</span>
              </div>
              <div className="text-xs text-[#EDEDED] truncate">{feed.title}</div>
              <div className="text-xs text-[#888]">{feed.viewers?.toLocaleString()} watching</div>
            </a>
          ))}
          
          {/* Twitter */}
          {feeds.twitter_videos?.map((feed, i) => (
            <a 
              key={i}
              href={feed.search_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#1DA1F2] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-[#1DA1F2] rounded-full animate-pulse" />
                <span className="text-xs font-bold text-[#1DA1F2]">Twitter/X</span>
              </div>
              <div className="text-xs text-[#EDEDED] truncate">{feed.title}</div>
            </a>
          ))}
          
          {/* News */}
          {feeds.news_coverage?.map((feed, i) => (
            <a 
              key={i}
              href={feed.embed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#FFD700] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#FFD700]">{feed.source}</span>
              </div>
              <div className="text-xs text-[#EDEDED] truncate">{feed.title}</div>
            </a>
          ))}
          
          {/* Weather Cams */}
          {feeds.weather_cams?.map((feed, i) => (
            <a 
              key={i}
              href={feed.embed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#00E5FF] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-[#00E5FF] rounded-full animate-pulse" />
                <span className="text-xs font-bold text-[#00E5FF]">Weather Cam</span>
              </div>
              <div className="text-xs text-[#EDEDED] truncate">{feed.title}</div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

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
const Navigation = ({ activeTab, setActiveTab, user, setShowAuth, setShowChangePassword, logout, language, setLanguage }) => {
  const tabs = [
    { id: "dashboard", label: "DASHBOARD", icon: Home },
    { id: "forecast", label: "AI_FORECAST", icon: Brain },
    { id: "deep-forecast", label: "DEEP_FORECAST", icon: Sparkles },
    { id: "investment", label: "IB_SUITE", icon: TrendingUp },
    { id: "disasters", label: "DISASTERS", icon: AlertTriangle },
    { id: "space", label: "SPACE_HAZARDS", icon: Star },
    { id: "astrology", label: "ASTROLOGY", icon: Moon },
    { id: "tabular", label: "TABULAR", icon: BarChart3 },
    { id: "holographic", label: "3D_VISUAL", icon: Globe },
    { id: "accuracy", label: "ACCURACY", icon: Target },
    { id: "my-dashboards", label: "MY_DASHBOARDS", icon: Layers },
    { id: "pricing", label: "PRICING", icon: CreditCard },
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
                  {(user.role === "owner" || user.role === "enterprise_admin") && (
                    <Badge variant="outline" className="ml-2 text-[10px] border-[#9D4EDD] text-[#9D4EDD]">
                      {user.role === "owner" ? "OWNER" : "ADMIN"}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0A0A0A] border-[#1F1F1F]">
                {(user.role === "owner" || user.role === "enterprise_admin" || user.role === "admin") && (
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)} className="cursor-pointer">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                )}
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
  const [futurePredictions, setFuturePredictions] = useState([]);
  const [disasterSummary, setDisasterSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    // Load data independently to handle partial failures
    try {
      const statsRes = await axios.get(`${API}/stats`);
      setStats(statsRes.data);
    } catch (e) { console.error("Stats error:", e); }
    
    try {
      const eqRes = await axios.get(`${API}/disasters/earthquakes?min_magnitude=4.5&limit=10`);
      setEarthquakes(eqRes.data.earthquakes || []);
    } catch (e) { console.error("Earthquakes error:", e); }
    
    try {
      const predictionsRes = await axios.get(`${API}/events/predictions?timeframe=2026-3000`);
      setFuturePredictions(predictionsRes.data.predictions || []);
    } catch (e) { console.error("Predictions error:", e); }
    
    try {
      const disasterRes = await axios.get(`${API}/disasters/summary`);
      setDisasterSummary(disasterRes.data);
    } catch (e) { console.error("Disaster summary error:", e); }
    
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

      {/* Hero Video Ad Showcase */}
      <Card className="terminal-card border-l-4 border-l-[#9D4EDD] overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <video 
              src="/videos/plutus_ad.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-48 md:h-64 object-cover"
              poster="/videos/plutus_poster.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
              <div className="p-6">
                <Badge className="bg-[#FF3333] text-white mb-2">AI-POWERED</Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">PREDICTIVE INTELLIGENCE</h2>
                <p className="text-sm text-white/80 max-w-md">
                  AI forecasting for events, disasters, markets & geopolitics. 
                  Powered by GPT-4, Claude & Gemini ensemble with 1M+ OSINT sources.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="bg-[#00FF94]/20 text-[#00FF94]">ECONOMICS</Badge>
                  <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">GEOPOLITICAL</Badge>
                  <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">TECHNOLOGY</Badge>
                  <Badge className="bg-[#FF9800]/20 text-[#FF9800]">SOCIAL</Badge>
                  <Badge className="bg-[#4CAF50]/20 text-[#4CAF50]">CLIMATE</Badge>
                  <Badge className="bg-[#FF5252]/20 text-[#FF5252]">HEALTH</Badge>
                  <Badge className="bg-[#FFD700]/20 text-[#FFD700]">CRYPTO</Badge>
                  <Badge className="bg-[#7C3AED]/20 text-[#7C3AED]">SPACE</Badge>
                  <Badge className="bg-[#E91E63]/20 text-[#E91E63]">SPORTS</Badge>
                  <Badge className="bg-[#03A9F4]/20 text-[#03A9F4]">ENTERTAINMENT</Badge>
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="text-xs text-white/50 border-white/20">
                <Play className="w-3 h-3 mr-1" /> Promotional Video
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Future Predictions 2026-3000 */}
        <Card className="terminal-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                FUTURE_FORECASTS
              </CardTitle>
              <Badge className="bg-[#00FF94]/20 text-[#00FF94] text-xs">2026-3000</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {futurePredictions.length > 0 ? (
                <div className="space-y-2">
                  {futurePredictions.slice(0, 8).map((pred, i) => (
                    <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#00E5FF] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-[#EDEDED] flex-1 pr-4">{pred.title}</span>
                        <span className="font-mono text-lg font-bold text-[#00E5FF]">{pred.probability}%</span>
                      </div>
                      <div className="probability-bar">
                        <div className="probability-bar-fill" style={{ width: `${pred.probability}%` }} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs border-[#1F1F1F]">{pred.category}</Badge>
                        <Badge variant="outline" className="text-xs border-[#00FF94]/30 text-[#00FF94]">{pred.estimated_date}</Badge>
                        <Badge variant="outline" className={`text-xs ${pred.confidence === "high" ? "border-[#00FF94]/30 text-[#00FF94]" : pred.confidence === "medium" ? "border-[#FFD700]/30 text-[#FFD700]" : "border-[#888]/30 text-[#888]"}`}>{pred.confidence}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#888] py-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Loading future predictions...</p>
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
  const [activeView, setActiveView] = useState("forecast");
  
  // Live Events State
  const [liveEvents, setLiveEvents] = useState(null);
  const [eventPredictions, setEventPredictions] = useState(null);
  const [eventBriefing, setEventBriefing] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  const views = [
    { id: "forecast", label: "FORECAST", icon: Brain },
    { id: "live", label: "LIVE EVENTS", icon: Radio },
    { id: "predictions", label: "2025-2040", icon: TrendingUp },
  ];
  
  const loadLiveEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const eventsRes = await axios.get(`${API}/events/live`);
      console.log("Live events loaded:", eventsRes.data);
      setLiveEvents(eventsRes.data);
      
      // Load briefing separately
      try {
        const briefingRes = await axios.get(`${API}/events/daily-briefing`);
        setEventBriefing(briefingRes.data);
      } catch (e) {
        console.log("Briefing not available");
      }
    } catch (e) {
      console.error("Error loading live events:", e);
    }
    setLoadingEvents(false);
  }, []);
  
  const loadEventPredictions = async () => {
    setLoadingEvents(true);
    try {
      const res = await axios.get(`${API}/events/predictions?timeframe=2025-2040`);
      setEventPredictions(res.data);
      toast.success("Event predictions generated!");
    } catch (e) {
      toast.error("Failed to load predictions");
    }
    setLoadingEvents(false);
  };
  
  useEffect(() => {
    if (activeView === "live") loadLiveEvents();
  }, [activeView, loadLiveEvents]);

  // Prediction categories with comprehensive coverage
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
      // Use Judgmental Forecasting Engine for enhanced predictions
      const res = await axios.post(`${API}/judgmental-forecast`, { 
        question,
        include_factors: true
      }, { headers: getHeaders() });
      setForecast(res.data);
      toast.success("Judgmental forecast generated!");
    } catch (e) {
      // Fallback to standard forecast
      try {
        const res = await axios.post(`${API}/forecast`, { question }, { headers: getHeaders() });
        setForecast(res.data);
        toast.success("Forecast generated!");
      } catch (e2) {
        toast.error(e2.response?.data?.detail || "Failed to generate forecast");
      }
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
            PLUTUS_EVENT_FORECASTING
          </h2>
          <p className="text-xs text-[#888] mt-1">Proprietary Multi-Factor Engine • Live Events • 2025-2040 Predictions • Video Feeds</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-[#00E5FF]/30 text-[#00E5FF]">
            <span className="w-2 h-2 bg-[#00E5FF] rounded-full mr-1 animate-pulse" />LIVE
          </Badge>
          <Badge className="bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30">PROPRIETARY AI</Badge>
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
            className={activeView === v.id ? "bg-[#00E5FF] text-black" : "border-[#1F1F1F] text-[#888]"}
          >
            <v.icon className="w-3 h-3 mr-1" />
            {v.label}
          </Button>
        ))}
      </div>
      
      {/* LIVE EVENTS VIEW */}
      {activeView === "live" && (
        <div className="space-y-4">
          {/* Daily Briefing */}
          {eventBriefing && (
            <Card className="terminal-card border-l-4 border-l-[#00FF94]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#00FF94]" />
                    AI DAILY EVENT BRIEFING - {eventBriefing.date || new Date().toLocaleDateString()}
                  </CardTitle>
                  <Badge className={eventBriefing.market_mood === "risk-on" ? "bg-[#00FF94]" : eventBriefing.market_mood === "risk-off" ? "bg-[#FF3333]" : "bg-[#FFAA00]"}>
                    {eventBriefing.market_mood?.toUpperCase() || "MIXED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#EDEDED] mb-3">{eventBriefing.executive_summary}</p>
                {eventBriefing["24_hour_forecast"] && (
                  <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-xs text-[#888]">24-HOUR FORECAST:</div>
                    <div className="text-xs text-[#EDEDED]">{eventBriefing["24_hour_forecast"]}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Live Events List */}
          {liveEvents && (
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#00E5FF] animate-pulse" />
                    LIVE EVENTS NOW
                    <Badge className="bg-[#00E5FF]">{liveEvents.total_live} ACTIVE</Badge>
                  </CardTitle>
                  <Button onClick={loadLiveEvents} size="sm" variant="outline" className="text-xs">
                    <RefreshCw className={`w-3 h-3 mr-1 ${loadingEvents ? "animate-spin" : ""}`} />REFRESH
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {Object.entries(liveEvents.by_category || {}).map(([cat, count]) => (
                    <div key={cat} className="p-2 bg-[#0A0A0A] rounded text-center">
                      <div className="text-lg font-bold text-[#00E5FF]">{count}</div>
                      <div className="text-xs text-[#888]">{cat.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {(liveEvents.events || []).slice(0, 20).map((event, i) => (
                    <div key={i} className={`p-3 bg-[#0A0A0A] rounded border ${event.impact === "high" ? "border-[#FF3333]" : "border-[#1F1F1F]"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{event.title}</div>
                          <div className="text-xs text-[#888] mt-1">
                            {event.category?.toUpperCase()} • {event.source}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={event.status === "LIVE" ? "bg-[#FF3333]" : "bg-[#FFAA00]"}>
                            {event.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{event.impact?.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Live Video Feeds for Events */}
          {liveEvents?.events?.[0] && (
            <LiveVideoFeed 
              disasterType={liveEvents.events[0].category} 
              location="" 
            />
          )}
          
          {/* Sidebar Ad */}
          <BannerAd placement="in_feed" />
        </div>
      )}
      
      {/* PREDICTIONS VIEW (2025-2040) */}
      {activeView === "predictions" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#9D4EDD]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#9D4EDD]" />
                  AI EVENT PREDICTIONS 2025-2040
                  <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">MULTI-LLM</Badge>
                </CardTitle>
                <Button onClick={loadEventPredictions} disabled={loadingEvents} className="bg-[#9D4EDD] text-white hover:bg-[#9D4EDD]/80">
                  {loadingEvents ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                  GENERATE PREDICTIONS
                </Button>
              </div>
              <CardDescription className="text-xs text-[#888]">
                AI-powered predictions across economic, geopolitical, technology, social, and health categories
              </CardDescription>
            </CardHeader>
          </Card>
          
          {eventPredictions && eventPredictions.predictions && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eventPredictions.predictions.map((pred, i) => (
                  <Card key={i} className={`terminal-card border-l-2 ${pred.probability > 70 ? "border-l-[#FF3333]" : pred.probability > 50 ? "border-l-[#FFAA00]" : "border-l-[#00E5FF]"}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold">{pred.title}</div>
                          <div className="text-xs text-[#888]">{pred.estimated_date} • {pred.category?.toUpperCase()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-[#FF3333]">{pred.probability}%</div>
                          <Badge className={pred.impact === "critical" ? "bg-[#FF3333]" : pred.impact === "high" ? "bg-[#FFAA00]" : "bg-[#00E5FF]"}>
                            {pred.impact?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {pred.rationale && (
                        <div className="text-xs text-[#888] mt-2 p-2 bg-[#0A0A0A] rounded">{pred.rationale}</div>
                      )}
                      {pred.affected_sectors && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {pred.affected_sectors.slice(0, 3).map((sector, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{sector}</Badge>
                          ))}
                        </div>
                      )}
                      {/* Add PREPARE REMEDIATION for climate/disaster related predictions */}
                      {(pred.category === "climate" || pred.category === "health" || pred.impact === "critical" || pred.impact === "high") && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            // Navigate to Disasters tab and open remediation
                            window.dispatchEvent(new CustomEvent('openRemediation', {
                              detail: {
                                disaster_type: pred.title || pred.category,
                                severity: pred.impact || "high",
                                location: (pred.affected_regions && pred.affected_regions[0]) || "Global",
                                population_affected: 50000,
                                model_preference: "ensemble"
                              }
                            }));
                          }}
                          className="mt-2 w-full bg-[#00FF94] text-black hover:bg-[#00FF94]/80 text-xs"
                        >
                          <Shield className="w-3 h-3 mr-1" />PREPARE REMEDIATION
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Category Outlook */}
              {eventPredictions.category_outlook && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">CATEGORY OUTLOOK</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(eventPredictions.category_outlook).map(([cat, data]) => (
                        <div key={cat} className="p-2 bg-[#0A0A0A] rounded">
                          <div className="text-xs font-bold text-[#00E5FF]">{cat.toUpperCase()}</div>
                          <div className="text-xs text-[#888]">Trend: {data.trend}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Wild Cards */}
              {eventPredictions.wild_cards && (
                <Card className="terminal-card border-l-2 border-l-[#FF3333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FF3333]" />
                      WILD CARDS (Low Probability, High Impact)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {eventPredictions.wild_cards.map((wc, i) => (
                        <div key={i} className="p-2 bg-[#0A0A0A] rounded border border-[#FF3333]/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{wc.event}</span>
                            <Badge className="bg-[#FF3333]/20 text-[#FF3333]">{wc.probability}%</Badge>
                          </div>
                          <div className="text-xs text-[#888] mt-1">{wc.impact_if_occurs}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          
          {/* In-feed Ad */}
          <BannerAd placement="between_sections" />
        </div>
      )}
      
      {/* FORECAST VIEW (Original) */}
      {activeView === "forecast" && (
        <>
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
            {/* Target Year Banner */}
            {(forecast.target_year || forecast.forecast_period) && (
              <div className="mb-4 p-3 bg-[#9D4EDD]/10 border border-[#9D4EDD] rounded-lg text-center">
                <div className="text-xs text-[#9D4EDD] uppercase tracking-wider mb-1">FORECAST PERIOD</div>
                <div className="text-2xl font-bold text-[#9D4EDD]">
                  {forecast.forecast_period || forecast.target_year}
                </div>
              </div>
            )}
            
            {/* Main Probability */}
            <div className="text-center mb-6">
              <div className="font-mono text-6xl font-bold text-[#00E5FF]">{forecast.probability}%</div>
              <div className="text-[#888] text-sm mt-2">PROBABILITY ESTIMATE</div>
              <div className="flex justify-center gap-2 mt-2">
                <Badge className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">
                  {forecast.confidence?.level || forecast.confidence || "MEDIUM"} CONFIDENCE
                </Badge>
                {forecast.methodology?.engine && (
                  <Badge variant="outline" className="text-[#FFD700] border-[#FFD700]/30">
                    JUDGMENTAL AI
                  </Badge>
                )}
                {forecast.target_year && (
                  <Badge variant="outline" className="text-[#9D4EDD] border-[#9D4EDD]/30">
                    {forecast.target_year}
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="bg-[#1F1F1F] my-6" />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Rationale */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[#888] mb-2">RATIONALE</h4>
                <p className="text-sm text-[#EDEDED]">{forecast.rationale}</p>
                
                {/* Methodology Info */}
                {forecast.methodology && (
                  <div className="mt-4 p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <h5 className="text-xs text-[#FFD700] mb-2">METHODOLOGY</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-[#888]">Event Type:</div>
                      <div className="text-[#EDEDED]">{forecast.methodology.event_type?.replace(/_/g, ' ')}</div>
                      <div className="text-[#888]">Base Rate:</div>
                      <div className="text-[#00FF94]">{forecast.methodology.base_rate}%</div>
                      <div className="text-[#888]">Target Year:</div>
                      <div className="text-[#9D4EDD] font-bold">{forecast.methodology.target_year || forecast.target_year || "N/A"}</div>
                      <div className="text-[#888]">Time Horizon:</div>
                      <div className="text-[#EDEDED]">{forecast.methodology.time_horizon?.horizon_type || "medium"}</div>
                      <div className="text-[#888]">Engine:</div>
                      <div className="text-[#00E5FF]">{forecast.methodology.engine?.split(' ')[0] || "Plutus AI"}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Factor Analysis or LLM Forecasts */}
              <div>
                {forecast.factors ? (
                  <>
                    <h4 className="text-xs uppercase tracking-wider text-[#888] mb-2">FACTOR_ANALYSIS</h4>
                    <div className="space-y-2">
                      {Object.entries(forecast.factors).map(([name, data]) => (
                        <div key={name} className="flex justify-between items-center p-2 bg-[#141414] border border-[#1F1F1F]">
                          <span className="text-sm text-[#888]">{name.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              data.impact === "positive" ? "bg-[#00FF94]" : 
                              data.impact === "negative" ? "bg-[#FF4444]" : "bg-[#FFD700]"
                            }`} />
                            <span className="font-mono text-sm text-[#00E5FF]">{(data.score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : forecast.individual_forecasts ? (
                  <>
                    <h4 className="text-xs uppercase tracking-wider text-[#888] mb-2">INDIVIDUAL_LLM_FORECASTS</h4>
                    <div className="space-y-2">
                      {forecast.individual_forecasts?.map((f, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-[#141414] border border-[#1F1F1F]">
                          <span className="text-sm text-[#888] uppercase">{f.provider}</span>
                          <span className="font-mono font-bold text-[#00E5FF]">{f.probability}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-4 flex justify-between items-center text-xs text-[#444]">
              <span>
                {forecast.sources_analyzed ? `Sources: ${forecast.sources_analyzed.toLocaleString()}` : 
                 forecast.methodology?.factors_analyzed ? `Factors: ${forecast.methodology.factors_analyzed}` : ""}
                {forecast.aggregation_method && ` | Method: ${forecast.aggregation_method}`}
              </span>
              <span className="text-[#00FF94]">
                {forecast.model_version || "plutus-jf-1.0"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Summary Footer */}
      <div className="text-xs text-[#444] text-center">
        Prediction categories: Economics • Geopolitical • Technology • Finance • Disasters • Politics • Corporate • Health • Energy • Space
      </div>
        </>
      )}
    </div>
  );
};

// Disasters Component (Independent)
const Disasters = ({ getHeaders, pendingRemediation, clearPendingRemediation }) => {
  const [earthquakes, setEarthquakes] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [globalDisasters, setGlobalDisasters] = useState([]);
  const [disasterSummary, setDisasterSummary] = useState(null);
  const [agencies, setAgencies] = useState(null);
  const [sensors, setSensors] = useState(null);
  const [economicImpact, setEconomicImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  
  // Comprehensive disaster data (Phase 1)
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [infrastructureStatus, setInfrastructureStatus] = useState(null);
  const [supplyChainStatus, setSupplyChainStatus] = useState(null);
  const [cyberStatus, setCyberStatus] = useState(null);
  const [disasterPrediction, setDisasterPrediction] = useState(null);
  const [fullAnalysis, setFullAnalysis] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  
  // Phase 2 data
  const [humanSignals, setHumanSignals] = useState(null);
  const [satelliteIotData, setSatelliteIotData] = useState(null);
  const [playbooks, setPlaybooks] = useState(null);
  const [decisionSupport, setDecisionSupport] = useState(null);
  
  // Prediction form state
  const [predictionForm, setPredictionForm] = useState({
    disaster_type: "flood",
    region: "global",
    timeframe_hours: 72
  });
  
  // Remediation state
  const [remediationTypes, setRemediationTypes] = useState(null);
  const [remediationPlan, setRemediationPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remediationForm, setRemediationForm] = useState({
    disaster_type: "earthquake",
    severity: "high",
    location: "",
    population_affected: 10000,
    model_preference: "ensemble"
  });

  // Handle pending remediation from AI Forecast
  useEffect(() => {
    if (pendingRemediation) {
      setRemediationForm({
        disaster_type: pendingRemediation.disaster_type || "earthquake",
        severity: pendingRemediation.severity || "high",
        location: pendingRemediation.location || "",
        population_affected: pendingRemediation.population_affected || 50000,
        model_preference: pendingRemediation.model_preference || "ensemble"
      });
      setActiveView("remediation");
      if (clearPendingRemediation) {
        clearPendingRemediation();
      }
    }
  }, [pendingRemediation, clearPendingRemediation]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load Phase 1 data
      const [eqRes, wxRes, gdRes, summaryRes, agencyRes, sensorRes, econRes, remTypesRes, compRes, infraRes, scRes, cyberRes] = await Promise.all([
        axios.get(`${API}/disasters/earthquakes?min_magnitude=4.0&limit=20`),
        axios.get(`${API}/disasters/weather-alerts`),
        axios.get(`${API}/disasters/global`),
        axios.get(`${API}/disasters/summary`),
        axios.get(`${API}/disasters/agencies`),
        axios.get(`${API}/disasters/sensors`),
        axios.get(`${API}/disasters/economic-impact`),
        axios.get(`${API}/disasters/remediation/disaster-types`),
        axios.get(`${API}/disasters/comprehensive`),
        axios.get(`${API}/disasters/comprehensive/infrastructure`),
        axios.get(`${API}/disasters/comprehensive/supply-chain`),
        axios.get(`${API}/disasters/comprehensive/cyber`),
      ]);
      setEarthquakes(eqRes.data.earthquakes || []);
      setWeatherAlerts(wxRes.data.alerts || []);
      setGlobalDisasters(gdRes.data.disasters || []);
      setDisasterSummary(summaryRes.data);
      setAgencies(agencyRes.data);
      setSensors(sensorRes.data);
      setEconomicImpact(econRes.data);
      setRemediationTypes(remTypesRes.data);
      setComprehensiveData(compRes.data);
      setInfrastructureStatus(infraRes.data);
      setSupplyChainStatus(scRes.data);
      setCyberStatus(cyberRes.data);
    } catch (e) {
      console.error("Phase 1 data load error:", e);
    }
    
    // Load Phase 2 data independently to ensure partial success
    try {
      const humanRes = await axios.get(`${API}/disasters/comprehensive/human-signals`);
      setHumanSignals(humanRes.data);
    } catch (e) { console.error("Human signals error:", e); }
    
    try {
      const satRes = await axios.get(`${API}/disasters/comprehensive/satellite-iot`);
      setSatelliteIotData(satRes.data);
    } catch (e) { console.error("Satellite IoT error:", e); }
    
    try {
      const playRes = await axios.get(`${API}/disasters/comprehensive/playbooks`);
      setPlaybooks(playRes.data);
    } catch (e) { console.error("Playbooks error:", e); }
    
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  
  // Run disaster prediction
  const runPrediction = async () => {
    setPredictionLoading(true);
    try {
      const res = await axios.post(
        `${API}/disasters/comprehensive/full-analysis?disaster_type=${predictionForm.disaster_type}&region=${predictionForm.region}&timeframe_hours=${predictionForm.timeframe_hours}`
      );
      setFullAnalysis(res.data);
      setDisasterPrediction(res.data.prediction);
      toast.success("Full disaster analysis complete!");
    } catch (e) {
      console.error(e);
      toast.error("Prediction failed");
    }
    setPredictionLoading(false);
  };
  
  const generateRemediationPlan = async () => {
    if (!remediationForm.location) {
      toast.error("Please enter a location");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API}/disasters/remediation/plan`, remediationForm, { headers: getHeaders() });
      setRemediationPlan(res.data);
      toast.success("Remediation plan generated successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate plan");
    }
    setIsGenerating(false);
  };

  const views = [
    { id: "overview", label: "OVERVIEW", icon: Home },
    { id: "live", label: "LIVE NOW", icon: Radio },
    { id: "infrastructure", label: "INFRASTRUCTURE", icon: Zap },
    { id: "supply_chain", label: "SUPPLY CHAIN", icon: Truck },
    { id: "cyber", label: "CYBER", icon: Shield },
    { id: "human_signals", label: "HUMAN SIGNALS", icon: Users },
    { id: "sensors", label: "SATELLITES/IOT", icon: Cpu },
    { id: "predict", label: "AI PREDICT", icon: Brain },
    { id: "playbooks", label: "PLAYBOOKS", icon: FileText },
    { id: "predictions", label: "2025-2026", icon: TrendingUp },
    { id: "longrange", label: "2026-2040", icon: Clock },
    { id: "judgmental", label: "JUDGMENTAL", icon: Target },
    { id: "remediation", label: "REMEDIATION", icon: Wrench },
    { id: "agencies", label: "AGENCIES", icon: Globe },
    { id: "economic", label: "ECONOMIC", icon: DollarSign },
  ];

  // State for live disasters and predictions
  const [liveDisasters, setLiveDisasters] = useState(null);
  const [futurePredictions, setFuturePredictions] = useState(null);
  const [longRangeForecasts, setLongRangeForecasts] = useState(null);
  const [yearForecast, setYearForecast] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2030);
  const [dailyBriefing, setDailyBriefing] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingLongRange, setLoadingLongRange] = useState(false);
  
  // Judgmental Disaster Forecasting state
  const [judgmentalForecast, setJudgmentalForecast] = useState(null);
  const [loadingJudgmental, setLoadingJudgmental] = useState(false);
  const [judgmentalForm, setJudgmentalForm] = useState({
    disaster_type: "earthquake",
    location: "",
    timeframe: "2025",
    severity: "any"
  });

  const loadLiveDisasters = useCallback(async () => {
    try {
      const liveRes = await axios.get(`${API}/disasters/live`);
      setLiveDisasters(liveRes.data);
    } catch (e) {
      console.error("Live disasters error:", e);
    }
    
    // Load briefing separately (it may be slow due to AI)
    try {
      const briefingRes = await axios.get(`${API}/disasters/daily-briefing`);
      setDailyBriefing(briefingRes.data);
    } catch (e) {
      console.error("Daily briefing error:", e);
    }
  }, []);

  const loadFuturePredictions = async () => {
    setLoadingPredictions(true);
    try {
      const res = await axios.get(`${API}/disasters/predictions?timeframe=2025-2026`);
      setFuturePredictions(res.data);
      toast.success("AI predictions generated!");
    } catch (e) {
      toast.error("Failed to load predictions");
    }
    setLoadingPredictions(false);
  };

  const generateJudgmentalDisasterForecast = async () => {
    if (!judgmentalForm.location) {
      toast.error("Please enter a location");
      return;
    }
    setLoadingJudgmental(true);
    try {
      const res = await axios.post(`${API}/judgmental-forecast/disaster`, judgmentalForm, { headers: getHeaders() });
      setJudgmentalForecast(res.data);
      toast.success("Judgmental disaster forecast generated!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate forecast");
    }
    setLoadingJudgmental(false);
  };

  const loadLongRangeForecasts = async () => {
    setLoadingLongRange(true);
    try {
      const res = await axios.get(`${API}/forecast/long-range`);
      setLongRangeForecasts(res.data);
      toast.success("2026-2040 forecasts loaded!");
    } catch (e) {
      toast.error("Failed to load long-range forecasts");
    }
    setLoadingLongRange(false);
  };

  const loadYearForecast = async (year) => {
    setLoadingLongRange(true);
    try {
      const res = await axios.get(`${API}/forecast/year/${year}`);
      setYearForecast(res.data);
      setSelectedYear(year);
    } catch (e) {
      toast.error(`Failed to load ${year} forecast`);
    }
    setLoadingLongRange(false);
  };

  const generateRemediationFromLive = async (disaster) => {
    setIsGenerating(true);
    setRemediationForm({
      disaster_type: disaster.type,
      severity: disaster.severity,
      location: disaster.location,
      population_affected: disaster.affected_population || 10000,
      model_preference: "ensemble"
    });
    setActiveView("remediation");
    try {
      const res = await axios.post(`${API}/disasters/remediation/plan`, {
        disaster_type: disaster.type,
        severity: disaster.severity,
        location: disaster.location,
        population_affected: disaster.affected_population || 10000,
        model_preference: "ensemble"
      }, { headers: getHeaders() });
      setRemediationPlan(res.data);
      toast.success("Remediation plan generated for live disaster!");
    } catch (e) {
      toast.error("Failed to generate plan");
    }
    setIsGenerating(false);
  };

  useEffect(() => { loadLiveDisasters(); }, [loadLiveDisasters]);

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
          <Button onClick={() => { loadData(); loadLiveDisasters(); }} variant="outline" size="sm" className="btn-secondary" data-testid="refresh-disasters-btn">
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

      {/* LIVE NOW VIEW - Real disasters happening right now */}
      {activeView === "live" && (
        <div className="space-y-4">
          {/* Loading State */}
          {!liveDisasters && (
            <Card className="terminal-card">
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#00E5FF]" />
                <p className="text-sm text-[#888] mt-2">Loading live disasters from GDACS, USGS, NOAA...</p>
              </CardContent>
            </Card>
          )}

          {/* Daily Briefing Card */}
          {dailyBriefing && (
            <Card className={`terminal-card border-l-4 ${dailyBriefing.alert_level === "red" ? "border-l-[#FF3333]" : dailyBriefing.alert_level === "orange" ? "border-l-[#FFAA00]" : "border-l-[#00FF94]"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#00FF94]" />
                    AI DAILY BRIEFING - {dailyBriefing.date || new Date().toLocaleDateString()}
                  </CardTitle>
                  <Badge className={dailyBriefing.alert_level === "red" ? "bg-[#FF3333]" : dailyBriefing.alert_level === "orange" ? "bg-[#FFAA00]" : "bg-[#00FF94]"}>
                    {dailyBriefing.alert_level?.toUpperCase()} ALERT
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#EDEDED] mb-3">{dailyBriefing.executive_summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 bg-[#0A0A0A] rounded">
                    <div className="text-xl font-bold text-[#FF3333]">{dailyBriefing.total_active_disasters || liveDisasters?.total_active || 0}</div>
                    <div className="text-xs text-[#888]">ACTIVE NOW</div>
                  </div>
                  {dailyBriefing.disasters_by_type && Object.entries(dailyBriefing.disasters_by_type).slice(0, 3).map(([type, count]) => (
                    <div key={type} className="text-center p-2 bg-[#0A0A0A] rounded">
                      <div className="text-xl font-bold text-[#FFAA00]">{count}</div>
                      <div className="text-xs text-[#888]">{type.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                {dailyBriefing["24_hour_outlook"] && (
                  <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-xs text-[#888]">24-HOUR OUTLOOK:</div>
                    <div className="text-xs text-[#EDEDED]">{dailyBriefing["24_hour_outlook"]}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Disasters List */}
          {liveDisasters && (
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#FF3333] animate-pulse" />
                    DISASTERS HAPPENING NOW
                    <Badge className="bg-[#FF3333]">{liveDisasters?.total_active || 0} ACTIVE</Badge>
                  </CardTitle>
                  <Button onClick={loadLiveDisasters} size="sm" variant="outline" className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />REFRESH
                  </Button>
                </div>
                <CardDescription className="text-xs text-[#888]">
                  Real-time data from GDACS, USGS, NOAA • Click to generate remediation plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(liveDisasters?.disasters || []).map((disaster, i) => (
                  <div key={i} className={`p-3 bg-[#0A0A0A] rounded border ${disaster.severity === "critical" ? "border-[#FF3333]" : disaster.severity === "high" ? "border-[#FFAA00]" : "border-[#1F1F1F]"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{disaster.title}</div>
                        <div className="text-xs text-[#888] mt-1">
                          📍 {disaster.location} • Source: {disaster.source}
                        </div>
                        {disaster.magnitude && (
                          <div className="text-xs text-[#FF3333] mt-1">Magnitude: {disaster.magnitude}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={disaster.severity === "critical" ? "bg-[#FF3333]" : disaster.severity === "high" ? "bg-[#FFAA00]" : "bg-[#00E5FF]"}>
                          {disaster.severity?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{disaster.type?.replace(/_/g, ' ')}</Badge>
                        <Button 
                          size="sm" 
                          onClick={() => generateRemediationFromLive(disaster)}
                          className="mt-1 bg-[#00FF94] text-black hover:bg-[#00FF94]/80 text-xs"
                        >
                          <Shield className="w-3 h-3 mr-1" />REMEDIATE
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
          
          {/* Live Video Feeds for Current Disasters */}
          {liveDisasters?.disasters?.[0] && (
            <LiveVideoFeed 
              disasterType={liveDisasters.disasters[0].type} 
              location={liveDisasters.disasters[0].location} 
            />
          )}
        </div>
      )}

      {/* FUTURE PREDICTIONS VIEW - AI-powered 2025-2026+ */}
      {activeView === "predictions" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#9D4EDD]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#9D4EDD]" />
                  AI DISASTER PREDICTIONS 2025-2026
                  <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">MULTI-LLM</Badge>
                </CardTitle>
                <Button onClick={loadFuturePredictions} disabled={loadingPredictions} className="bg-[#9D4EDD] text-white hover:bg-[#9D4EDD]/80">
                  {loadingPredictions ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                  GENERATE PREDICTIONS
                </Button>
              </div>
              <CardDescription className="text-xs text-[#888]">
                AI-powered predictions based on current trends, climate models, and historical patterns
              </CardDescription>
            </CardHeader>
          </Card>

          {futurePredictions && futurePredictions.predictions && (
            <>
              {/* Predictions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {futurePredictions.predictions.map((pred, i) => (
                  <Card key={i} className={`terminal-card border-l-2 ${pred.probability > 70 ? "border-l-[#FF3333]" : pred.probability > 50 ? "border-l-[#FFAA00]" : "border-l-[#00E5FF]"}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold">{pred.title}</div>
                          <div className="text-xs text-[#888]">{pred.location} • {pred.estimated_timeframe}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-[#FF3333]">{pred.probability}%</div>
                          <Badge className={pred.severity === "critical" ? "bg-[#FF3333]" : pred.severity === "high" ? "bg-[#FFAA00]" : "bg-[#00E5FF]"}>
                            {pred.severity?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs"><strong className="text-[#888]">Population:</strong> {pred.affected_population}</div>
                        <div className="text-xs"><strong className="text-[#888]">Economic Impact:</strong> <span className="text-[#FFD700]">{pred.economic_impact}</span></div>
                        <div className="text-xs"><strong className="text-[#888]">Confidence:</strong> {pred.confidence_level}</div>
                      </div>
                      {pred.key_indicators && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {pred.key_indicators.slice(0, 3).map((ind, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{ind}</Badge>
                          ))}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setRemediationForm({
                            disaster_type: pred.type,
                            severity: pred.severity,
                            location: pred.location,
                            population_affected: parseInt(String(pred.affected_population).replace(/\D/g, '')) || 10000,
                            model_preference: "ensemble"
                          });
                          setActiveView("remediation");
                        }}
                        className="mt-2 w-full bg-[#00FF94] text-black hover:bg-[#00FF94]/80 text-xs"
                      >
                        <Shield className="w-3 h-3 mr-1" />PREPARE REMEDIATION
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Seasonal Risks */}
              {futurePredictions.seasonal_risks && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">SEASONAL RISK CALENDAR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(futurePredictions.seasonal_risks).map(([period, risks]) => (
                        <div key={period} className="p-2 bg-[#0A0A0A] rounded">
                          <div className="text-xs font-bold text-[#00E5FF]">{period.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-[#888] mt-1">
                            {Array.isArray(risks) ? risks.slice(0, 2).join(", ") : risks}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Space Weather Outlook */}
              {futurePredictions.space_weather_outlook && (
                <Card className="terminal-card border-l-2 border-l-[#FFD700]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#FFD700]" />
                      SPACE WEATHER OUTLOOK
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-xs text-[#888]">SOLAR CYCLE</div>
                        <div className="text-sm font-bold text-[#FFD700]">{futurePredictions.space_weather_outlook.solar_cycle_phase}</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-xs text-[#888]">MAJOR STORM PROB</div>
                        <div className="text-sm font-bold text-[#FF3333]">{futurePredictions.space_weather_outlook.major_storm_probability}%</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-xs text-[#888]">SATELLITE RISK</div>
                        <div className="text-xs text-[#FFAA00]">{futurePredictions.space_weather_outlook.satellite_risk_periods?.join(", ")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* LONG-RANGE FORECASTS 2026-2040 VIEW */}
      {activeView === "longrange" && (
        <div className="space-y-4">
          {/* Header Card */}
          <Card className="terminal-card border-l-4 border-l-[#00E5FF]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00E5FF]" />
                  LONG-RANGE FORECASTING: 2026-2040
                  <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">AUTO-UPDATE</Badge>
                </CardTitle>
                <Button onClick={loadLongRangeForecasts} disabled={loadingLongRange} className="bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80">
                  {loadingLongRange ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                  GENERATE 15-YEAR FORECAST
                </Button>
              </div>
              <CardDescription className="text-xs text-[#888]">
                AI-powered multi-decade predictions • Climate, Geopolitical, Economic, Tech, Space • Daily auto-updates at 6 AM UTC
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Year Selector */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SELECT YEAR FOR DETAILED FORECAST</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040].map(year => (
                  <Button
                    key={year}
                    size="sm"
                    variant={selectedYear === year ? "default" : "outline"}
                    onClick={() => loadYearForecast(year)}
                    className={selectedYear === year ? "bg-[#00E5FF] text-black" : "border-[#1F1F1F] text-[#888]"}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Year-Specific Forecast */}
          {yearForecast && (
            <Card className="terminal-card border-l-2 border-l-[#FFD700]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#FFD700]" />
                    FORECAST: {yearForecast.year}
                  </CardTitle>
                  <Badge className={yearForecast.risk_score > 70 ? "bg-[#FF3333]" : yearForecast.risk_score > 50 ? "bg-[#FFAA00]" : "bg-[#00FF94]"}>
                    RISK: {yearForecast.risk_score}/100
                  </Badge>
                </div>
                <p className="text-xs text-[#EDEDED]">{yearForecast.global_outlook}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Economic Forecast */}
                {yearForecast.economic_forecast && (
                  <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-xs font-bold text-[#00FF94] mb-2">ECONOMIC OUTLOOK</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold">{yearForecast.economic_forecast.global_gdp_growth}</div>
                        <div className="text-xs text-[#888]">Global GDP</div>
                      </div>
                      {yearForecast.economic_forecast.major_economies && Object.entries(yearForecast.economic_forecast.major_economies).slice(0, 3).map(([country, growth]) => (
                        <div key={country} className="text-center">
                          <div className="text-lg font-bold text-[#FFD700]">{growth}</div>
                          <div className="text-xs text-[#888]">{country}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Climate Outlook */}
                {yearForecast.climate_outlook && (
                  <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-xs font-bold text-[#FF3333] mb-2">CLIMATE OUTLOOK</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#FF3333]">{yearForecast.climate_outlook.global_temp_anomaly}</div>
                        <div className="text-xs text-[#888]">Temp Anomaly</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#FFAA00]">{yearForecast.climate_outlook.extreme_weather_frequency}</div>
                        <div className="text-xs text-[#888]">Extreme Weather</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#888]">High Risk Regions:</div>
                        <div className="text-xs">{yearForecast.climate_outlook.high_risk_regions?.join(", ")}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Predicted Events */}
                {yearForecast.predicted_events && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#00E5FF]">PREDICTED EVENTS</div>
                    {yearForecast.predicted_events.map((event, i) => (
                      <div key={i} className={`p-2 bg-[#0A0A0A] rounded border ${event.impact_level === 'critical' ? 'border-[#FF3333]' : event.impact_level === 'high' ? 'border-[#FFAA00]' : 'border-[#1F1F1F]'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{event.event}</div>
                            <div className="text-xs text-[#888]">{event.month} • {event.region} • {event.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#FF3333]">{event.probability}%</div>
                            <Badge className={event.impact_level === 'critical' ? 'bg-[#FF3333]' : event.impact_level === 'high' ? 'bg-[#FFAA00]' : 'bg-[#00E5FF]'}>
                              {event.impact_level?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {event.sectors_affected && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {event.sectors_affected.map((sector, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{sector}</Badge>
                            ))}
                          </div>
                        )}
                        {/* Add PREPARE REMEDIATION button for disaster-related events */}
                        {(event.category === "climate" || event.category === "natural_disaster" || event.category === "disaster" || event.impact_level === "critical") && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setRemediationForm({
                                disaster_type: event.event || event.category,
                                severity: event.impact_level || "high",
                                location: event.region || "Global",
                                population_affected: 50000,
                                model_preference: "ensemble"
                              });
                              setActiveView("remediation");
                            }}
                            className="mt-2 w-full bg-[#00FF94] text-black hover:bg-[#00FF94]/80 text-xs"
                          >
                            <Shield className="w-3 h-3 mr-1" />PREPARE REMEDIATION
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tech Milestones & Geopolitical Hotspots */}
                <div className="grid grid-cols-2 gap-3">
                  {yearForecast.technology_milestones && (
                    <div className="p-2 bg-[#0A0A0A] rounded">
                      <div className="text-xs font-bold text-[#9D4EDD] mb-1">TECH MILESTONES</div>
                      <ul className="text-xs text-[#888] space-y-1">
                        {yearForecast.technology_milestones.map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {yearForecast.geopolitical_hotspots && (
                    <div className="p-2 bg-[#0A0A0A] rounded">
                      <div className="text-xs font-bold text-[#FF3333] mb-1">GEOPOLITICAL HOTSPOTS</div>
                      <div className="flex flex-wrap gap-1">
                        {yearForecast.geopolitical_hotspots.map((h, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-[#FF3333]/30">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Long-Range Overview */}
          {longRangeForecasts && longRangeForecasts.timeframe_predictions && (
            <div className="space-y-4">
              {/* Mega Trends */}
              {longRangeForecasts.mega_trends && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#9D4EDD]" />
                      MEGA TRENDS 2026-2040
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {longRangeForecasts.mega_trends.map((trend, i) => (
                        <div key={i} className="p-3 bg-[#0A0A0A] rounded border border-[#9D4EDD]/30">
                          <div className="text-sm font-bold text-[#9D4EDD]">{trend.trend}</div>
                          <div className="text-xs text-[#888] mt-1">{trend.description}</div>
                          <div className="text-xs text-[#FFD700] mt-2">Peak Impact: {trend.peak_impact_year}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Solar Cycle Impacts */}
              {longRangeForecasts.solar_cycle_impacts && (
                <Card className="terminal-card border-l-2 border-l-[#FFD700]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#FFD700]" />
                      SOLAR CYCLE IMPACTS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-xs text-[#888]">CYCLE 25 PEAK</div>
                        <div className="text-lg font-bold text-[#FFD700]">{longRangeForecasts.solar_cycle_impacts.cycle_25_peak}</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-xs text-[#888]">CYCLE 26 START</div>
                        <div className="text-lg font-bold text-[#00E5FF]">{longRangeForecasts.solar_cycle_impacts.cycle_26_start}</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-xs text-[#888]">HIGH RISK YEARS</div>
                        <div className="text-sm font-bold text-[#FF3333]">{longRangeForecasts.solar_cycle_impacts.high_risk_years_for_space_events?.join(", ")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Black Swan Scenarios */}
              {longRangeForecasts.black_swan_scenarios && (
                <Card className="terminal-card border-l-2 border-l-[#FF3333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FF3333]" />
                      BLACK SWAN SCENARIOS (Low Probability, High Impact)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {longRangeForecasts.black_swan_scenarios.map((scenario, i) => (
                        <div key={i} className="p-2 bg-[#0A0A0A] rounded border border-[#FF3333]/30">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold">{scenario.scenario}</div>
                            <Badge className="bg-[#FF3333]/20 text-[#FF3333]">{scenario.probability}% chance</Badge>
                          </div>
                          <div className="text-xs text-[#888] mt-1">{scenario.impact_if_occurs}</div>
                          <div className="text-xs text-[#FFAA00]">Timeline: {scenario.timeline}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

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

      {/* INFRASTRUCTURE STATUS VIEW */}
      {activeView === "infrastructure" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#FFD700]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFD700]" />
                GLOBAL INFRASTRUCTURE STATUS
                <Badge className="bg-[#FFD700]/20 text-[#FFD700]">LIVE MONITORING</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Power grids, Telecom, Transportation, Utilities - Real-time status and disruption tracking</p>
            </CardContent>
          </Card>
          
          {infrastructureStatus && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Power Grids */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FFD700]" />
                    POWER GRIDS
                    <Badge className={infrastructureStatus.power_grids?.global_status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                      {infrastructureStatus.power_grids?.global_status?.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Capacity Utilization</span>
                      <span className="font-mono text-[#00E5FF]">{infrastructureStatus.power_grids?.capacity_utilization}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Renewable %</span>
                      <span className="font-mono text-[#00FF94]">{infrastructureStatus.power_grids?.renewable_percentage}%</span>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Current Outages:</div>
                      {infrastructureStatus.power_grids?.current_outages?.map((outage, i) => (
                        <div key={i} className="p-2 bg-[#0A0A0A] rounded mb-1 border-l-2 border-l-[#FF3333]">
                          <div className="text-sm">{outage.region}</div>
                          <div className="text-xs text-[#888]">{outage.affected_customers?.toLocaleString()} customers • {outage.cause}</div>
                          <div className="text-xs text-[#00FF94]">ETA Restore: {outage.eta_restore}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#888]">
                      Regions at Risk: {infrastructureStatus.power_grids?.regions_at_risk?.join(", ")}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Telecom */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#00E5FF]" />
                    TELECOMMUNICATIONS
                    <Badge className={infrastructureStatus.telecom?.global_status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                      {infrastructureStatus.telecom?.global_status?.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-[#888]">Network Congestion: {infrastructureStatus.telecom?.network_congestion?.join(", ")}</div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">5G EXPANDING</Badge>
                    </div>
                    {infrastructureStatus.telecom?.current_outages?.map((outage, i) => (
                      <div key={i} className="p-2 bg-[#0A0A0A] rounded border-l-2 border-l-[#FFAA00]">
                        <div className="text-sm">{outage.provider} - {outage.region}</div>
                        <div className="text-xs text-[#888]">Services: {outage.services_affected?.join(", ")}</div>
                        <div className="text-xs text-[#00FF94]">ETA: {outage.eta_restore}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Transportation */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#9D4EDD]" />
                    TRANSPORTATION
                    <Badge className={infrastructureStatus.transportation?.global_status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                      {infrastructureStatus.transportation?.global_status?.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-[#888] mb-2">Major Disruptions:</div>
                    {infrastructureStatus.transportation?.major_disruptions?.map((d, i) => (
                      <div key={i} className="p-2 bg-[#0A0A0A] rounded border-l-2 border-l-[#9D4EDD]">
                        <div className="text-sm">{d.type}</div>
                        <div className="text-xs text-[#888]">{d.location} • {d.cause || d.delay}</div>
                      </div>
                    ))}
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Traffic Indices:</div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(infrastructureStatus.transportation?.traffic_indices || {}).map(([city, index]) => (
                          <div key={city} className="text-center p-1 bg-[#0A0A0A] rounded">
                            <div className="text-xs text-[#888]">{city}</div>
                            <div className={`font-mono text-sm ${index > 80 ? 'text-[#FF3333]' : index > 70 ? 'text-[#FFAA00]' : 'text-[#00FF94]'}`}>{index}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Water Utilities */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-[#00E5FF]" />
                    WATER & UTILITIES
                    <Badge className={infrastructureStatus.water_utilities?.global_status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                      {infrastructureStatus.water_utilities?.global_status?.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Water Quality Alerts</span>
                      <Badge className="bg-[#FFAA00]/20 text-[#FFAA00]">{infrastructureStatus.water_utilities?.water_quality_alerts}</Badge>
                    </div>
                    <div className="text-xs text-[#888]">
                      Drought Warnings: {infrastructureStatus.water_utilities?.drought_warnings?.join(", ")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* SUPPLY CHAIN STATUS VIEW */}
      {activeView === "supply_chain" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#00E5FF]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ship className="w-4 h-4 text-[#00E5FF]" />
                GLOBAL SUPPLY CHAIN STATUS
                <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">REAL-TIME</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Shipping routes, Port congestion, Vendor disruptions, Inventory levels</p>
            </CardContent>
          </Card>
          
          {supplyChainStatus && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Shipping */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Ship className="w-4 h-4 text-[#00E5FF]" />
                    SHIPPING ROUTES
                    <Badge className={supplyChainStatus.shipping?.global_status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FFAA00]/20 text-[#FFAA00]"}>
                      {supplyChainStatus.shipping?.global_status?.toUpperCase().replace("_", " ")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {supplyChainStatus.shipping?.major_route_disruptions?.map((route, i) => (
                      <div key={i} className={`p-2 bg-[#0A0A0A] rounded border-l-2 ${route.status === "operational" ? "border-l-[#00FF94]" : route.status === "high_risk" ? "border-l-[#FF3333]" : "border-l-[#FFAA00]"}`}>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{route.route}</span>
                          <Badge className={route.status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94]" : route.status === "high_risk" ? "bg-[#FF3333]/20 text-[#FF3333]" : "bg-[#FFAA00]/20 text-[#FFAA00]"}>
                            {route.status?.toUpperCase().replace("_", " ")}
                          </Badge>
                        </div>
                        {route.reason && <div className="text-xs text-[#888] mt-1">{route.reason}</div>}
                        {route.impact && <div className="text-xs text-[#FF3333]">{route.impact}</div>}
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-[#1F1F1F]">
                      <span className="text-xs text-[#888]">Container Availability</span>
                      <Badge className="bg-[#FFAA00]/20 text-[#FFAA00]">{supplyChainStatus.shipping?.container_availability?.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Freight Rates Trend</span>
                      <span className="text-xs text-[#FF3333]">↑ {supplyChainStatus.shipping?.freight_rates_trend?.toUpperCase()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ports */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Factory className="w-4 h-4 text-[#9D4EDD]" />
                    PORT CONGESTION
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-[#888] mb-2">Hotspots: {supplyChainStatus.ports?.congestion_hotspots?.join(", ")}</div>
                    <div className="text-xs text-[#888] mb-2">Average Wait Times:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(supplyChainStatus.ports?.average_wait_time_days || {}).map(([port, days]) => (
                        <div key={port} className="p-2 bg-[#0A0A0A] rounded">
                          <div className="text-xs text-[#888]">{port}</div>
                          <div className={`font-mono ${days > 2 ? 'text-[#FF3333]' : days > 1 ? 'text-[#FFAA00]' : 'text-[#00FF94]'}`}>{days} days</div>
                        </div>
                      ))}
                    </div>
                    {supplyChainStatus.ports?.labor_disruptions?.length > 0 && (
                      <div className="p-2 bg-[#FF3333]/10 border border-[#FF3333] rounded mt-2">
                        <div className="text-xs text-[#FF3333]">⚠️ Labor Disruptions: {supplyChainStatus.ports?.labor_disruptions?.join(", ")}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Vendors & Raw Materials */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#FFD700]" />
                    VENDORS & RAW MATERIALS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Semiconductor Supply</span>
                      <Badge className="bg-[#FFAA00]/20 text-[#FFAA00]">{supplyChainStatus.vendors?.semiconductor_supply?.toUpperCase()}</Badge>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Raw Materials Status:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(supplyChainStatus.vendors?.raw_materials || {}).map(([material, status]) => (
                          <div key={material} className="flex justify-between items-center p-1 bg-[#0A0A0A] rounded">
                            <span className="text-xs capitalize">{material}</span>
                            <Badge className={status === "stable" ? "bg-[#00FF94]/20 text-[#00FF94] text-xs" : "bg-[#FFAA00]/20 text-[#FFAA00] text-xs"}>
                              {status?.toUpperCase().replace("_", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Factory Disruptions:</div>
                      {supplyChainStatus.vendors?.factory_disruptions?.map((d, i) => (
                        <div key={i} className="p-2 bg-[#0A0A0A] rounded mb-1 border-l-2 border-l-[#FF3333]">
                          <div className="text-sm">{d.industry} - {d.region}</div>
                          <div className="text-xs text-[#888]">{d.cause}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Inventory */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Archive className="w-4 h-4 text-[#00FF94]" />
                    INVENTORY STATUS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Global Inventory Levels</span>
                      <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{supplyChainStatus.inventory?.global_inventory_levels?.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Just-In-Time Risk</span>
                      <Badge className="bg-[#FFAA00]/20 text-[#FFAA00]">{supplyChainStatus.inventory?.just_in_time_risk?.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Stockpiling Trend</span>
                      <span className="text-xs text-[#00E5FF]">↑ {supplyChainStatus.inventory?.stockpiling_trend?.toUpperCase()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* CYBER THREAT STATUS VIEW */}
      {activeView === "cyber" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#FF3333]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF3333]" />
                CYBER THREAT LANDSCAPE
                <Badge className={cyberStatus?.threat_level === "elevated" ? "bg-[#FFAA00]/20 text-[#FFAA00]" : cyberStatus?.threat_level === "critical" ? "bg-[#FF3333]/20 text-[#FF3333]" : "bg-[#00FF94]/20 text-[#00FF94]"}>
                  {cyberStatus?.threat_level?.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Cyber attacks, Cloud outages, Critical vulnerabilities - Real-time threat intelligence</p>
            </CardContent>
          </Card>
          
          {cyberStatus && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Active Campaigns */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF3333]" />
                    ACTIVE THREAT CAMPAIGNS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cyberStatus.active_campaigns?.map((campaign, i) => (
                      <div key={i} className={`p-3 bg-[#0A0A0A] rounded border-l-2 ${campaign.severity === "critical" ? "border-l-[#FF3333]" : "border-l-[#FFAA00]"}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{campaign.name}</span>
                          <Badge className={campaign.severity === "critical" ? "bg-[#FF3333]/20 text-[#FF3333]" : "bg-[#FFAA00]/20 text-[#FFAA00]"}>
                            {campaign.severity?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#888] mt-1">Targets: {campaign.targets}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Incidents */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#FFAA00]" />
                    RECENT INCIDENTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cyberStatus.recent_incidents?.map((incident, i) => (
                      <div key={i} className="p-3 bg-[#0A0A0A] rounded border-l-2 border-l-[#FFAA00]">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{incident.type}</span>
                          <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">{incident.sector}</Badge>
                        </div>
                        <div className="text-xs text-[#888] mt-1">{incident.region}</div>
                        <div className="text-xs text-[#FF3333] mt-1">{incident.impact}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Cloud Status */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#00E5FF]" />
                    CLOUD PROVIDER STATUS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(cyberStatus.cloud_status || {}).map(([provider, status]) => (
                      <div key={provider} className="flex justify-between items-center p-2 bg-[#0A0A0A] rounded">
                        <span className="text-sm font-mono uppercase">{provider}</span>
                        <div className="flex items-center gap-2">
                          {status.incidents_24h > 0 && (
                            <Badge className={status.resolved ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                              {status.incidents_24h} incident{status.incidents_24h > 1 ? "s" : ""} {status.resolved ? "(resolved)" : ""}
                            </Badge>
                          )}
                          <div className={`w-3 h-3 rounded-full ${status.status === "operational" ? "bg-[#00FF94]" : "bg-[#FF3333]"}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Vulnerabilities */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#9D4EDD]" />
                    VULNERABILITY ALERTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-[#FF3333]/10 border border-[#FF3333] rounded">
                        <div className="font-mono text-xl text-[#FF3333]">{cyberStatus.vulnerability_alerts?.critical}</div>
                        <div className="text-xs text-[#888]">Critical</div>
                      </div>
                      <div className="text-center p-2 bg-[#FFAA00]/10 border border-[#FFAA00] rounded">
                        <div className="font-mono text-xl text-[#FFAA00]">{cyberStatus.vulnerability_alerts?.high}</div>
                        <div className="text-xs text-[#888]">High</div>
                      </div>
                      <div className="text-center p-2 bg-[#FF3333]/10 border border-[#FF3333] rounded">
                        <div className="font-mono text-xl text-[#FF3333]">{cyberStatus.vulnerability_alerts?.actively_exploited}</div>
                        <div className="text-xs text-[#888]">Exploited</div>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Recommendations:</div>
                      <div className="space-y-1">
                        {cyberStatus.recommendations?.map((rec, i) => (
                          <div key={i} className="text-xs text-[#00E5FF] flex items-start gap-1">
                            <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* AI PREDICT VIEW - Full Analysis Pipeline */}
      {activeView === "predict" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#00FF94]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#00FF94]" />
                AI DISASTER PREDICTION & ANALYSIS
                <Badge className="bg-[#00FF94]/20 text-[#00FF94]">ML + OSINT + PHYSICS</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Complete analysis pipeline: Data → Prediction → Impact → Remediation → Action</p>
            </CardContent>
          </Card>
          
          {/* Prediction Form */}
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">RUN PREDICTION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-[#888]">Disaster Type</label>
                  <select 
                    value={predictionForm.disaster_type}
                    onChange={(e) => setPredictionForm({...predictionForm, disaster_type: e.target.value})}
                    className="w-full mt-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm"
                  >
                    <optgroup label="Natural">
                      <option value="earthquake">Earthquake</option>
                      <option value="flood">Flood</option>
                      <option value="hurricane">Hurricane</option>
                      <option value="wildfire">Wildfire</option>
                      <option value="tsunami">Tsunami</option>
                      <option value="tornado">Tornado</option>
                    </optgroup>
                    <optgroup label="Infrastructure">
                      <option value="power_outage">Power Outage</option>
                      <option value="telecom_failure">Telecom Failure</option>
                    </optgroup>
                    <optgroup label="Cyber">
                      <option value="cyber_attack">Cyber Attack</option>
                      <option value="ransomware">Ransomware</option>
                    </optgroup>
                    <optgroup label="Supply Chain">
                      <option value="supply_chain_disruption">Supply Chain Disruption</option>
                      <option value="port_closure">Port Closure</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888]">Region</label>
                  <select 
                    value={predictionForm.region}
                    onChange={(e) => setPredictionForm({...predictionForm, region: e.target.value})}
                    className="w-full mt-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm"
                  >
                    <option value="global">Global</option>
                    <option value="north_america">North America</option>
                    <option value="south_america">South America</option>
                    <option value="europe">Europe</option>
                    <option value="asia_pacific">Asia Pacific</option>
                    <option value="middle_east">Middle East</option>
                    <option value="africa">Africa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888]">Timeframe</label>
                  <select 
                    value={predictionForm.timeframe_hours}
                    onChange={(e) => setPredictionForm({...predictionForm, timeframe_hours: parseInt(e.target.value)})}
                    className="w-full mt-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm"
                  >
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={runPrediction} 
                    disabled={predictionLoading}
                    className="w-full bg-[#00FF94] text-black hover:bg-[#00FF94]/80"
                  >
                    {predictionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    ANALYZE
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Analysis Results */}
          {fullAnalysis && (
            <div className="space-y-4">
              {/* Executive Summary */}
              <Card className="terminal-card border-2 border-[#00FF94]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#00FF94]" />
                    EXECUTIVE SUMMARY
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className={`font-mono text-3xl font-bold ${fullAnalysis.executive_summary?.risk_level === "critical" ? "text-[#FF3333]" : fullAnalysis.executive_summary?.risk_level === "high" ? "text-[#FFAA00]" : "text-[#00FF94]"}`}>
                        {fullAnalysis.executive_summary?.probability}
                      </div>
                      <div className="text-xs text-[#888]">PROBABILITY</div>
                    </div>
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="font-mono text-2xl font-bold text-[#00E5FF]">
                        {(fullAnalysis.executive_summary?.affected_population / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-[#888]">AFFECTED POP.</div>
                    </div>
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="font-mono text-2xl font-bold text-[#FFD700]">
                        {fullAnalysis.executive_summary?.economic_loss_estimate}
                      </div>
                      <div className="text-xs text-[#888]">ECONOMIC LOSS</div>
                    </div>
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="font-mono text-2xl font-bold text-[#FF3333]">
                        {fullAnalysis.executive_summary?.immediate_actions_required}
                      </div>
                      <div className="text-xs text-[#888]">CRITICAL ACTIONS</div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-[#FFAA00]/10 border border-[#FFAA00] rounded text-center">
                    <span className="text-xs text-[#FFAA00]">⏰ Decision Deadline: {fullAnalysis.executive_summary?.decision_deadline}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Impact Analysis */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">POPULATION IMPACT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(fullAnalysis.impact_analysis?.population_impact || {}).filter(([k]) => k !== "demographics").map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-xs text-[#888] capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-mono text-[#00E5FF]">{typeof value === "number" ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">ECONOMIC IMPACT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(fullAnalysis.impact_analysis?.economic_impact || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-xs text-[#888] capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-mono text-[#FFD700]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recommended Actions */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#9D4EDD]" />
                    RECOMMENDED ACTIONS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fullAnalysis.remediation_plan?.recommended_actions?.map((action, i) => (
                      <div key={i} className={`p-3 bg-[#0A0A0A] rounded border-l-2 ${action.priority === "critical" ? "border-l-[#FF3333]" : action.priority === "high" ? "border-l-[#FFAA00]" : "border-l-[#00E5FF]"}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{action.action}</span>
                          <Badge className={action.priority === "critical" ? "bg-[#FF3333]/20 text-[#FF3333]" : action.priority === "high" ? "bg-[#FFAA00]/20 text-[#FFAA00]" : "bg-[#00E5FF]/20 text-[#00E5FF]"}>
                            {action.priority?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-[#888]">
                          <span>⏰ {action.timeline}</span>
                          <span>👤 {action.responsible}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* HUMAN SIGNALS VIEW */}
      {activeView === "human_signals" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#00FF94]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00FF94]" />
                HUMAN SIGNALS INTELLIGENCE
                <Badge className="bg-[#00FF94]/20 text-[#00FF94]">REAL-TIME</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Population density, Mobility patterns, Emergency calls, Social signals</p>
            </CardContent>
          </Card>
          
          {humanSignals && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Population */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00FF94]" />
                    POPULATION DENSITY
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-xl text-[#00E5FF]">{(humanSignals.population?.total / 1000000000).toFixed(1)}B</div>
                        <div className="text-xs text-[#888]">Total Pop.</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-xl text-[#00FF94]">{humanSignals.population?.urban_percentage}%</div>
                        <div className="text-xs text-[#888]">Urban</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-xl text-[#FFD700]">{humanSignals.population?.rural_percentage}%</div>
                        <div className="text-xs text-[#888]">Rural</div>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Density Hotspots:</div>
                      {humanSignals.population?.density_hotspots?.slice(0, 3).map((hs, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-[#0A0A0A] rounded mb-1">
                          <span className="text-sm">{hs.location}</span>
                          <div className="text-right">
                            <div className="font-mono text-[#00E5FF]">{(hs.population / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-[#888]">{hs.density_per_km2}/km²</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Mobility */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#FFD700]" />
                    MOBILITY PATTERNS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Traffic Index</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFD700]" style={{width: `${humanSignals.mobility?.current_traffic_index}%`}}></div>
                        </div>
                        <span className="font-mono text-[#FFD700]">{humanSignals.mobility?.current_traffic_index}%</span>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Transit Status:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(humanSignals.mobility?.transit_status || {}).map(([mode, status]) => (
                          <div key={mode} className="flex justify-between items-center p-1 bg-[#0A0A0A] rounded">
                            <span className="text-xs capitalize">{mode}</span>
                            <Badge className={status === "operational" ? "bg-[#00FF94]/20 text-[#00FF94] text-xs" : "bg-[#FFAA00]/20 text-[#FFAA00] text-xs"}>
                              {status?.toUpperCase().replace("_", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Vehicle Flow (per hour):</div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Inbound</span>
                        <span className="font-mono text-[#00E5FF]">{humanSignals.mobility?.real_time_movement?.inbound_city?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Outbound</span>
                        <span className="font-mono text-[#00FF94]">{humanSignals.mobility?.real_time_movement?.outbound_city?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Emergency Calls */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#FF3333]" />
                    EMERGENCY CALLS (911)
                    <Badge className={humanSignals.emergency_calls?.volume_trend === "elevated" ? "bg-[#FFAA00]/20 text-[#FFAA00]" : "bg-[#00FF94]/20 text-[#00FF94]"}>
                      {humanSignals.emergency_calls?.volume_trend?.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-2xl text-[#FF3333]">{humanSignals.emergency_calls?.["911_volume_last_hour"]?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">Calls/Hour</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-2xl text-[#00E5FF]">{humanSignals.emergency_calls?.response_time_avg_minutes} min</div>
                        <div className="text-xs text-[#888]">Avg Response</div>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Top Call Types:</div>
                      {humanSignals.emergency_calls?.top_call_types?.slice(0, 3).map((ct, i) => (
                        <div key={i} className="flex justify-between items-center mb-1">
                          <span className="text-xs">{ct.type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
                              <div className="h-full bg-[#9D4EDD]" style={{width: `${ct.percentage}%`}}></div>
                            </div>
                            <span className="text-xs text-[#888]">{ct.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Social Signals */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#00E5FF]" />
                    SOCIAL SIGNALS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Sentiment Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00E5FF]" style={{width: `${humanSignals.social_signals?.sentiment_score}%`}}></div>
                        </div>
                        <span className="font-mono text-[#00E5FF]">{humanSignals.social_signals?.sentiment_score}/100</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Panic Indicator</span>
                      <Badge className={humanSignals.social_signals?.panic_indicator === "low" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                        {humanSignals.social_signals?.panic_indicator?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Trending Topics:</div>
                      <div className="flex flex-wrap gap-1">
                        {humanSignals.social_signals?.trending_topics?.map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Alert Mentions/Hour</span>
                      <span className="font-mono text-[#FFD700]">{humanSignals.social_signals?.alert_mentions_last_hour?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888]">Misinformation Detected</span>
                      <Badge className="bg-[#FF3333]/20 text-[#FF3333]">{humanSignals.social_signals?.misinformation_detected}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* SATELLITES/IOT SENSORS VIEW */}
      {activeView === "sensors" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#9D4EDD]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#9D4EDD]" />
                SATELLITE & IOT SENSOR NETWORK
                <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">GLOBAL COVERAGE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Weather satellites, Seismic sensors, Flood gauges, Air quality, Wildfire detection</p>
            </CardContent>
          </Card>
          
          {satelliteIotData ? (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Weather Satellites */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Satellite className="w-4 h-4 text-[#00E5FF]" />
                    WEATHER SATELLITES
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {satelliteIotData.satellites?.weather?.map((sat, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-[#0A0A0A] rounded">
                        <div>
                          <div className="text-sm font-mono">{sat.name}</div>
                          <div className="text-xs text-[#888]">{sat.coverage}</div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-[#00FF94]/20 text-[#00FF94] text-xs">{sat.status?.toUpperCase()}</Badge>
                          <div className="text-xs text-[#888]">{sat.last_update}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Seismic Network */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#FF3333]" />
                    SEISMIC NETWORK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#00E5FF]">{satelliteIotData.iot_sensors?.seismic_network?.total_stations?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">Stations</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#00FF94]">{satelliteIotData.iot_sensors?.seismic_network?.stations_reporting?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">Reporting</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#FFD700]">{satelliteIotData.iot_sensors?.seismic_network?.coverage_countries}</div>
                        <div className="text-xs text-[#888]">Countries</div>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Recent Detections:</div>
                      {satelliteIotData.iot_sensors?.seismic_network?.recent_detections?.map((det, i) => (
                        <div key={i} className="p-2 bg-[#0A0A0A] rounded mb-1 border-l-2 border-l-[#FF3333]">
                          <div className="flex justify-between">
                            <span className="text-sm">M{det.magnitude} - {det.location}</span>
                            <span className="text-xs text-[#888]">{det.time}</span>
                          </div>
                          <div className="text-xs text-[#888]">Depth: {det.depth_km} km</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Flood Gauges */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-[#00E5FF]" />
                    FLOOD GAUGE NETWORK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#00E5FF]">{satelliteIotData.iot_sensors?.flood_gauges?.total_gauges?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">Gauges</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#FFAA00]">{satelliteIotData.iot_sensors?.flood_gauges?.above_flood_stage}</div>
                        <div className="text-xs text-[#888]">Above Flood</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#00FF94]">{satelliteIotData.iot_sensors?.flood_gauges?.gauges_reporting?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">Reporting</div>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Critical Alerts:</div>
                      {satelliteIotData.iot_sensors?.flood_gauges?.critical_alerts?.map((alert, i) => (
                        <div key={i} className={`p-2 bg-[#0A0A0A] rounded mb-1 border-l-2 ${alert.status?.includes("Moderate") ? "border-l-[#FFAA00]" : alert.status?.includes("Minor") ? "border-l-[#FFD700]" : "border-l-[#00E5FF]"}`}>
                          <div className="text-sm">{alert.river}</div>
                          <div className="text-xs text-[#888]">{alert.location}</div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs">Stage: {alert.stage_ft || alert.stage_m}</span>
                            <Badge className="text-xs">{alert.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Air Quality */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wind className="w-4 h-4 text-[#FFD700]" />
                    AIR QUALITY MONITORS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#00E5FF]">{satelliteIotData.iot_sensors?.air_quality?.total_monitors?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">Monitors</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#FFAA00]">{satelliteIotData.iot_sensors?.air_quality?.unhealthy_zones}</div>
                        <div className="text-xs text-[#888]">Unhealthy</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded">
                        <div className="font-mono text-lg text-[#FF3333]">{satelliteIotData.iot_sensors?.air_quality?.hazardous_zones}</div>
                        <div className="text-xs text-[#888]">Hazardous</div>
                      </div>
                    </div>
                    <div className="border-t border-[#1F1F1F] pt-2">
                      <div className="text-xs text-[#888] mb-2">Worst AQI Cities:</div>
                      {satelliteIotData.iot_sensors?.air_quality?.worst_aqi?.map((city, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-[#0A0A0A] rounded mb-1">
                          <span className="text-sm">{city.city}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono ${city.aqi > 300 ? "text-[#9D4EDD]" : city.aqi > 200 ? "text-[#FF3333]" : "text-[#FFAA00]"}`}>{city.aqi}</span>
                            <Badge className={city.category === "Hazardous" ? "bg-[#9D4EDD]/20 text-[#9D4EDD] text-xs" : city.category === "Very Unhealthy" ? "bg-[#FF3333]/20 text-[#FF3333] text-xs" : "bg-[#FFAA00]/20 text-[#FFAA00] text-xs"}>
                              {city.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* AUTOMATED PLAYBOOKS VIEW */}
      {activeView === "playbooks" && (
        <div className="space-y-4">
          <Card className="terminal-card border-l-4 border-l-[#FFD700]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FFD700]" />
                AUTOMATED RESPONSE PLAYBOOKS
                <Badge className="bg-[#FFD700]/20 text-[#FFD700]">DECISION AUTOMATION</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#888]">Pre-defined action sequences, Pre-approved actions, Decision trees</p>
            </CardContent>
          </Card>
          
          {playbooks && (
            <div className="space-y-4">
              {/* Automation Status */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00FF94]" />
                    AUTOMATION STATUS
                    <Badge className={playbooks.automation_status?.enabled ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FF3333]/20 text-[#FF3333]"}>
                      {playbooks.automation_status?.enabled ? "ENABLED" : "DISABLED"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-[#0A0A0A] rounded text-center">
                      <div className="font-mono text-2xl text-[#00E5FF]">{playbooks.automation_status?.actions_taken_24h}</div>
                      <div className="text-xs text-[#888]">Actions (24h)</div>
                    </div>
                    <div className="p-3 bg-[#0A0A0A] rounded text-center">
                      <div className="font-mono text-2xl text-[#00FF94]">{playbooks.automation_status?.actions_prevented_disasters}</div>
                      <div className="text-xs text-[#888]">Disasters Prevented</div>
                    </div>
                    <div className="p-3 bg-[#0A0A0A] rounded">
                      <div className="text-xs text-[#888] mb-1">Last Auto Action:</div>
                      <div className="text-xs text-[#FFD700]">{playbooks.automation_status?.last_automated_action}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Available Playbooks */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">AVAILABLE PLAYBOOKS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {playbooks.available_playbooks?.map((pb, i) => (
                      <div key={i} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#9D4EDD] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-mono text-[#00E5FF]">{pb.id}</div>
                            <div className="text-sm font-medium">{pb.name}</div>
                          </div>
                          <Badge className={pb.status === "active" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#888]/20 text-[#888]"}>
                            {pb.status?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#888] mb-2">{pb.description}</div>
                        <div className="text-xs text-[#888]">Last activated: {pb.last_activated}</div>
                        <div className="mt-2 border-t border-[#1F1F1F] pt-2">
                          <div className="text-xs text-[#888] mb-1">Phases:</div>
                          <div className="flex flex-wrap gap-1">
                            {pb.phases?.map((phase, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{phase.phase}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Pre-Approved Actions */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00FF94]" />
                    PRE-APPROVED ACTIONS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {playbooks.pre_approved_actions?.actions?.map((action, i) => (
                      <div key={i} className="p-3 bg-[#0A0A0A] rounded border-l-2 border-l-[#00FF94]">
                        <div className="flex justify-between items-start">
                          <div className="text-sm">{action.action}</div>
                          <Badge className={action.automated ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#888]/20 text-[#888]"}>
                            {action.automated ? "AUTO" : "MANUAL"}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#888] mt-1">Authority: {action.authority}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {action.conditions?.map((cond, j) => (
                            <Badge key={j} variant="outline" className="text-xs bg-[#1F1F1F]">{cond}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Decision Trees */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Network className="w-4 h-4 text-[#9D4EDD]" />
                    DECISION TREES
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(playbooks.decision_trees || {}).map(([type, tree]) => (
                      <div key={type} className="p-3 bg-[#0A0A0A] rounded">
                        <div className="text-sm font-medium capitalize mb-2 text-[#00E5FF]">{type}</div>
                        <div className="space-y-1">
                          {Object.entries(tree).map(([condition, action], i) => (
                            <div key={i} className="text-xs">
                              <span className="text-[#FFD700]">{condition}</span>
                              <span className="text-[#888]"> → </span>
                              <span className="text-[#EDEDED]">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* JUDGMENTAL FORECASTING VIEW - Proprietary Multi-Factor Disaster Prediction */}
      {activeView === "judgmental" && (
        <div className="space-y-4">
          {/* Header Card */}
          <Card className="terminal-card border-l-4 border-l-[#9D4EDD]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#9D4EDD]" />
                JUDGMENTAL DISASTER FORECASTING
                <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">PROPRIETARY ENGINE</Badge>
              </CardTitle>
              <CardDescription className="text-xs text-[#888]">
                Multi-factor analysis with historical frequency, geographical risk, seasonal patterns, and climate indicators
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Forecast Form */}
          <Card className="terminal-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">DISASTER TYPE</label>
                  <select
                    value={judgmentalForm.disaster_type}
                    onChange={(e) => setJudgmentalForm({...judgmentalForm, disaster_type: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm"
                  >
                    <option value="earthquake">Earthquake</option>
                    <option value="hurricane">Hurricane/Typhoon</option>
                    <option value="flood">Flood</option>
                    <option value="wildfire">Wildfire</option>
                    <option value="tornado">Tornado</option>
                    <option value="tsunami">Tsunami</option>
                    <option value="volcano">Volcanic Eruption</option>
                    <option value="drought">Drought</option>
                    <option value="heatwave">Heat Wave</option>
                    <option value="winter_storm">Winter Storm</option>
                    <option value="pandemic">Pandemic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">LOCATION</label>
                  <Input
                    value={judgmentalForm.location}
                    onChange={(e) => setJudgmentalForm({...judgmentalForm, location: e.target.value})}
                    placeholder="City, Region or Country"
                    className="bg-[#0A0A0A] border-[#1F1F1F]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">TIMEFRAME</label>
                  <select
                    value={judgmentalForm.timeframe}
                    onChange={(e) => setJudgmentalForm({...judgmentalForm, timeframe: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028-2030">2028-2030</option>
                    <option value="2030-2040">2030-2040</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">SEVERITY</label>
                  <select
                    value={judgmentalForm.severity}
                    onChange={(e) => setJudgmentalForm({...judgmentalForm, severity: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm"
                  >
                    <option value="any">Any Severity</option>
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="catastrophic">Catastrophic</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateJudgmentalDisasterForecast}
                    disabled={loadingJudgmental}
                    className="w-full bg-[#9D4EDD] text-white hover:bg-[#9D4EDD]/80"
                  >
                    {loadingJudgmental ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                    GENERATE FORECAST
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Results */}
          {judgmentalForecast && (
            <div className="space-y-4">
              {/* Probability Card */}
              <Card className="terminal-card border-l-4 border-l-[#FF3333]">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="text-3xl font-bold text-[#FF3333]">{judgmentalForecast.probability}%</div>
                      <div className="text-xs text-[#888]">PROBABILITY</div>
                    </div>
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="text-xl font-bold text-[#00E5FF]">{judgmentalForecast.confidence?.level}</div>
                      <div className="text-xs text-[#888]">CONFIDENCE</div>
                    </div>
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="text-xl font-bold text-[#FFD700]">{judgmentalForecast.disaster_type?.toUpperCase()}</div>
                      <div className="text-xs text-[#888]">DISASTER TYPE</div>
                    </div>
                    <div className="text-center p-3 bg-[#0A0A0A] rounded">
                      <div className="text-xl font-bold text-[#00FF94]">{judgmentalForecast.location}</div>
                      <div className="text-xs text-[#888]">LOCATION</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Factor Analysis */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">FACTOR ANALYSIS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(judgmentalForecast.factors || {}).map(([factor, data]) => (
                      <div key={factor} className="p-3 bg-[#0A0A0A] rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#00E5FF]">{factor.replace(/_/g, ' ').toUpperCase()}</span>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-[#888]">Weight: {((data.weight || 0) * 100).toFixed(0)}%</div>
                            <Badge className={data.score > 0.6 ? "bg-[#FF3333]" : data.score > 0.4 ? "bg-[#FFAA00]" : "bg-[#00FF94]"}>
                              {((data.score || 0) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-[#1F1F1F] rounded h-2">
                          <div 
                            className={`h-2 rounded ${data.score > 0.6 ? "bg-[#FF3333]" : data.score > 0.4 ? "bg-[#FFAA00]" : "bg-[#00FF94]"}`}
                            style={{ width: `${(data.score || 0) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-[#888] mt-1">{data.evidence}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              {judgmentalForecast.risk_assessment && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">RISK ASSESSMENT BREAKDOWN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold">{judgmentalForecast.risk_assessment.base_rate}%</div>
                        <div className="text-xs text-[#888]">Base Rate</div>
                      </div>
                      <div className="p-3 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#FFD700]">{judgmentalForecast.risk_assessment.regional_multiplier}x</div>
                        <div className="text-xs text-[#888]">Regional Multiplier</div>
                      </div>
                      <div className="p-3 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#00E5FF]">{judgmentalForecast.risk_assessment.seasonal_factor}x</div>
                        <div className="text-xs text-[#888]">Seasonal Factor</div>
                      </div>
                      <div className="p-3 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#FF3333]">{judgmentalForecast.risk_assessment.adjusted_probability}%</div>
                        <div className="text-xs text-[#888]">Final Probability</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {judgmentalForecast.recommendations && judgmentalForecast.recommendations.length > 0 && (
                <Card className="terminal-card border-l-2 border-l-[#00FF94]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#00FF94]" />
                      RECOMMENDATIONS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {judgmentalForecast.recommendations.map((rec, i) => (
                        <div key={i} className={`p-3 bg-[#0A0A0A] rounded border-l-2 ${rec.priority === "CRITICAL" ? "border-l-[#FF3333]" : rec.priority === "HIGH" ? "border-l-[#FFAA00]" : "border-l-[#00FF94]"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold">{rec.action}</span>
                            <Badge className={rec.priority === "CRITICAL" ? "bg-[#FF3333]" : rec.priority === "HIGH" ? "bg-[#FFAA00]" : "bg-[#00FF94]"}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-[#888]">{rec.details}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Link to Remediation */}
              <Button 
                onClick={() => {
                  setRemediationForm({
                    disaster_type: judgmentalForecast.disaster_type,
                    severity: judgmentalForecast.severity_filter === "any" ? "high" : judgmentalForecast.severity_filter,
                    location: judgmentalForecast.location,
                    population_affected: 50000,
                    model_preference: "ensemble"
                  });
                  setActiveView("remediation");
                }}
                className="w-full bg-[#00FF94] text-black hover:bg-[#00FF94]/80"
              >
                <Shield className="w-4 h-4 mr-2" />
                GENERATE FULL REMEDIATION PLAN
              </Button>
            </div>
          )}

          {/* Methodology Info */}
          <Card className="terminal-card">
            <CardContent className="p-4">
              <div className="text-xs text-[#888] text-center">
                <span className="text-[#9D4EDD] font-bold">Plutus Judgmental Disaster Forecasting Engine v1.0</span>
                <br />
                Multi-factor analysis: Historical frequency • Geographical risk • Seasonal indicators • Climate patterns • Early warning signals
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REMEDIATION VIEW - AI-Powered Disaster Response Planning */}
      {activeView === "remediation" && (
        <div className="space-y-4">
          {/* Configuration Card */}
          <Card className="terminal-card border-l-4 border-l-[#00FF94]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00FF94]" />
                AI-POWERED REMEDIATION PLANNING
                <Badge className="bg-[#00FF94]/20 text-[#00FF94]">MULTI-LLM</Badge>
              </CardTitle>
              <CardDescription className="text-xs text-[#888]">
                Generate comprehensive disaster response plans using GPT-4o, Claude, and Gemini ensemble
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[#888] block mb-1">DISASTER TYPE</label>
                  <select 
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded p-2 text-sm"
                    value={remediationForm.disaster_type}
                    onChange={(e) => setRemediationForm(prev => ({...prev, disaster_type: e.target.value}))}
                  >
                    {(remediationTypes?.disaster_types || []).map(type => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1">SEVERITY</label>
                  <select 
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded p-2 text-sm"
                    value={remediationForm.severity}
                    onChange={(e) => setRemediationForm(prev => ({...prev, severity: e.target.value}))}
                  >
                    {(remediationTypes?.severity_levels || ["critical", "high", "medium", "low"]).map(level => (
                      <option key={level} value={level}>{level.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1">LOCATION</label>
                  <Input 
                    placeholder="City, Region or Country"
                    className="bg-[#0A0A0A] border-[#1F1F1F]"
                    value={remediationForm.location}
                    onChange={(e) => setRemediationForm(prev => ({...prev, location: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1">POPULATION</label>
                  <Input 
                    type="number"
                    placeholder="10000"
                    className="bg-[#0A0A0A] border-[#1F1F1F]"
                    value={remediationForm.population_affected}
                    onChange={(e) => setRemediationForm(prev => ({...prev, population_affected: parseInt(e.target.value) || 10000}))}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1">AI MODEL</label>
                  <select 
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded p-2 text-sm"
                    value={remediationForm.model_preference}
                    onChange={(e) => setRemediationForm(prev => ({...prev, model_preference: e.target.value}))}
                  >
                    <option value="ensemble">ENSEMBLE (All 3)</option>
                    <option value="openai">GPT-4o (OpenAI)</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini (Google)</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={generateRemediationPlan} 
                disabled={isGenerating || !remediationForm.location}
                className="bg-[#00FF94] text-black hover:bg-[#00FF94]/80"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />GENERATING PLAN...</>
                ) : (
                  <><Shield className="w-4 h-4 mr-2" />GENERATE REMEDIATION PLAN</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Plan Display */}
          {remediationPlan && (
            <div className="space-y-4">
              {/* Plan Header */}
              <Card className="terminal-card border-l-4 border-l-[#FFD700]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#FFD700]" />
                        {remediationPlan.disaster_info?.type?.replace(/_/g, ' ').toUpperCase()} REMEDIATION PLAN
                      </h3>
                      <p className="text-xs text-[#888]">
                        Location: {remediationPlan.disaster_info?.location} | 
                        Severity: {remediationPlan.disaster_info?.severity?.toUpperCase()} | 
                        Population: {remediationPlan.disaster_info?.population_affected?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#00FF94]">{remediationPlan.risk_mitigation_score || 75}%</div>
                      <div className="text-xs text-[#888]">RISK MITIGATION</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-2 bg-[#0A0A0A] rounded">
                      <div className="text-lg font-bold text-[#00FF94]">{remediationPlan.lives_potentially_saved?.toLocaleString() || "200+"}</div>
                      <div className="text-xs text-[#888]">LIVES SAVED</div>
                    </div>
                    <div className="text-center p-2 bg-[#0A0A0A] rounded">
                      <div className="text-lg font-bold text-[#FFD700]">{remediationPlan.property_value_protected || "$5M"}</div>
                      <div className="text-xs text-[#888]">PROPERTY PROTECTED</div>
                    </div>
                    <div className="text-center p-2 bg-[#0A0A0A] rounded">
                      <div className="text-lg font-bold text-[#00E5FF]">{remediationPlan.model_used || "ensemble"}</div>
                      <div className="text-xs text-[#888]">AI MODEL USED</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Immediate Actions */}
              <Card className="terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FF3333]" />
                    IMMEDIATE ACTIONS
                    <Badge className="bg-[#FF3333]/20 text-[#FF3333]">CRITICAL</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(remediationPlan.immediate_actions || []).map((action, i) => (
                      <div key={i} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{action.action}</div>
                            <div className="text-xs text-[#888] mt-1">
                              Agency: {action.responsible_agency?.replace(/_/g, ' ')} | Timeline: {action.timeline}
                            </div>
                          </div>
                          <Badge className={action.priority === "critical" ? "bg-[#FF3333]" : action.priority === "high" ? "bg-[#FFAA00]" : "bg-[#00E5FF]"}>
                            {action.priority?.toUpperCase()}
                          </Badge>
                        </div>
                        {action.lives_impacted && (
                          <div className="text-xs text-[#00FF94] mt-1">Lives impacted: {action.lives_impacted?.toLocaleString()}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Evacuation Plan */}
              {remediationPlan.evacuation_plan && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FFAA00]" />
                      EVACUATION PLAN
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-2 bg-[#0A0A0A] rounded">
                        <div className="text-lg font-bold text-[#FF3333]">{remediationPlan.evacuation_plan.total_population_at_risk?.toLocaleString()}</div>
                        <div className="text-xs text-[#888]">AT RISK</div>
                      </div>
                      <div className="text-center p-2 bg-[#0A0A0A] rounded">
                        <div className="text-lg font-bold text-[#FFAA00]">{remediationPlan.evacuation_plan.estimated_evacuation_time}</div>
                        <div className="text-xs text-[#888]">EVAC TIME</div>
                      </div>
                      <div className="text-center p-2 bg-[#0A0A0A] rounded">
                        <div className="text-lg font-bold text-[#00E5FF]">{remediationPlan.evacuation_plan.zones?.length || 3}</div>
                        <div className="text-xs text-[#888]">ZONES</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(remediationPlan.evacuation_plan.zones || []).map((zone, i) => (
                        <div key={i} className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#00E5FF]">Zone {zone.zone_id}</span>
                            <span className="text-xs text-[#888] ml-2">Pop: {zone.population?.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-right">
                            <div className="text-[#888]">{zone.evacuation_route}</div>
                            <div className="text-[#00FF94]">→ {zone.shelter_location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {remediationPlan.evacuation_plan.transportation_needs && (
                      <div className="mt-3 p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                        <div className="text-xs text-[#888] mb-1">TRANSPORTATION NEEDS:</div>
                        <div className="flex gap-4 text-xs">
                          <span>🚌 Buses: {remediationPlan.evacuation_plan.transportation_needs.buses}</span>
                          <span>🚑 Emergency: {remediationPlan.evacuation_plan.transportation_needs.emergency_vehicles}</span>
                          <span>🚁 Helicopters: {remediationPlan.evacuation_plan.transportation_needs.helicopters}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Resource Allocation */}
              {remediationPlan.resource_allocation && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00E5FF]" />
                      RESOURCE ALLOCATION
                      <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">{remediationPlan.resource_allocation.estimated_cost}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      {remediationPlan.resource_allocation.personnel && Object.entries(remediationPlan.resource_allocation.personnel).map(([role, count]) => (
                        <div key={role} className="p-2 bg-[#0A0A0A] rounded text-center">
                          <div className="text-lg font-bold text-[#00FF94]">{count}</div>
                          <div className="text-xs text-[#888]">{role.toUpperCase()}</div>
                        </div>
                      ))}
                    </div>
                    {remediationPlan.resource_allocation.supplies && (
                      <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                        <div className="text-xs text-[#888] mb-1">SUPPLIES NEEDED:</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <span>💧 Water: {remediationPlan.resource_allocation.supplies.water_gallons?.toLocaleString()} gal</span>
                          <span>🍞 Food: {remediationPlan.resource_allocation.supplies.food_rations?.toLocaleString()} rations</span>
                          <span>🏥 Med Kits: {remediationPlan.resource_allocation.supplies.medical_kits}</span>
                          <span>🛏️ Blankets: {remediationPlan.resource_allocation.supplies.blankets?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Medical Response */}
              {remediationPlan.medical_response && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#FF3333]" />
                      MEDICAL RESPONSE
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#FF3333]">{remediationPlan.medical_response.triage_stations}</div>
                        <div className="text-xs text-[#888]">TRIAGE STATIONS</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#FFAA00]">{remediationPlan.medical_response.hospital_capacity_needed}</div>
                        <div className="text-xs text-[#888]">HOSPITAL BEDS</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#00E5FF]">{remediationPlan.medical_response.ambulances_required}</div>
                        <div className="text-xs text-[#888]">AMBULANCES</div>
                      </div>
                      <div className="p-2 bg-[#0A0A0A] rounded text-center">
                        <div className="text-lg font-bold text-[#00FF94]">{remediationPlan.medical_response.medical_personnel}</div>
                        <div className="text-xs text-[#888]">MEDICAL STAFF</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Post-Disaster Recovery */}
              {remediationPlan.post_disaster_recovery && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#9D4EDD]" />
                      POST-DISASTER RECOVERY PHASES
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(remediationPlan.post_disaster_recovery || []).map((phase, i) => (
                        <div key={i} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#9D4EDD]">{phase.phase}</span>
                            <Badge variant="outline" className="text-xs">{phase.timeline}</Badge>
                          </div>
                          <div className="text-xs text-[#888]">{(phase.actions || []).join(" • ")}</div>
                          {phase.estimated_cost && (
                            <div className="text-xs text-[#FFD700] mt-1">Est. Cost: {phase.estimated_cost}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Communication Plan */}
              {remediationPlan.communication_plan && (
                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#00E5FF]" />
                      COMMUNICATION PLAN
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-[#888] mb-2">ALERT CHANNELS:</div>
                        <div className="flex flex-wrap gap-1">
                          {(remediationPlan.communication_plan.alert_channels || []).map((ch, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{ch}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#888] mb-2">LANGUAGES:</div>
                        <div className="flex flex-wrap gap-1">
                          {(remediationPlan.communication_plan.languages || []).map((lang, i) => (
                            <Badge key={i} className="bg-[#1F1F1F] text-xs">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {remediationPlan.communication_plan.message_templates && (
                      <div className="mt-3 space-y-2">
                        <div className="p-2 bg-[#0A0A0A] rounded border-l-2 border-l-[#FF3333]">
                          <div className="text-xs text-[#888]">INITIAL ALERT:</div>
                          <div className="text-xs mt-1">{remediationPlan.communication_plan.message_templates.initial}</div>
                        </div>
                        <div className="p-2 bg-[#0A0A0A] rounded border-l-2 border-l-[#FFAA00]">
                          <div className="text-xs text-[#888]">UPDATE:</div>
                          <div className="text-xs mt-1">{remediationPlan.communication_plan.message_templates.update}</div>
                        </div>
                        <div className="p-2 bg-[#0A0A0A] rounded border-l-2 border-l-[#00FF94]">
                          <div className="text-xs text-[#888]">ALL CLEAR:</div>
                          <div className="text-xs mt-1">{remediationPlan.communication_plan.message_templates.all_clear}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
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
          )}
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
          )}
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
          )}
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

// Space Hazards Component - Real-time NASA & NOAA Space Weather
const SpaceHazards = ({ getHeaders }) => {
  const [hazards, setHazards] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [neos, setNeos] = useState(null);
  const [debris, setDebris] = useState(null);
  const [impacts, setImpacts] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hazardsRes, forecastRes, neosRes, debrisRes, impactsRes] = await Promise.all([
        axios.get(`${API}/space/current`),
        axios.get(`${API}/space/forecast?days=7`),
        axios.get(`${API}/space/neo`),
        axios.get(`${API}/space/debris`),
        axios.get(`${API}/space/impacts`),
      ]);
      setHazards(hazardsRes.data);
      setForecast(forecastRes.data);
      setNeos(neosRes.data);
      setDebris(debrisRes.data);
      setImpacts(impactsRes.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load space data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateAIAnalysis = async () => {
    setGeneratingAnalysis(true);
    try {
      const res = await axios.get(`${API}/space/ai-analysis`, { headers: getHeaders() });
      setAiAnalysis(res.data);
      toast.success("AI analysis generated!");
    } catch (e) {
      toast.error("Failed to generate analysis");
    }
    setGeneratingAnalysis(false);
  };

  const views = [
    { id: "overview", label: "OVERVIEW", icon: Home },
    { id: "neo", label: "ASTEROIDS", icon: Star },
    { id: "weather", label: "SOLAR STORMS", icon: Activity },
    { id: "debris", label: "SPACE DEBRIS", icon: AlertTriangle },
    { id: "impacts", label: "SECTOR IMPACTS", icon: Globe },
    { id: "forecast", label: "7-DAY FORECAST", icon: Clock },
  ];

  const getAlertColor = (level) => {
    switch(level) {
      case "critical": return "bg-[#FF3333]";
      case "high": return "bg-[#FF3333]/80";
      case "elevated": return "bg-[#FFAA00]";
      case "moderate": return "bg-[#FFD700]";
      default: return "bg-[#00FF94]";
    }
  };

  return (
    <div className="space-y-6" data-testid="space-hazards-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-[#FFD700]" />
            SPACE_HAZARDS_MONITOR
          </h2>
          <p className="text-xs text-[#888] mt-1">Real-time data from NASA, NOAA SWPC, ESA • Protecting airlines, satellites & infrastructure</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs border-[#FFD700]/30 text-[#FFD700]">
            <span className="w-2 h-2 bg-[#FFD700] rounded-full mr-1 animate-pulse" />LIVE
          </Badge>
          <Button onClick={loadData} variant="outline" size="sm" className="btn-secondary">
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
            className={activeView === v.id ? "bg-[#FFD700] text-black" : "border-[#1F1F1F] text-[#888]"}
          >
            <v.icon className="w-3 h-3 mr-1" />
            {v.label}
          </Button>
        ))}
      </div>

      {/* OVERVIEW VIEW */}
      {activeView === "overview" && hazards && (
        <div className="space-y-4">
          {/* Risk Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="terminal-card border-l-2 border-l-[#FFD700]">
              <CardContent className="p-3 text-center">
                <div className="font-mono text-2xl font-bold text-[#FFD700]">{hazards.risk_score || 0}%</div>
                <div className="text-xs text-[#888]">SPACE RISK</div>
                <Badge className={getAlertColor(hazards.overall_risk)}>{hazards.overall_risk?.toUpperCase()}</Badge>
              </CardContent>
            </Card>
            <Card className="terminal-card border-l-2 border-l-[#FF3333]">
              <CardContent className="p-3 text-center">
                <div className="font-mono text-2xl font-bold text-[#FF3333]">Kp {hazards.space_weather?.kp_index || 0}</div>
                <div className="text-xs text-[#888]">GEOMAGNETIC</div>
                <Badge className={getAlertColor(hazards.space_weather?.alert_level)}>{hazards.space_weather?.storm_level || "Quiet"}</Badge>
              </CardContent>
            </Card>
            <Card className="terminal-card border-l-2 border-l-[#9D4EDD]">
              <CardContent className="p-3 text-center">
                <div className="font-mono text-2xl font-bold text-[#9D4EDD]">{neos?.total || 0}</div>
                <div className="text-xs text-[#888]">NEOs TRACKED</div>
                <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">{neos?.potentially_hazardous || 0} HAZARDOUS</Badge>
              </CardContent>
            </Card>
            <Card className="terminal-card border-l-2 border-l-[#00E5FF]">
              <CardContent className="p-3 text-center">
                <div className="font-mono text-2xl font-bold text-[#00E5FF]">{debris?.total_tracked || 0}</div>
                <div className="text-xs text-[#888]">DEBRIS REENTRIES</div>
                <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">UPCOMING</Badge>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Button & Results */}
          <Card className="terminal-card border-l-4 border-l-[#00FF94]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#00FF94]" />
                  AI SPACE WEATHER ANALYSIS
                </CardTitle>
                <Button onClick={generateAIAnalysis} disabled={generatingAnalysis} size="sm" className="bg-[#00FF94] text-black hover:bg-[#00FF94]/80">
                  {generatingAnalysis ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  ANALYZE
                </Button>
              </div>
            </CardHeader>
            {aiAnalysis && (
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="text-sm font-bold text-[#00FF94] mb-1">Executive Summary</div>
                    <p className="text-xs text-[#888]">{aiAnalysis.executive_summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-[#0A0A0A] rounded">
                      <div className="text-xs text-[#888]">Risk Assessment</div>
                      <Badge className={getAlertColor(aiAnalysis.risk_assessment)}>{aiAnalysis.risk_assessment?.toUpperCase()}</Badge>
                    </div>
                    <div className="p-2 bg-[#0A0A0A] rounded">
                      <div className="text-xs text-[#888]">7-Day Outlook</div>
                      <div className="text-xs text-[#EDEDED]">{aiAnalysis.forecast_outlook}</div>
                    </div>
                  </div>
                  {aiAnalysis.sector_alerts && (
                    <div className="space-y-1">
                      {aiAnalysis.sector_alerts.map((alert, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                          <span className="text-xs font-bold">{alert.sector}</span>
                          <Badge className={alert.alert_level === "red" ? "bg-[#FF3333]" : alert.alert_level === "orange" ? "bg-[#FFAA00]" : "bg-[#00FF94]"}>
                            {alert.alert_level?.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiAnalysis.astrology_correlation && (
                    <div className="p-2 bg-[#0A0A0A] rounded border-l-2 border-l-[#9D4EDD]">
                      <div className="text-xs text-[#9D4EDD] font-bold">Astrology Correlation</div>
                      <div className="text-xs text-[#888]">{aiAnalysis.astrology_correlation}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Sector Impacts Summary */}
          {impacts && impacts.sector_impacts && (
            <Card className="terminal-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SECTOR IMPACT STATUS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(impacts.sector_impacts).map(([sector, data]) => (
                    <div key={sector} className="p-2 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{sector.replace(/_/g, ' ').toUpperCase()}</span>
                        <Badge className={getAlertColor(data.risk)}>{data.risk?.toUpperCase()}</Badge>
                      </div>
                      <div className="text-xs text-[#888] mt-1 truncate">{data.recommendation}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ASTEROIDS (NEO) VIEW */}
      {activeView === "neo" && neos && (
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-[#9D4EDD]" />
                NEAR EARTH OBJECTS
                <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">NASA NEO API</Badge>
              </CardTitle>
              <CardDescription className="text-xs text-[#888]">
                Tracking {neos.total} asteroids/comets • {neos.potentially_hazardous} potentially hazardous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {(neos.objects || []).map((neo, i) => (
                  <div key={i} className={`p-3 bg-[#0A0A0A] rounded border ${neo.is_hazardous ? 'border-[#FF3333]' : 'border-[#1F1F1F]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">{neo.name}</div>
                        <div className="text-xs text-[#888]">Approach: {neo.date}</div>
                      </div>
                      <div className="text-right">
                        {neo.is_hazardous && <Badge className="bg-[#FF3333] mb-1">HAZARDOUS</Badge>}
                        <div className="text-xs text-[#00E5FF]">{(neo.miss_distance_km / 1000000).toFixed(2)}M km</div>
                        <div className="text-xs text-[#888]">{(neo.velocity_kph / 1000).toFixed(1)}k km/h</div>
                      </div>
                    </div>
                    <div className="text-xs text-[#888] mt-1">Diameter: ~{neo.diameter_km?.toFixed(3)} km</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {/* SOLAR STORMS VIEW */}
      {activeView === "weather" && impacts && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#FFAA00]">Kp {impacts.current_kp_index || 0}</div>
                <div className="text-xs text-[#888]">CURRENT Kp INDEX</div>
                <Progress value={(impacts.current_kp_index || 0) * 11} className="mt-2" />
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-[#FF3333]">{impacts.max_kp_24h || 0}</div>
                <div className="text-xs text-[#888]">MAX Kp (24H)</div>
              </CardContent>
            </Card>
            <Card className="terminal-card">
              <CardContent className="p-4 text-center">
                <Badge className={getAlertColor(impacts.alert_level)} style={{fontSize: '16px', padding: '8px 16px'}}>
                  {impacts.storm_level || "Quiet"}
                </Badge>
                <div className="text-xs text-[#888] mt-2">STORM LEVEL</div>
              </CardContent>
            </Card>
          </div>

          <Card className="terminal-card">
            <CardHeader>
              <CardTitle className="text-sm">GEOMAGNETIC STORM SCALE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {level: "G5", kp: "9", desc: "Extreme - Widespread power blackouts, satellite damage", color: "#FF0000"},
                  {level: "G4", kp: "8-9", desc: "Severe - Power grid problems, GPS errors hours", color: "#FF3333"},
                  {level: "G3", kp: "7", desc: "Strong - Power grid fluctuations, GPS issues", color: "#FF6600"},
                  {level: "G2", kp: "6", desc: "Moderate - High-latitude power systems affected", color: "#FFAA00"},
                  {level: "G1", kp: "5", desc: "Minor - Weak power grid fluctuations", color: "#FFD700"},
                ].map((scale, i) => (
                  <div key={i} className={`p-2 rounded flex items-center justify-between ${impacts.current_kp_index >= parseInt(scale.kp) ? 'bg-[#0A0A0A] border border-[#1F1F1F]' : 'opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      <Badge style={{backgroundColor: scale.color}}>{scale.level}</Badge>
                      <span className="text-xs">Kp {scale.kp}</span>
                    </div>
                    <span className="text-xs text-[#888]">{scale.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {/* SPACE DEBRIS VIEW */}
      {activeView === "debris" && debris && (
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FFAA00]" />
                UPCOMING SPACE DEBRIS REENTRIES
              </CardTitle>
              <CardDescription className="text-xs text-[#888]">
                Tracking satellite and rocket debris returning to Earth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(debris.upcoming_reentries || []).map((item, i) => (
                  <div key={i} className={`p-3 bg-[#0A0A0A] rounded border ${item.risk_level === 'high' ? 'border-[#FF3333]' : item.risk_level === 'medium' ? 'border-[#FFAA00]' : 'border-[#1F1F1F]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">{item.object}</div>
                        <div className="text-xs text-[#888]">Type: {item.type?.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-[#00E5FF]">Est. Reentry: {new Date(item.estimated_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={item.risk_level === 'high' ? 'bg-[#FF3333]' : item.risk_level === 'medium' ? 'bg-[#FFAA00]' : 'bg-[#00FF94]'}>
                          {item.risk_level?.toUpperCase()} RISK
                        </Badge>
                        <div className="text-xs text-[#888] mt-1">{item.debris_mass_kg?.toLocaleString()} kg</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {/* SECTOR IMPACTS VIEW */}
      {activeView === "impacts" && impacts && impacts.sector_impacts && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(impacts.sector_impacts).map(([sector, data]) => (
              <Card key={sector} className={`terminal-card border-l-4 ${data.risk === 'high' ? 'border-l-[#FF3333]' : data.risk === 'moderate' ? 'border-l-[#FFAA00]' : 'border-l-[#00FF94]'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{sector.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                    <Badge className={getAlertColor(data.risk)}>{data.risk?.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-[#888]"><strong>Recommendation:</strong> {data.recommendation}</div>
                    {data.affected_routes && data.affected_routes.length > 0 && (
                      <div className="text-xs"><strong className="text-[#FFAA00]">Affected:</strong> {data.affected_routes.join(", ")}</div>
                    )}
                    {data.affected_regions && data.affected_regions.length > 0 && (
                      <div className="text-xs"><strong className="text-[#FFAA00]">Regions:</strong> {data.affected_regions.join(", ")}</div>
                    )}
                    {data.accuracy_degradation && (
                      <div className="text-xs"><strong className="text-[#FF3333]">Accuracy degradation:</strong> {data.accuracy_degradation}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 7-DAY FORECAST VIEW */}
      {activeView === "forecast" && forecast && (
        <div className="space-y-4">
          <Card className="terminal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00E5FF]" />
                7-DAY SPACE WEATHER FORECAST
              </CardTitle>
              <CardDescription className="text-xs text-[#888]">
                Peak activity expected: {forecast.peak_activity_date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(forecast.daily_forecasts || []).map((day, i) => (
                  <div key={i} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold">{new Date(day.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</div>
                        <Badge className={day.kp_forecast >= 6 ? 'bg-[#FF3333]' : day.kp_forecast >= 4 ? 'bg-[#FFAA00]' : 'bg-[#00FF94]'}>
                          Kp {day.kp_forecast}
                        </Badge>
                        {day.hazardous_neo && <Badge className="bg-[#9D4EDD]">NEO ALERT</Badge>}
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-[#888]">Storm: {day.storm_probability}%</div>
                        <div className={day.aviation_impact === "significant" ? "text-[#FF3333]" : "text-[#888]"}>Aviation: {day.aviation_impact}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-[#888]">
                      <span>Aurora: {day.aurora_visibility}</span>
                      <span>NEOs: {day.neo_approaches}</span>
                      <span>Satellites: {day.satellite_risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {forecast.recommendations && forecast.recommendations.length > 0 && (
            <Card className="terminal-card border-l-4 border-l-[#FFAA00]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SECTOR RECOMMENDATIONS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forecast.recommendations.map((rec, i) => (
                    <div key={i} className="p-2 bg-[#0A0A0A] rounded flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold">{rec.sector}</div>
                        <div className="text-xs text-[#888]">{rec.action}</div>
                      </div>
                      <Badge className={rec.urgency === 'high' ? 'bg-[#FF3333]' : 'bg-[#FFAA00]'}>{rec.urgency?.toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-[#444] text-center">
        Data sources: NASA NEO API • NOAA Space Weather Prediction Center • ESA Space Debris Office • Updated every 15 minutes
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

  // Full prediction categories with comprehensive coverage
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
  const [selectedCountry, setSelectedCountry] = useState(null);  // For M&A drill-down
  
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
          )}
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
          )}
        </div>
      )}

      {/* M&A Predictions */}
      {activeView === "ma" && maPredictions && (
        <div className="space-y-4">
          {/* Header Stats */}
          <Card className="terminal-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-[#0A0A0A] rounded">
                  <div className="text-2xl font-bold text-[#9D4EDD]">{maPredictions.all_deals_count || maPredictions.predictions?.length || 0}</div>
                  <div className="text-xs text-[#888]">TOTAL DEALS</div>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded">
                  <div className="text-xl font-bold text-[#00FF94]">{maPredictions.total_predicted_value}</div>
                  <div className="text-xs text-[#888]">PIPELINE VALUE</div>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded">
                  <div className="text-lg font-bold text-[#00E5FF]">{maPredictions.market_conditions?.ma_activity_level?.toUpperCase()}</div>
                  <div className="text-xs text-[#888]">ACTIVITY LEVEL</div>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded">
                  <div className="text-lg font-bold text-[#FFD700]">{maPredictions.osint_signals || 0}</div>
                  <div className="text-xs text-[#888]">OSINT SIGNALS</div>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded">
                  <div className="text-xs font-bold text-[#888]">{(maPredictions.sources || []).slice(0, 3).join(", ")}</div>
                  <div className="text-xs text-[#888]">DATA SOURCES</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Country-wise View */}
          {maPredictions.country_wise_deals && Object.keys(maPredictions.country_wise_deals).length > 0 && (
            <Card className="terminal-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00E5FF]" />
                    COUNTRY-WISE M&A ACTIVITY
                  </CardTitle>
                  {selectedCountry && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedCountry(null)}
                      className="text-xs border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444]/20"
                    >
                      ✕ Clear Filter
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.entries(maPredictions.country_wise_deals || {}).map(([country, deals]) => (
                    <div 
                      key={country} 
                      onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
                      className={`p-3 bg-[#0A0A0A] rounded border transition-all cursor-pointer ${
                        selectedCountry === country 
                          ? 'border-[#00FF94] bg-[#00FF94]/10 ring-1 ring-[#00FF94]' 
                          : 'border-[#1F1F1F] hover:border-[#9D4EDD]'
                      }`}
                    >
                      <div className="text-sm font-bold text-[#EDEDED]">{country}</div>
                      <div className={`text-xl font-bold ${selectedCountry === country ? 'text-[#00FF94]' : 'text-[#9D4EDD]'}`}>
                        {deals.length}
                      </div>
                      <div className="text-xs text-[#888]">deals</div>
                      {selectedCountry === country && (
                        <div className="text-xs text-[#00FF94] mt-1">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedCountry && (
                  <div className="mt-4 p-3 bg-[#00FF94]/10 border border-[#00FF94] rounded">
                    <p className="text-sm text-[#00FF94]">
                      Showing {maPredictions.country_wise_deals[selectedCountry]?.length || 0} deals from <strong>{selectedCountry}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deal List - Now filtered by selected country */}
          <Card className="terminal-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9D4EDD]" />
                  {selectedCountry ? `${selectedCountry} M&A DEALS` : 'M&A DEAL PREDICTIONS'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedCountry && (
                    <Badge className="bg-[#00FF94]/20 text-[#00FF94]">
                      {maPredictions.country_wise_deals[selectedCountry]?.length || 0} deals
                    </Badge>
                  )}
                  <Badge className="bg-[#9D4EDD]/20 text-[#9D4EDD]">{maPredictions.total_predicted_value}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {(selectedCountry 
                  ? (maPredictions.country_wise_deals[selectedCountry] || [])
                  : (maPredictions.predictions || [])
                ).map((deal, i) => (
                  <div key={i} className="p-4 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#9D4EDD] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-[#EDEDED]">{deal.acquirer}</span>
                        <ChevronRight className="w-4 h-4 text-[#888]" />
                        <span className="text-lg font-bold text-[#9D4EDD]">{deal.target}</span>
                        {deal.country && (
                          <Badge variant="outline" className="text-xs border-[#00E5FF] text-[#00E5FF]">{deal.country}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={deal.confidence === 'high' ? 'bg-[#00FF94]/20 text-[#00FF94]' : deal.confidence === 'medium' ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-[#888]/20 text-[#888]'}>
                          {deal.probability}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#888] flex-wrap">
                      <span className="bg-[#1F1F1F] px-2 py-1 rounded">{deal.sector}</span>
                      <span className="text-[#FFD700] font-bold">{deal.deal_value}</span>
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

          {/* Country-wise IPO View */}
          {ipoTiming.country_wise_ipos && Object.keys(ipoTiming.country_wise_ipos).length > 0 && (
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00FF94]" />
                  COUNTRY-WISE IPO PIPELINE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.entries(ipoTiming.country_wise_ipos || {}).map(([country, ipos]) => (
                    <div key={country} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#00FF94] transition-colors cursor-pointer">
                      <div className="text-sm font-bold text-[#EDEDED]">{country}</div>
                      <div className="text-xl font-bold text-[#00FF94]">{ipos.length}</div>
                      <div className="text-xs text-[#888]">IPOs</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming IPOs */}
          <Card className="terminal-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">UPCOMING IPO PIPELINE ({ipoTiming.all_ipos_count || ipoTiming.upcoming_ipos?.length || 0} Total)</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#00FF94]/20 text-[#00FF94]">{ipoTiming.total_pipeline_value}</Badge>
                  <Badge variant="outline" className="text-xs">{(ipoTiming.sources || []).slice(0, 2).join(", ")}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {(ipoTiming.upcoming_ipos || []).map((ipo, i) => (
                  <div key={i} className="p-4 bg-[#0A0A0A] rounded border border-[#1F1F1F] hover:border-[#00FF94] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-[#EDEDED]">{ipo.company}</span>
                        <Badge className="bg-[#1F1F1F] text-[#888]">{ipo.sector}</Badge>
                        {ipo.country && (
                          <Badge variant="outline" className="text-xs border-[#00E5FF] text-[#00E5FF]">{ipo.country}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={ipo.recommendation === 'SUBSCRIBE' ? 'bg-[#00FF94] text-black' : ipo.recommendation === 'WATCH' ? 'bg-[#FFD700] text-black' : 'bg-[#888] text-black'}>
                          {ipo.recommendation}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#888] flex-wrap">
                      <span className="text-[#FFD700] font-bold">{ipo.expected_valuation}</span>
                      <span>{ipo.expected_date}</span>
                      <span className="text-[#00FF94]">Est. Pop: {ipo.first_day_pop_estimate}</span>
                      <Badge className={`text-xs ${ipo.investor_interest === 'high' ? 'bg-[#00FF94]/20 text-[#00FF94]' : ipo.investor_interest === 'medium' ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-[#888]/20 text-[#888]'}`}>
                        {ipo.investor_interest?.toUpperCase()} INTEREST
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
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
          )}
        </div>
      )}

      {loading && !dashboardData && !maPredictions && !ipoTiming && !sectorRotation && (
        <div className="text-center py-8 text-[#888]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading investment analysis...
        </div>
      )}
    </div>
  );
};

// Pricing & Subscription Component
const Pricing = ({ user, setShowAuth, getHeaders }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    axios.get(`${API}/payments/plans`).then(res => {
      const planList = Object.entries(res.data.plans || {}).map(([key, plan]) => ({
        id: key,
        ...plan
      }));
      setPlans(planList);
    }).catch(console.error);
  }, []);

  const handleSubscribe = async (planId) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    setLoading(true);
    setSelectedPlan(planId);
    
    try {
      const res = await axios.post(`${API}/payments/checkout`, {
        plan: planId,
        origin_url: window.location.origin
      }, getHeaders());
      
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      toast.error("Failed to start checkout");
      console.error(e);
    }
    setLoading(false);
    setSelectedPlan(null);
  };

  const planColors = {
    basic: { primary: "#00E5FF", gradient: "from-[#00E5FF]/20 to-[#00E5FF]/5" },
    professional: { primary: "#FFD700", gradient: "from-[#FFD700]/20 to-[#FFD700]/5" },
    enterprise: { primary: "#00FF94", gradient: "from-[#00FF94]/20 to-[#00FF94]/5" }
  };

  return (
    <div className="space-y-8" data-testid="pricing-view">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
          <CreditCard className="w-8 h-8 text-[#00E5FF]" />
          SUBSCRIPTION_PLANS
        </h1>
        <p className="text-[#888] max-w-2xl mx-auto">
          Choose the plan that fits your forecasting needs. All plans include access to our AI ensemble engine.
        </p>
      </div>

      {user?.plan && (
        <Card className="terminal-card border-[#00FF94]/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-[#00FF94]" />
              <span className="text-sm">Current Plan: <strong className="text-[#00FF94] uppercase">{user.plan}</strong></span>
            </div>
            <Badge className="bg-[#00FF94]/20 text-[#00FF94]">ACTIVE</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const colors = planColors[plan.id] || planColors.basic;
          const isCurrentPlan = user?.plan === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`terminal-card relative overflow-hidden transition-all hover:scale-105 ${
                isCurrentPlan ? 'border-[#00FF94]' : ''
              }`}
            >
              {plan.id === "professional" && (
                <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-xs px-3 py-1 font-bold">
                  POPULAR
                </div>
              )}
              
              <div className={`absolute inset-0 bg-gradient-to-b ${colors.gradient} pointer-events-none`} />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-lg" style={{ color: colors.primary }}>
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#EDEDED]">${plan.price.toLocaleString()}</span>
                  <span className="text-sm text-[#888]">/year</span>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-4">
                <ul className="space-y-3">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                      <span className="text-[#EDEDED]">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full mt-4 ${isCurrentPlan ? 'bg-[#1F1F1F] text-[#888]' : ''}`}
                  style={{ 
                    backgroundColor: isCurrentPlan ? undefined : colors.primary,
                    color: isCurrentPlan ? undefined : '#000'
                  }}
                  disabled={loading || isCurrentPlan}
                  onClick={() => handleSubscribe(plan.id)}
                  data-testid={`subscribe-${plan.id}`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00E5FF]" />
            FEATURES_COMPARISON
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F1F1F]">
                  <th className="text-left py-3 px-2 text-[#888]">Feature</th>
                  <th className="text-center py-3 px-2 text-[#00E5FF]">Basic</th>
                  <th className="text-center py-3 px-2 text-[#FFD700]">Professional</th>
                  <th className="text-center py-3 px-2 text-[#00FF94]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Monthly Forecasts", basic: "100", pro: "Unlimited", enterprise: "Unlimited" },
                  { feature: "OSINT Access", basic: "Basic", pro: "Full", enterprise: "Full + Custom" },
                  { feature: "API Access", basic: "-", pro: "✓", enterprise: "✓" },
                  { feature: "Support", basic: "Email", pro: "Priority", enterprise: "Dedicated" },
                  { feature: "Disaster Alerts", basic: "Basic", pro: "Real-time", enterprise: "Custom" },
                  { feature: "IB Suite", basic: "-", pro: "✓", enterprise: "✓" },
                  { feature: "Multi-Agent Forecasts", basic: "-", pro: "✓", enterprise: "✓" },
                  { feature: "Custom Integrations", basic: "-", pro: "-", enterprise: "✓" },
                  { feature: "White-label", basic: "-", pro: "-", enterprise: "✓" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#1F1F1F]">
                    <td className="py-3 px-2 text-[#EDEDED]">{row.feature}</td>
                    <td className="text-center py-3 px-2">
                      {row.basic === "✓" ? <Check className="w-4 h-4 text-[#00FF94] mx-auto" /> : 
                       row.basic === "-" ? <X className="w-4 h-4 text-[#FF4444] mx-auto" /> : 
                       <span className="text-[#888]">{row.basic}</span>}
                    </td>
                    <td className="text-center py-3 px-2">
                      {row.pro === "✓" ? <Check className="w-4 h-4 text-[#00FF94] mx-auto" /> : 
                       row.pro === "-" ? <X className="w-4 h-4 text-[#FF4444] mx-auto" /> : 
                       <span className="text-[#FFD700]">{row.pro}</span>}
                    </td>
                    <td className="text-center py-3 px-2">
                      {row.enterprise === "✓" ? <Check className="w-4 h-4 text-[#00FF94] mx-auto" /> : 
                       row.enterprise === "-" ? <X className="w-4 h-4 text-[#FF4444] mx-auto" /> : 
                       <span className="text-[#00FF94]">{row.enterprise}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm">FREQUENTLY_ASKED</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {[
            { q: "Can I upgrade my plan?", a: "Yes, you can upgrade anytime. You'll be prorated for the remaining period." },
            { q: "Is there a free trial?", a: "All new users get a 5-minute free trial to explore all features. After the trial, a subscription is required to continue." },
            { q: "What payment methods?", a: "We accept all major credit cards via Stripe secure checkout." },
            { q: "Can I cancel anytime?", a: "Yes, cancel anytime. Access continues until the end of your billing period." },
          ].map((faq, i) => (
            <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded">
              <h4 className="text-sm font-medium text-[#00E5FF] mb-1">{faq.q}</h4>
              <p className="text-xs text-[#888]">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// OSINT Search Component with Live Pipeline
const OSINTSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [activeStream, setActiveStream] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    axios.get(`${API}/osint/stats`).then((res) => setStats(res.data)).catch(console.error);
    loadPipelineData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadPipelineData, 30000); // Refresh every 30s
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadPipelineData = async () => {
    try {
      const res = await axios.get(`${API}/osint/live-stream`);
      setPipelineData(res.data);
    } catch (e) {
      console.error("Pipeline data fetch failed", e);
    }
  };

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

  const streamCategories = [
    { id: "all", label: "All Streams", icon: Globe, color: "#00E5FF" },
    { id: "gdelt", label: "GDELT News", icon: FileText, color: "#FFD700" },
    { id: "earthquakes", label: "Earthquakes", icon: Activity, color: "#FF4444" },
    { id: "weather", label: "Weather", icon: Cloud, color: "#9D4EDD" },
    { id: "financial", label: "Financial", icon: TrendingUp, color: "#00FF94" },
  ];

  const getStreamData = () => {
    if (!pipelineData?.streams) return [];
    if (activeStream === "all") {
      return Object.values(pipelineData.streams).flat().slice(0, 20);
    }
    return pipelineData.streams[activeStream]?.slice(0, 20) || [];
  };

  return (
    <div className="space-y-6" data-testid="osint-view">
      {/* Pipeline Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#00E5FF]" />
            LIVE_OSINT_PIPELINE
          </h2>
          <p className="text-sm text-[#888] mt-1">
            Real-time intelligence from {stats?.total_sources?.toLocaleString() || "1,000,000+"} sources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${autoRefresh ? 'bg-[#00FF94]/20 text-[#00FF94]' : 'bg-[#1F1F1F] text-[#888]'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${autoRefresh ? 'bg-[#00FF94] animate-pulse' : 'bg-[#888]'}`} />
            {autoRefresh ? 'LIVE' : 'PAUSED'}
          </Badge>
          <Button 
            size="sm" 
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Start'} Live Feed
          </Button>
          <Button size="sm" variant="outline" onClick={loadPipelineData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      {pipelineData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Card className="terminal-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-[#00E5FF] font-mono">
                {pipelineData.stats?.total_events_processed?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-[#888]">Events Processed</div>
            </CardContent>
          </Card>
          <Card className="terminal-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-[#FFD700] font-mono">
                {pipelineData.stats?.sources_active || 6}
              </div>
              <div className="text-xs text-[#888]">Active Sources</div>
            </CardContent>
          </Card>
          <Card className="terminal-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-[#00FF94] font-mono">
                {pipelineData.streams?.gdelt?.length || 0}
              </div>
              <div className="text-xs text-[#888]">GDELT Articles</div>
            </CardContent>
          </Card>
          <Card className="terminal-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-[#FF4444] font-mono">
                {pipelineData.streams?.earthquakes?.length || 0}
              </div>
              <div className="text-xs text-[#888]">Seismic Events</div>
            </CardContent>
          </Card>
          <Card className="terminal-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-[#9D4EDD] font-mono">
                {pipelineData.streams?.weather_alerts?.length || 0}
              </div>
              <div className="text-xs text-[#888]">Weather Alerts</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stream Selector */}
      <div className="flex gap-2 flex-wrap">
        {streamCategories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={activeStream === cat.id ? "default" : "outline"}
            onClick={() => setActiveStream(cat.id)}
            style={{ 
              backgroundColor: activeStream === cat.id ? cat.color : undefined,
              color: activeStream === cat.id ? '#000' : cat.color,
              borderColor: cat.color
            }}
          >
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Live Stream Feed */}
      <Card className="terminal-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00E5FF]" />
              LIVE_FEED
            </CardTitle>
            <span className="text-xs text-[#888]">
              Last update: {pipelineData?.stats?.last_fetch ? new Date(pipelineData.stats.last_fetch).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {getStreamData().length > 0 ? getStreamData().map((item, i) => (
                <div key={i} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#333] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.source || item.type || 'OSINT'}
                        </Badge>
                        {item.category && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-[#00E5FF]/20 text-[#00E5FF]">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#EDEDED]">
                        {item.title || item.place || item.headline || item.event || 'Event data'}
                      </p>
                      {item.magnitude && (
                        <span className="text-lg font-bold text-[#FF4444]">M{item.magnitude}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#666] whitespace-nowrap">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00E5FF] hover:underline mt-1 inline-flex items-center gap-1">
                      View Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )) : (
                <div className="text-center text-[#888] py-8">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No live data yet. Click "Start Live Feed" to begin.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-5 h-5 text-[#00E5FF]" />
            OSINT_SEARCH
          </CardTitle>
          <CardDescription className="text-[#888]">
            Search across all aggregated intelligence sources
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

  // Usage & Quotas State
  const [usageData, setUsageData] = useState(null);
  
  // White-Label State
  const [whiteLabelStatus, setWhiteLabelStatus] = useState(null);
  const [whiteLabelRequests, setWhiteLabelRequests] = useState({ pending: [], active: [] });
  const [whiteLabelSettings, setWhiteLabelSettings] = useState({
    logo_url: "",
    company_name: "",
    primary_color: "#00E5FF",
    secondary_color: "#00FF94",
    accent_color: "#FFD700",
    hide_plutus_branding: false
  });
  const [whiteLabelPrice, setWhiteLabelPrice] = useState(10000);
  
  // Support Tickets State
  const [myTickets, setMyTickets] = useState([]);
  const [allTickets, setAllTickets] = useState({ tickets: [], stats: {} });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({ title: "", description: "", category: "other", priority: "medium" });
  const [ticketReply, setTicketReply] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  
  // Advertisements State
  const [ads, setAds] = useState([]);
  const [adAnalytics, setAdAnalytics] = useState(null);
  const [showNewAdModal, setShowNewAdModal] = useState(false);
  const [newAd, setNewAd] = useState({
    title: "", type: "banner", placement: "homepage_banner",
    media_url: "", click_url: "", duration: 30, skip_after: 5,
    budget: 0, cpm: 5.0, start_date: "", end_date: ""
  });

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
    if (activeSection === "usage") loadUsageData();
    if (activeSection === "white-label") loadWhiteLabelStatus();
    if (activeSection === "support") loadMyTickets();
    if (activeSection === "all-tickets" && isOwner) loadAllTickets();
    if (activeSection === "white-label-admin" && isOwner) loadWhiteLabelRequests();
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

  // Usage & Quotas Functions
  const loadUsageData = async () => {
    try {
      const res = await axios.get(`${API}/usage/quotas`, { headers: getHeaders() });
      setUsageData(res.data);
    } catch (e) {
      console.error("Error loading usage data:", e);
    }
  };

  // White-Label Functions
  const loadWhiteLabelStatus = async () => {
    try {
      const res = await axios.get(`${API}/white-label/status`, { headers: getHeaders() });
      setWhiteLabelStatus(res.data);
      if (res.data.settings) {
        setWhiteLabelSettings(res.data.settings);
      }
    } catch (e) {
      console.error("Error loading white-label status:", e);
    }
  };

  const loadWhiteLabelRequests = async () => {
    try {
      const res = await axios.get(`${API}/white-label/requests`, { headers: getHeaders() });
      setWhiteLabelRequests(res.data);
      setWhiteLabelPrice(res.data.current_price || 10000);
    } catch (e) {
      console.error("Error loading white-label requests:", e);
    }
  };

  const requestWhiteLabel = async () => {
    try {
      const res = await axios.post(`${API}/white-label/request`, {}, { headers: getHeaders() });
      toast.success(res.data.message);
      loadWhiteLabelStatus();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to request white-label");
    }
  };

  const activateWhiteLabel = async (orgId, paymentRef) => {
    try {
      await axios.post(`${API}/white-label/activate/${orgId}?payment_reference=${paymentRef}`, {}, { headers: getHeaders() });
      toast.success("White-label activated!");
      loadWhiteLabelRequests();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to activate");
    }
  };

  const updateWhiteLabelSettings = async () => {
    try {
      await axios.put(`${API}/white-label/settings`, whiteLabelSettings, { headers: getHeaders() });
      toast.success("Settings updated!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update settings");
    }
  };

  const updateWhiteLabelPrice = async (newPrice) => {
    try {
      await axios.put(`${API}/white-label/price`, { new_price: newPrice }, { headers: getHeaders() });
      toast.success("Price updated!");
      setWhiteLabelPrice(newPrice);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update price");
    }
  };

  // Support Ticket Functions
  const loadMyTickets = async () => {
    try {
      const res = await axios.get(`${API}/support/tickets`, { headers: getHeaders() });
      setMyTickets(res.data.tickets || []);
    } catch (e) {
      console.error("Error loading tickets:", e);
    }
  };

  const loadAllTickets = async () => {
    try {
      const res = await axios.get(`${API}/support/tickets/all`, { headers: getHeaders() });
      setAllTickets(res.data);
    } catch (e) {
      console.error("Error loading all tickets:", e);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error("Title and description required");
      return;
    }
    try {
      const res = await axios.post(`${API}/support/tickets`, newTicket, { headers: getHeaders() });
      toast.success(`Ticket #${res.data.ticket_id} created!`);
      setShowNewTicketModal(false);
      setNewTicket({ title: "", description: "", category: "other", priority: "medium" });
      loadMyTickets();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create ticket");
    }
  };

  const loadTicketDetails = async (ticketId) => {
    try {
      const res = await axios.get(`${API}/support/tickets/${ticketId}`, { headers: getHeaders() });
      setSelectedTicket(res.data.ticket);
    } catch (e) {
      toast.error("Failed to load ticket");
    }
  };

  const sendTicketReply = async () => {
    if (!ticketReply.trim() || !selectedTicket) return;
    try {
      await axios.post(`${API}/support/tickets/${selectedTicket.id}/message`, { content: ticketReply }, { headers: getHeaders() });
      toast.success("Reply sent!");
      setTicketReply("");
      loadTicketDetails(selectedTicket.id);
      loadMyTickets();
      if (isOwner) loadAllTickets();
    } catch (e) {
      toast.error("Failed to send reply");
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.put(`${API}/support/tickets/${ticketId}/status`, { status: newStatus }, { headers: getHeaders() });
      toast.success("Status updated!");
      if (selectedTicket?.id === ticketId) loadTicketDetails(ticketId);
      loadAllTickets();
    } catch (e) {
      toast.error("Failed to update status");
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
    { id: "usage", label: "Usage & Quotas", icon: BarChart3, color: "#00E5FF" },
    { id: "white-label", label: "White-Label", icon: Sparkles, color: "#FFD700", badge: "PRO" },
    { id: "support", label: "Support Tickets", icon: MessageSquare, color: "#9D4EDD" },
    ...(isOwner ? [{ id: "organizations", label: "Organizations", icon: Building2, color: "#FFD700" }] : []),
    ...(isOwner ? [{ id: "all-tickets", label: "All Tickets", icon: AlertTriangle, color: "#FF6B6B" }] : []),
    ...(isOwner ? [{ id: "white-label-admin", label: "White-Label Admin", icon: Star, color: "#FFD700" }] : []),
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
              {activeSection === "usage" && "Monitor your usage and plan limits"}
              {activeSection === "white-label" && "Customize branding for your organization"}
              {activeSection === "support" && "View and manage your support tickets"}
              {activeSection === "all-tickets" && "Manage all customer support tickets"}
              {activeSection === "white-label-admin" && "Manage white-label requests and activations"}
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

            {/* USAGE & QUOTAS SECTION */}
            {activeSection === "usage" && (
              <div className="space-y-6">
                {usageData ? (
                  <>
                    <Card className="terminal-card border-[#00E5FF]/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-[#888]">Current Plan</div>
                            <div className="text-2xl font-bold text-[#00E5FF] uppercase">{usageData.plan}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[#888]">Billing Period</div>
                            <div className="text-xs text-[#666]">
                              {new Date(usageData.billing_period?.start).toLocaleDateString()} - {new Date(usageData.billing_period?.end).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {usageData.quotas?.map((quota, i) => (
                        <Card key={i} className={`terminal-card ${quota.status === "exceeded" ? "border-[#FF4444]" : quota.status === "warning" ? "border-[#FFD700]" : ""}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-[#888]">{quota.name}</span>
                              <Badge className={`text-xs ${
                                quota.status === "unlimited" ? "bg-[#00FF94]/20 text-[#00FF94]" :
                                quota.status === "exceeded" ? "bg-[#FF4444]/20 text-[#FF4444]" :
                                quota.status === "warning" ? "bg-[#FFD700]/20 text-[#FFD700]" :
                                "bg-[#00E5FF]/20 text-[#00E5FF]"
                              }`}>
                                {quota.status === "unlimited" ? "UNLIMITED" : `${quota.percentage}%`}
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold text-[#EDEDED]">
                              {quota.used} <span className="text-sm text-[#888]">/ {quota.limit}</span>
                            </div>
                            {quota.status !== "unlimited" && (
                              <Progress value={quota.percentage} className={`h-2 mt-2 ${quota.status === "exceeded" ? "[&>div]:bg-[#FF4444]" : quota.status === "warning" ? "[&>div]:bg-[#FFD700]" : ""}`} />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="terminal-card">
                      <CardHeader>
                        <CardTitle className="text-sm">Plan Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[#888] mb-4">Need more capacity? Upgrade your plan.</p>
                        <Button onClick={() => setActiveTab("pricing")} className="btn-primary">
                          <CreditCard className="w-4 h-4 mr-2" />
                          View Pricing Plans
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8 text-[#888]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading usage data...
                  </div>
                )}
              </div>
            )}

            {/* WHITE-LABEL SECTION (Enterprise Customers) */}
            {activeSection === "white-label" && (
              <div className="space-y-6">
                <Card className="terminal-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#FFD700]" />
                        White-Label Status
                      </CardTitle>
                      <Badge className={`${
                        whiteLabelStatus?.status === "active" ? "bg-[#00FF94]/20 text-[#00FF94]" :
                        whiteLabelStatus?.status === "pending" ? "bg-[#FFD700]/20 text-[#FFD700]" :
                        "bg-[#888]/20 text-[#888]"
                      }`}>
                        {whiteLabelStatus?.status?.toUpperCase() || "INACTIVE"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {whiteLabelStatus?.status === "inactive" && (
                      <div className="text-center py-6">
                        <Sparkles className="w-12 h-12 text-[#FFD700] mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">Customize Your Brand</h3>
                        <p className="text-sm text-[#888] mb-4 max-w-md mx-auto">
                          White-label allows you to rebrand Plutus Predict with your company logo, colors, and name. 
                          Present it as your own forecasting platform to your team.
                        </p>
                        <div className="text-3xl font-bold text-[#FFD700] mb-4">${whiteLabelStatus?.price?.toLocaleString() || "10,000"}</div>
                        <p className="text-xs text-[#888] mb-4">One-time activation fee</p>
                        <Button onClick={requestWhiteLabel} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/80">
                          Request White-Label
                        </Button>
                      </div>
                    )}
                    {whiteLabelStatus?.status === "pending" && (
                      <div className="text-center py-6">
                        <AlertTriangle className="w-12 h-12 text-[#FFD700] mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">Payment Pending</h3>
                        <p className="text-sm text-[#888] mb-4">
                          Your white-label request is pending. Please complete payment of ${whiteLabelStatus?.price?.toLocaleString()}.
                          Contact support for payment details. Once payment is confirmed, our team will activate your white-label.
                        </p>
                        <p className="text-xs text-[#666]">
                          Requested: {new Date(whiteLabelStatus?.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {whiteLabelStatus?.status === "active" && (
                      <div className="space-y-6">
                        <div className="p-3 bg-[#00FF94]/10 border border-[#00FF94]/30 rounded text-center">
                          <Check className="w-5 h-5 text-[#00FF94] mx-auto mb-1" />
                          <span className="text-sm text-[#00FF94]">White-Label Active</span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-[#888] block mb-1">Company Name</label>
                              <Input 
                                value={whiteLabelSettings.company_name} 
                                onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, company_name: e.target.value})}
                                placeholder="Your Company Name"
                                className="terminal-input"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-[#888] block mb-1">Logo URL</label>
                              <Input 
                                value={whiteLabelSettings.logo_url} 
                                onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, logo_url: e.target.value})}
                                placeholder="https://yourcompany.com/logo.png"
                                className="terminal-input"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs text-[#888] block mb-1">Primary Color</label>
                              <div className="flex gap-2">
                                <Input 
                                  type="color"
                                  value={whiteLabelSettings.primary_color} 
                                  onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, primary_color: e.target.value})}
                                  className="w-12 h-10 p-1 bg-transparent border-[#1F1F1F]"
                                />
                                <Input 
                                  value={whiteLabelSettings.primary_color} 
                                  onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, primary_color: e.target.value})}
                                  className="terminal-input flex-1"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-[#888] block mb-1">Secondary Color</label>
                              <div className="flex gap-2">
                                <Input 
                                  type="color"
                                  value={whiteLabelSettings.secondary_color} 
                                  onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, secondary_color: e.target.value})}
                                  className="w-12 h-10 p-1 bg-transparent border-[#1F1F1F]"
                                />
                                <Input 
                                  value={whiteLabelSettings.secondary_color} 
                                  onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, secondary_color: e.target.value})}
                                  className="terminal-input flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded">
                          <span className="text-sm">Hide Plutus Predict Branding</span>
                          <input 
                            type="checkbox"
                            checked={whiteLabelSettings.hide_plutus_branding}
                            onChange={(e) => setWhiteLabelSettings({...whiteLabelSettings, hide_plutus_branding: e.target.checked})}
                            className="w-4 h-4"
                          />
                        </div>
                        
                        <Button onClick={updateWhiteLabelSettings} className="btn-primary w-full">
                          Save White-Label Settings
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SUPPORT TICKETS SECTION */}
            {activeSection === "support" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <Badge className="bg-[#00E5FF]/20 text-[#00E5FF]">{myTickets.length} Total</Badge>
                    <Badge className="bg-[#FFD700]/20 text-[#FFD700]">{myTickets.filter(t => t.status === "open").length} Open</Badge>
                  </div>
                  <Button onClick={() => setShowNewTicketModal(true)} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                  </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <Card className="terminal-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">My Tickets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2">
                            {myTickets.length > 0 ? myTickets.map((ticket) => (
                              <button
                                key={ticket.id}
                                onClick={() => loadTicketDetails(ticket.id)}
                                className={`w-full text-left p-3 rounded border transition-all ${
                                  selectedTicket?.id === ticket.id 
                                    ? "border-[#00E5FF] bg-[#00E5FF]/10" 
                                    : "border-[#1F1F1F] hover:border-[#333]"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-mono text-[#888]">#{ticket.id}</span>
                                  <Badge className={`text-[10px] ${
                                    ticket.status === "open" ? "bg-[#FFD700]/20 text-[#FFD700]" :
                                    ticket.status === "resolved" ? "bg-[#00FF94]/20 text-[#00FF94]" :
                                    ticket.status === "in_progress" ? "bg-[#00E5FF]/20 text-[#00E5FF]" :
                                    "bg-[#888]/20 text-[#888]"
                                  }`}>{ticket.status}</Badge>
                                </div>
                                <div className="text-sm text-[#EDEDED] line-clamp-1">{ticket.title}</div>
                                <div className="text-xs text-[#666] mt-1">{new Date(ticket.updated_at).toLocaleDateString()}</div>
                              </button>
                            )) : (
                              <div className="text-center py-8 text-[#888]">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No tickets yet</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-2">
                    {selectedTicket ? (
                      <Card className="terminal-card h-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm">#{selectedTicket.id} - {selectedTicket.title}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{selectedTicket.category}</Badge>
                                <Badge className={`text-xs ${selectedTicket.priority === "critical" ? "bg-[#FF4444]/20 text-[#FF4444]" : selectedTicket.priority === "high" ? "bg-[#FFD700]/20 text-[#FFD700]" : ""}`}>
                                  {selectedTicket.priority}
                                </Badge>
                              </div>
                            </div>
                            <Badge className={`${selectedTicket.status === "resolved" ? "bg-[#00FF94]/20 text-[#00FF94]" : "bg-[#FFD700]/20 text-[#FFD700]"}`}>
                              {selectedTicket.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col h-[400px]">
                          <ScrollArea className="flex-1 mb-4">
                            <div className="space-y-3">
                              {selectedTicket.messages?.map((msg, i) => (
                                <div key={i} className={`p-3 rounded ${msg.sender === "customer" ? "bg-[#00E5FF]/10 border border-[#00E5FF]/30" : "bg-[#0A0A0A] border border-[#1F1F1F]"}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium" style={{ color: msg.sender === "support" ? "#00FF94" : "#00E5FF" }}>
                                      {msg.sender === "support" ? "Support Team" : msg.sender_name || "You"}
                                    </span>
                                    <span className="text-xs text-[#666]">{new Date(msg.timestamp).toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm text-[#EDEDED]">{msg.content}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <div className="flex gap-2">
                            <Input
                              value={ticketReply}
                              onChange={(e) => setTicketReply(e.target.value)}
                              placeholder="Type your reply..."
                              className="terminal-input"
                              onKeyDown={(e) => e.key === "Enter" && sendTicketReply()}
                            />
                            <Button onClick={sendTicketReply} className="btn-primary">
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="terminal-card h-full flex items-center justify-center">
                        <div className="text-center text-[#888]">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Select a ticket to view details</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

                {/* New Ticket Modal */}
                <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
                  <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F]">
                    <DialogHeader>
                      <DialogTitle>Create Support Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Title</label>
                        <Input
                          value={newTicket.title}
                          onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                          placeholder="Brief description of your issue"
                          className="terminal-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[#888] block mb-1">Category</label>
                          <select
                            value={newTicket.category}
                            onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                            className="w-full p-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-sm"
                          >
                            <option value="billing">Billing</option>
                            <option value="technical">Technical</option>
                            <option value="feature_request">Feature Request</option>
                            <option value="bug_report">Bug Report</option>
                            <option value="account">Account</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-[#888] block mb-1">Priority</label>
                          <select
                            value={newTicket.priority}
                            onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                            className="w-full p-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Description</label>
                        <textarea
                          value={newTicket.description}
                          onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                          placeholder="Describe your issue in detail..."
                          className="w-full p-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-sm min-h-[100px]"
                        />
                      </div>
                      <Button onClick={createTicket} className="btn-primary w-full">
                        Create Ticket
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* ALL TICKETS SECTION (Owner Only) */}
            {activeSection === "all-tickets" && isOwner && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(allTickets.stats?.by_status || {}).map(([status, count]) => (
                    <Card key={status} className="terminal-card">
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-[#00E5FF]">{count}</div>
                        <div className="text-xs text-[#888] uppercase">{status.replace("_", " ")}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="terminal-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">All Support Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#1F1F1F]">
                            <th className="text-left py-2 px-2 text-[#888]">ID</th>
                            <th className="text-left py-2 px-2 text-[#888]">Title</th>
                            <th className="text-left py-2 px-2 text-[#888]">Customer</th>
                            <th className="text-left py-2 px-2 text-[#888]">Priority</th>
                            <th className="text-left py-2 px-2 text-[#888]">Status</th>
                            <th className="text-left py-2 px-2 text-[#888]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allTickets.tickets?.map((ticket) => (
                            <tr key={ticket.id} className="border-b border-[#1F1F1F] hover:bg-[#0A0A0A]">
                              <td className="py-2 px-2 font-mono text-[#00E5FF]">#{ticket.id}</td>
                              <td className="py-2 px-2">{ticket.title}</td>
                              <td className="py-2 px-2 text-[#888]">{ticket.user_email}</td>
                              <td className="py-2 px-2">
                                <Badge className={`text-xs ${ticket.priority === "critical" ? "bg-[#FF4444]/20 text-[#FF4444]" : ticket.priority === "high" ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-[#888]/20 text-[#888]"}`}>
                                  {ticket.priority}
                                </Badge>
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={ticket.status}
                                  onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                                  className="bg-transparent border border-[#1F1F1F] rounded px-2 py-1 text-xs"
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="waiting_customer">Waiting Customer</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <Button size="sm" variant="ghost" onClick={() => { loadTicketDetails(ticket.id); setActiveSection("support"); }}>
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* WHITE-LABEL ADMIN SECTION (Owner Only) */}
            {activeSection === "white-label-admin" && isOwner && (
              <div className="space-y-6">
                <Card className="terminal-card">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#FFD700]" />
                      White-Label Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-xs text-[#888] block mb-1">Current Price</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">$</span>
                          <Input
                            type="number"
                            value={whiteLabelPrice}
                            onChange={(e) => setWhiteLabelPrice(parseFloat(e.target.value) || 0)}
                            className="terminal-input w-32"
                          />
                        </div>
                      </div>
                      <Button onClick={() => updateWhiteLabelPrice(whiteLabelPrice)} className="btn-primary mt-4">
                        Update Price
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="terminal-card">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#FFD700]" />
                      Pending Requests ({whiteLabelRequests.pending?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {whiteLabelRequests.pending?.length > 0 ? (
                      <div className="space-y-3">
                        {whiteLabelRequests.pending.map((org) => (
                          <div key={org.id} className="p-4 border border-[#FFD700]/30 rounded bg-[#FFD700]/5">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{org.name}</div>
                                <div className="text-xs text-[#888]">Requested: {new Date(org.white_label?.requested_at).toLocaleDateString()}</div>
                              </div>
                              <div className="flex gap-2">
                                <Input placeholder="Payment Ref" className="terminal-input w-32" id={`pay-ref-${org.id}`} />
                                <Button 
                                  onClick={() => activateWhiteLabel(org.id, document.getElementById(`pay-ref-${org.id}`)?.value)}
                                  className="bg-[#00FF94] text-black hover:bg-[#00FF94]/80"
                                >
                                  Activate
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#888]">No pending requests</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="terminal-card">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#00FF94]" />
                      Active White-Labels ({whiteLabelRequests.active?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {whiteLabelRequests.active?.length > 0 ? (
                      <div className="space-y-2">
                        {whiteLabelRequests.active.map((org) => (
                          <div key={org.id} className="p-3 border border-[#00FF94]/30 rounded flex items-center justify-between">
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-xs text-[#888]">
                                Activated: {new Date(org.white_label?.activated_at).toLocaleDateString()}
                                {org.white_label?.settings?.company_name && ` • Branded as: ${org.white_label.settings.company_name}`}
                              </div>
                            </div>
                            <Badge className="bg-[#00FF94]/20 text-[#00FF94]">ACTIVE</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#888]">No active white-labels</div>
                    )}
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
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin verification state
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [adminType, setAdminType] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    
    if (requiresVerification) {
      // Step 2: Verify admin login
      try {
        const res = await axios.post(`${API}/auth/admin/verify`, {
          email: pendingEmail,
          verification_code: verificationCode
        });
        
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data));
          toast.success(`${adminType} login verified successfully`);
          setRequiresVerification(false);
          setVerificationCode("");
          onClose();
          window.location.reload();
        }
      } catch (e) {
        toast.error(e.response?.data?.detail || "Verification failed");
      }
      setLoading(false);
      return;
    }
    
    // Step 1: Regular login or admin login request
    try {
      const res = await axios.post(`${API}/auth/admin/login-request`, { email, password });
      
      if (res.data.requires_verification) {
        // Admin needs email verification
        setRequiresVerification(true);
        setAdminType(res.data.admin_type);
        setPendingEmail(email);
        
        if (res.data.simulated && res.data.verification_code) {
          // For demo/testing - show the code
          toast.info(`Demo mode: Verification code is ${res.data.verification_code}`);
        } else {
          toast.success(`Verification code sent to ${email}`);
        }
      } else if (res.data.token) {
        // Regular user - direct login
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        toast.success("Login successful");
        onClose();
        window.location.reload();
      }
    } catch (e) {
      // Fallback to regular login endpoint
      const success = isLogin ? await login(email, password) : await register(name, email, password);
      if (success) onClose();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setRequiresVerification(false);
    setVerificationCode("");
    setAdminType("");
    setPendingEmail("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onClose(); }}>
      <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F] max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {requiresVerification ? `🔐 ${adminType} VERIFICATION` : (isLogin ? "LOGIN" : "REGISTER")}
          </DialogTitle>
          <DialogDescription className="text-[#888]">
            {requiresVerification 
              ? `Enter the verification code sent to ${pendingEmail}` 
              : (isLogin ? "Access your Plutus Predict account" : "Create a new account")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {requiresVerification ? (
            // Verification code input
            <>
              <div className="p-3 bg-[#9D4EDD]/10 border border-[#9D4EDD] rounded text-center">
                <p className="text-sm text-[#9D4EDD]">Code expires in 15 minutes</p>
              </div>
              <Input
                data-testid="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="terminal-input text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && verificationCode.length === 6 && handleSubmit()}
              />
              <Button onClick={handleSubmit} disabled={loading || verificationCode.length !== 6} className="btn-primary w-full">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                VERIFY & LOGIN
              </Button>
              <button onClick={resetForm} className="text-sm text-[#888] hover:text-[#00E5FF] w-full text-center">
                ← Back to login
              </button>
            </>
          ) : (
            // Regular login/register form
            <>
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
              <div className="relative">
                <Input
                  data-testid="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="terminal-input pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#00E5FF]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showPassword && password && (
                <div className="text-xs text-[#00FF94] bg-[#00FF94]/10 p-2 rounded border border-[#00FF94]/30">
                  Password: {password}
                </div>
              )}
              <Button onClick={handleSubmit} disabled={loading} className="btn-primary w-full" data-testid="auth-submit-btn">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLogin ? "LOGIN" : "REGISTER"}
              </Button>
              <div className="text-center">
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-[#00E5FF] hover:underline">
                  {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                </button>
              </div>
              <div className="text-center text-xs text-[#666] border-t border-[#1F1F1F] pt-3 mt-3">
                <p className="text-[#888] mb-1">Owner Admin requires email verification</p>
                <p>Owner: parimal@plutuspredict.com</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Change Password Modal Component
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        toast.success("Password changed successfully");
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to change password");
    }
    setLoading(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border-[#1F1F1F] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">🔐 Change Password</DialogTitle>
          <DialogDescription className="text-[#888]">
            Enter your current password and choose a new one
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="relative">
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="terminal-input"
            />
          </div>
          <div className="relative">
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="New Password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="terminal-input"
            />
          </div>
          <div className="relative">
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="terminal-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="show-pwd" 
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="rounded border-[#333]"
            />
            <label htmlFor="show-pwd" className="text-sm text-[#888]">Show passwords</label>
          </div>
          {showPasswords && (newPassword || currentPassword) && (
            <div className="text-xs bg-[#1F1F1F] p-2 rounded font-mono">
              {currentPassword && <p>Current: {currentPassword}</p>}
              {newPassword && <p>New: {newPassword}</p>}
            </div>
          )}
          <Button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword} className="btn-primary w-full">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
            CHANGE PASSWORD
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Trial Banner Component - Shows countdown for all users
const TrialBanner = ({ trialStatus, onUpgrade }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(trialStatus?.remaining_seconds || 0);
  
  useEffect(() => {
    if (trialStatus?.remaining_seconds) {
      setRemainingSeconds(trialStatus.remaining_seconds);
    }
  }, [trialStatus]);
  
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingSeconds]);
  
  if (!trialStatus || trialStatus.has_unlimited_access || trialStatus.subscription_status === "active") {
    return null;
  }
  
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isExpired = remainingSeconds <= 0;
  const isLow = remainingSeconds <= 60;
  
  return (
    <div className={`fixed top-16 left-0 right-0 z-40 py-2 px-4 text-center text-sm ${
      isExpired ? 'bg-[#FF4444]' : isLow ? 'bg-[#FFD700]' : 'bg-[#9D4EDD]'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        {isExpired ? (
          <>
            <span className="font-bold text-white">⚠️ TRIAL EXPIRED - Payment Required to Continue</span>
            <Button size="sm" onClick={onUpgrade} className="bg-white text-[#FF4444] hover:bg-gray-100 font-bold">
              <CreditCard className="w-4 h-4 mr-1" />
              UPGRADE NOW
            </Button>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            <span className={`font-mono font-bold ${isLow ? 'text-black' : 'text-white'}`}>
              TRIAL: {minutes}:{seconds.toString().padStart(2, '0')} remaining
            </span>
            <Button size="sm" onClick={onUpgrade} className={`${isLow ? 'bg-black text-[#FFD700]' : 'bg-white text-[#9D4EDD]'} hover:opacity-90 font-bold`}>
              <CreditCard className="w-4 h-4 mr-1" />
              UPGRADE
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Payment Required Modal - Blocks access when trial expired
const PaymentRequiredModal = ({ isOpen, onClose, onUpgrade }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[#0A0A0A] border-[#FF4444] border-2 max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl text-[#FF4444] flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Trial Expired
          </DialogTitle>
          <DialogDescription className="text-[#888]">
            Your 5-minute free trial has ended. Subscribe to continue using Plutus Predict.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-[#1A1A1A] rounded border border-[#333]">
            <h4 className="font-bold text-[#00E5FF] mb-2">What you get with a subscription:</h4>
            <ul className="text-sm text-[#888] space-y-1">
              <li>✓ Unlimited AI Forecasts</li>
              <li>✓ Full OSINT Intelligence Access</li>
              <li>✓ Investment Banker Suite</li>
              <li>✓ Disaster Predictions & Alerts</li>
              <li>✓ Deep Forecast Reports</li>
              <li>✓ Priority Support</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={onUpgrade} className="w-full bg-[#00FF94] text-black hover:bg-[#00FF94]/80 font-bold">
              <CreditCard className="w-4 h-4 mr-2" />
              VIEW PRICING & SUBSCRIBE
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full border-[#333] text-[#888]">
              Log Out
            </Button>
          </div>
          
          <p className="text-xs text-[#666] text-center">
            Questions? Contact support@plutuspredict.com
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Terms and Conditions Component
const TermsConditions = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] p-6">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Platform
        </Button>
        
        <Card className="terminal-card">
          <CardHeader>
            <CardTitle className="text-2xl">Terms and Conditions</CardTitle>
            <CardDescription>Last Updated: December 2025</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none text-sm space-y-6">
            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">1. ACCEPTANCE OF TERMS</h3>
              <p className="text-[#888]">
                By accessing and using Plutus Predict ("the Platform"), you accept and agree to be bound by the terms and 
                provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">2. DESCRIPTION OF SERVICE</h3>
              <p className="text-[#888]">
                Plutus Predict is an <strong>INFORMATION PROVIDER ONLY</strong>. We provide AI-powered forecasting and 
                prediction information for events including but not limited to economic events, geopolitical situations, 
                natural disasters, market movements, and other global occurrences.
              </p>
              <p className="text-[#FF3333] font-bold mt-2">
                WE DO NOT PROVIDE FINANCIAL ADVICE, INVESTMENT RECOMMENDATIONS, OR ANY FORM OF PROFESSIONAL GUIDANCE.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">3. DISCLAIMER OF LIABILITY</h3>
              <p className="text-[#888]">
                <strong>3.1</strong> All forecasts, predictions, and information provided on this platform are for 
                <strong> INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY</strong>.
              </p>
              <p className="text-[#888]">
                <strong>3.2</strong> The predictions made by our AI systems, including judgmental forecasting, disaster 
                predictions, and market analysis, are probabilistic estimates and should not be relied upon as 
                guarantees of future events.
              </p>
              <p className="text-[#888]">
                <strong>3.3</strong> Plutus Predict, its owners, employees, and affiliates shall not be held liable for 
                any losses, damages, or decisions made based on information provided through this platform.
              </p>
              <p className="text-[#888]">
                <strong>3.4</strong> Users acknowledge that all investment, financial, and personal decisions are made 
                at their own risk and discretion.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">4. NO RECOMMENDATIONS OR ADVICE</h3>
              <p className="text-[#888]">
                <strong>4.1</strong> Nothing on this platform constitutes financial advice, investment advice, legal advice, 
                medical advice, or any other professional advice.
              </p>
              <p className="text-[#888]">
                <strong>4.2</strong> Any "recommendations" shown on the platform (such as IPO recommendations or M&A analysis) 
                are algorithmically generated based on data patterns and DO NOT represent advice to buy, sell, or hold any 
                securities or assets.
              </p>
              <p className="text-[#888]">
                <strong>4.3</strong> Users should consult with qualified professionals (financial advisors, attorneys, 
                medical professionals, etc.) before making any decisions based on information from this platform.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">5. ACCURACY OF INFORMATION</h3>
              <p className="text-[#888]">
                <strong>5.1</strong> While we strive to provide accurate and up-to-date information, we make no 
                representations or warranties of any kind about the completeness, accuracy, reliability, or suitability 
                of the information.
              </p>
              <p className="text-[#888]">
                <strong>5.2</strong> Our forecasts are based on AI models, historical data, and OSINT (Open Source Intelligence) 
                which may contain errors or become outdated.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">6. USER RESPONSIBILITIES</h3>
              <p className="text-[#888]">
                Users agree to: (a) use the platform only for lawful purposes; (b) not rely solely on our predictions 
                for critical decisions; (c) conduct their own due diligence; (d) not redistribute our proprietary 
                content without permission.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">7. INTELLECTUAL PROPERTY</h3>
              <p className="text-[#888]">
                All content, forecasting algorithms, and proprietary methodologies on Plutus Predict are protected by 
                intellectual property laws. Unauthorized reproduction or distribution is prohibited.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">8. LIMITATION OF LIABILITY</h3>
              <p className="text-[#888]">
                IN NO EVENT SHALL PLUTUS PREDICT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER 
                INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">9. GOVERNING LAW</h3>
              <p className="text-[#888]">
                These terms shall be governed by and construed in accordance with the laws of the State of Wyoming, 
                United States, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">10. CONTACT INFORMATION</h3>
              <p className="text-[#888]">
                <strong>MedEvidences Corporation</strong><br />
                30 N Gould St, Ste R<br />
                Sheridan, WY 82801<br />
                United States<br />
                Email: legal@plutuspredict.com
              </p>
            </section>

            <section className="border-t border-[#1F1F1F] pt-4 mt-6">
              <p className="text-xs text-[#666]">
                Plutus Predict is a product of MedEvidences Corporation. By using Plutus Predict, you acknowledge that you have read, understood, and agree to be bound 
                by these Terms and Conditions.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Privacy Policy Component
const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] p-6">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Platform
        </Button>
        
        <Card className="terminal-card">
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <CardDescription>Last Updated: December 2025</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none text-sm space-y-6">
            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">1. INTRODUCTION</h3>
              <p className="text-[#888]">
                MedEvidences Corporation ("we," "our," or "us") respects your privacy and is committed to protecting 
                your personal data. This privacy policy explains how we collect, use, disclose, and safeguard 
                your information when you visit our Plutus Predict platform.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">2. INFORMATION WE COLLECT</h3>
              <p className="text-[#888]"><strong>2.1 Personal Data:</strong></p>
              <ul className="list-disc pl-6 text-[#888]">
                <li>Name and email address (when you register)</li>
                <li>Account credentials</li>
                <li>Payment information (processed by third-party providers)</li>
                <li>Communication preferences</li>
              </ul>
              <p className="text-[#888] mt-2"><strong>2.2 Usage Data:</strong></p>
              <ul className="list-disc pl-6 text-[#888]">
                <li>Browser type and version</li>
                <li>Pages visited and time spent</li>
                <li>Forecasts and features used</li>
                <li>IP address and general location</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">3. HOW WE USE YOUR INFORMATION</h3>
              <ul className="list-disc pl-6 text-[#888]">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To provide customer support</li>
                <li>To gather analysis to improve our service</li>
                <li>To detect and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">4. DATA RETENTION</h3>
              <p className="text-[#888]">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined 
                in this privacy policy. Usage data is generally retained for a shorter period, except when 
                used to improve security or functionality.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">5. DATA SHARING</h3>
              <p className="text-[#888]">
                We do not sell your personal data. We may share data with:
              </p>
              <ul className="list-disc pl-6 text-[#888]">
                <li>Service providers (hosting, analytics, payment processing)</li>
                <li>Law enforcement when required by law</li>
                <li>Business partners with your consent</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">6. DATA SECURITY</h3>
              <p className="text-[#888]">
                We implement appropriate technical and organizational measures to protect your personal data. 
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">7. YOUR RIGHTS</h3>
              <p className="text-[#888]">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-[#888]">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">8. COOKIES</h3>
              <p className="text-[#888]">
                We use cookies and similar tracking technologies to track activity on our platform and store 
                certain information. You can instruct your browser to refuse all cookies or to indicate when 
                a cookie is being sent.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">9. CHILDREN'S PRIVACY</h3>
              <p className="text-[#888]">
                Our service is not directed to anyone under the age of 18. We do not knowingly collect 
                personal data from children under 18.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">10. CHANGES TO THIS POLICY</h3>
              <p className="text-[#888]">
                We may update our Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-[#00E5FF]">11. CONTACT US</h3>
              <p className="text-[#888]">
                <strong>Plutus Predict LLC</strong><br />
                30 N Gould St, Ste R<br />
                Sheridan, WY 82801<br />
                United States<br />
                Email: privacy@plutuspredict.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const location = window.location;
  const initialTab = location.pathname === "/admin" ? "admin" : 
                     location.pathname === "/pricing" ? "pricing" :
                     location.pathname === "/chat" ? "chat" :
                     location.pathname === "/osint" ? "osint" :
                     location.pathname === "/terms" ? "terms" :
                     location.pathname === "/privacy" ? "privacy" : "dashboard";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAuth, setShowAuth] = useState(location.pathname === "/admin" && !localStorage.getItem("token"));
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [trialStatus, setTrialStatus] = useState(null);
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const { user, token, login, register, logout, getHeaders, setUser } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();

  // Check trial status periodically
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!token) return;
      
      try {
        const res = await axios.get(`${API}/auth/trial-status`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setTrialStatus(res.data);
        
        // Show payment modal if trial expired
        if (res.data.requires_payment && !res.data.has_unlimited_access) {
          setShowPaymentRequired(true);
        }
      } catch (e) {
        console.error("Trial status check failed:", e);
      }
    };
    
    checkTrialStatus();
    // Check every 10 seconds
    const interval = setInterval(checkTrialStatus, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Check auth on load
  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setUser(res.data);
          // If on /admin route and now logged in, navigate to admin
          if (location.pathname === "/admin") {
            setActiveTab("admin");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
        });
    }
  }, [token, setUser]);

  // Update URL when tab changes (optional - for bookmarking)
  useEffect(() => {
    const tabRoutes = { admin: "/admin", pricing: "/pricing", chat: "/chat", osint: "/osint", terms: "/terms", privacy: "/privacy" };
    if (tabRoutes[activeTab] && window.location.pathname !== tabRoutes[activeTab]) {
      window.history.replaceState(null, "", tabRoutes[activeTab]);
    } else if (!tabRoutes[activeTab] && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, [activeTab]);

  // Handle cross-component remediation navigation
  const [pendingRemediation, setPendingRemediation] = useState(null);
  
  useEffect(() => {
    const handleOpenRemediation = (event) => {
      const { detail } = event;
      setPendingRemediation(detail);
      setActiveTab("disasters");
    };
    
    window.addEventListener('openRemediation', handleOpenRemediation);
    return () => window.removeEventListener('openRemediation', handleOpenRemediation);
  }, []);

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
        return <Disasters getHeaders={getHeaders} pendingRemediation={pendingRemediation} clearPendingRemediation={() => setPendingRemediation(null)} />;
      case "space":
        return <SpaceHazards getHeaders={getHeaders} />;
      case "astrology":
        return <Astrology getHeaders={getHeaders} user={user} />;
      case "tabular":
        return <TabularPredictions />;
      case "holographic":
        return <HolographicVisualization getHeaders={getHeaders} />;
      case "accuracy":
        return <AccuracyDashboard getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "my-dashboards":
        return <CustomDashboards getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "pricing":
        return <Pricing user={user} setShowAuth={setShowAuth} getHeaders={getHeaders} />;
      case "admin":
        return <EnterpriseAdmin getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "osint":
        return <OSINTSearch />;
      case "chat":
        return <Chat getHeaders={getHeaders} user={user} setShowAuth={setShowAuth} />;
      case "terms":
        return <TermsConditions onBack={() => setActiveTab("dashboard")} />;
      case "privacy":
        return <PrivacyPolicy onBack={() => setActiveTab("dashboard")} />;
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
        setShowChangePassword={setShowChangePassword}
        logout={logout}
        language={language}
        setLanguage={setLanguage}
      />
      
      {/* Trial Banner - Shows countdown for logged in users */}
      {user && trialStatus && (
        <TrialBanner 
          trialStatus={trialStatus} 
          onUpgrade={() => setActiveTab("pricing")} 
        />
      )}
      
      {/* Top Banner Advertisement */}
      <div className={`max-w-7xl mx-auto px-4 pt-4 ${user && trialStatus && !trialStatus.has_unlimited_access ? 'mt-10' : ''}`}>
        <BannerAd placement="homepage_banner" />
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
      
      {/* Sidebar Ad - shown on larger screens */}
      <div className="hidden xl:block fixed right-4 top-1/2 transform -translate-y-1/2 w-48">
        <BannerAd placement="sidebar" className="mb-4" />
      </div>
      
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        login={login}
        register={register}
      />
      
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      
      {/* Payment Required Modal - Shows when trial expires */}
      <PaymentRequiredModal
        isOpen={showPaymentRequired}
        onClose={() => {
          setShowPaymentRequired(false);
          logout();
        }}
        onUpgrade={() => {
          setShowPaymentRequired(false);
          setActiveTab("pricing");
        }}
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
          
          {/* Legal Links */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button 
              onClick={() => setActiveTab("terms")}
              className="text-xs text-[#888] hover:text-[#00E5FF] transition-colors"
            >
              Terms & Conditions
            </button>
            <span className="text-[#333]">|</span>
            <button 
              onClick={() => setActiveTab("privacy")}
              className="text-xs text-[#888] hover:text-[#00E5FF] transition-colors"
            >
              Privacy Policy
            </button>
          </div>
          
          {/* Company Info */}
          <p className="text-xs text-[#444] mt-3">
            Plutus Predict LLC • 30 N Gould St, Ste R, Sheridan, WY 82801, USA
          </p>
          <p className="text-xs text-[#FF3333] mt-2">
            ⚠️ Information Only - Not Financial or Investment Advice
          </p>
          
          {/* Footer Banner Ad */}
          <div className="mt-4">
            <BannerAd placement="footer" />
          </div>
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
          <Route path="/" element={<MainApp />} />
          <Route path="/admin" element={<MainApp />} />
          <Route path="/pricing" element={<MainApp />} />
          <Route path="/chat" element={<MainApp />} />
          <Route path="/osint" element={<MainApp />} />
          <Route path="/terms" element={<MainApp />} />
          <Route path="/privacy" element={<MainApp />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
