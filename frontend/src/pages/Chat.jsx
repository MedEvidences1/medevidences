import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Brain, MessageSquare, Send, Download, Trash2, User, 
  Sparkles, Zap, AlertTriangle, TrendingUp, Globe, Target 
} from "lucide-react";
import { API } from "@/lib/constants";

export const Chat = ({ getHeaders, user, setShowAuth }) => {
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
      axios.get(`${API}/chat/history`, { headers: getHeaders()?.headers || {} })
        .then((res) => setMessages(res.data.history || []))
        .catch(console.error);
    }
  }, [user, getHeaders]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText = null) => {
    const msgToSend = messageText || input;
    if (!msgToSend.trim()) return;
    
    if (!user) {
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
      const res = await axios.post(`${API}/chat/interactive`, { 
        message: msgToSend,
        session_id: sessionId,
        context: context
      }, { headers: user ? getHeaders()?.headers || {} : {} });
      
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
      try {
        const res = await axios.post(`${API}/chat`, { message: msgToSend }, { headers: user ? getHeaders()?.headers || {} : {} });
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

        <div className="space-y-4">
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

export default Chat;
