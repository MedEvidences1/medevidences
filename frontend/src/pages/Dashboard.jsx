import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Brain, Layers, Activity, Cloud, AlertTriangle, Globe, Sparkles } from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { API } from "@/lib/constants";

export const Dashboard = ({ getHeaders }) => {
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

export default Dashboard;
