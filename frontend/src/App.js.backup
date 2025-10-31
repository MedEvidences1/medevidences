import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSpeechSynthesis } from 'react-speech-kit';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Activity, Home, AlertCircle, CheckCircle, Clock, AlertTriangle, Brain, Heart, Utensils, Sparkles, Search, TrendingUp, Volume2, VolumeX, User } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Female AI Avatar Component
const AIAssistant = ({ message, isSpecaking, onToggleSpeak }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="ai-assistant">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 rounded-full blur opacity-75 animate-pulse"></div>
        <div className="relative bg-white rounded-full p-2 shadow-2xl border-4 border-white">
          <img
            src="https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3J8ZW58MHx8fHwxNzYxOTMxNTY3fDA&ixlib=rb-4.1.0&q=85"
            alt="Dr. AI Assistant"
            className="w-24 h-24 rounded-full object-cover"
          />
          {message && (
            <Button
              onClick={onToggleSpeak}
              size="sm"
              className={`absolute -top-2 -right-2 rounded-full w-10 h-10 p-0 ${isSpecaking ? 'bg-red-500 animate-pulse' : 'bg-teal-600'}`}
              data-testid="toggle-voice-btn"
            >
              {isSpecaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>
      {message && (
        <div className="mt-3 bg-white rounded-lg shadow-xl p-3 max-w-xs border-2 border-teal-200">
          <p className="text-sm text-gray-700">{isSpecaking ? "Speaking..." : "Click to hear results"}</p>
        </div>
      )}
    </div>
  );
};

// Body Pain Localization Component
const BodyPainSelector = ({ symptom, onLocationSelect, selectedLocations }) => {
  const [bodyLocations, setBodyLocations] = useState([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);

  useEffect(() => {
    fetchBodyLocations();
  }, []);

  const fetchBodyLocations = async () => {
    try {
      const response = await axios.get(`${API}/body/locations`);
      setBodyLocations(response.data.body_locations);
    } catch (error) {
      console.error("Error fetching body locations:", error);
    }
  };

  const getBodyImage = () => {
    if (symptom.includes("back")) return "https://images.unsplash.com/photo-1716996236828-18583f5abe5d";
    if (symptom.includes("head")) return "https://images.unsplash.com/photo-1532153470116-e8c2088b8ac1";
    return "https://images.unsplash.com/photo-1587624903959-9d8a64f874d1";
  };

  const getLocationType = () => {
    if (symptom.toLowerCase().includes("back")) return "back";
    if (symptom.toLowerCase().includes("head")) return "head";
    if (symptom.toLowerCase().includes("chest")) return "chest";
    if (symptom.toLowerCase().includes("abdominal")) return "abdomen";
    if (symptom.toLowerCase().includes("joint")) return "joints";
    return "back";
  };

  const locationType = getLocationType();
  const locations = bodyLocations[locationType] || [];

  const handleLocationClick = (location) => {
    onLocationSelect({
      body_part: symptom,
      specific_location: location,
      side: selectedBodyPart
    });
  };

  return (
    <Card className="border-2 border-purple-200 shadow-xl" data-testid="body-pain-selector">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-600" />
          Pinpoint Your Pain Location
        </CardTitle>
        <CardDescription>Click on the specific area where you feel {symptom.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Body Diagram */}
          <div className="relative">
            <img 
              src={getBodyImage()}
              alt="Body diagram"
              className="w-full rounded-lg shadow-md"
            />
            <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {symptom}
            </div>
          </div>

          {/* Location Options */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Specific Location:</Label>
              <div className="grid grid-cols-1 gap-2">
                {locations.map((location) => {
                  const isSelected = selectedLocations.some(
                    loc => loc.specific_location === location && loc.body_part === symptom
                  );
                  return (
                    <button
                      key={location}
                      onClick={() => handleLocationClick(location)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-purple-500 text-white ring-2 ring-purple-600'
                          : 'bg-purple-50 hover:bg-purple-100 text-gray-900'
                      }`}
                      data-testid={`location-${location.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{location}</span>
                        {isSelected && <CheckCircle className="w-5 h-5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedLocations.filter(loc => loc.body_part === symptom).length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                <Label className="text-sm font-semibold text-purple-900">Selected Locations:</Label>
                <div className="mt-2 space-y-1">
                  {selectedLocations
                    .filter(loc => loc.body_part === symptom)
                    .map((loc, idx) => (
                      <div key={idx} className="text-sm text-purple-700">
                        • {loc.specific_location}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Hero Section with Image */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 z-0"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-10 h-10 text-teal-600" />
                <span className="text-lg font-semibold text-teal-700">MedEvidences</span>
              </div>
              <h1 className="text-6xl font-bold text-gray-900 mb-4 leading-tight">
                Super Intelligence
                <span className="block text-teal-600">Symptom Checker</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Evidence-based AI analysis with voice-guided results and precise pain location mapping. 
                Get personalized health insights with nutritional guidance in minutes.
              </p>
              <Button 
                onClick={() => navigate('/symptom-checker')} 
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-xl"
                data-testid="start-assessment-btn"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Begin Smart Assessment
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwY29uc3VsdGF0aW9ufGVufDB8fHx8MTc2MTkzMDM2Nnww&ixlib=rb-4.1.0&q=85"
                alt="Medical consultation"
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">AI Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900">98.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose MedEvidences?</h2>
          <p className="text-gray-600 text-lg">Advanced medical intelligence at your fingertips</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-xl" data-testid="feature-card-fast">
            <CardHeader>
              <div className="bg-gradient-to-br from-teal-500 to-cyan-500 w-14 h-14 rounded-xl flex items-center justify-center mb-3">
                <Volume2 className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">Voice Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">AI female assistant speaks your diagnosis with clear explanations</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl" data-testid="feature-card-ai">
            <CardHeader>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-14 h-14 rounded-xl flex items-center justify-center mb-3">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">Super Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Advanced AI trained on thousands of medical evidences and research</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:border-orange-300 transition-all hover:shadow-xl" data-testid="feature-card-nutrition">
            <CardHeader>
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 w-14 h-14 rounded-xl flex items-center justify-center mb-3">
                <Utensils className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">Pain Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Interactive body diagrams to pinpoint exact pain locations</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl" data-testid="feature-card-personalized">
            <CardHeader>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-14 h-14 rounded-xl flex items-center justify-center mb-3">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">Cardio Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Special cardiovascular health monitoring and early warnings</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-r from-teal-600 to-cyan-600 border-0 text-white">
          <CardContent className="py-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Check Your Symptoms?</h3>
            <p className="text-xl mb-6 text-teal-50">Get evidence-based insights with voice guidance and precise pain mapping</p>
            <Button 
              onClick={() => navigate('/symptom-checker')} 
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
            >
              Start Assessment Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-sm text-gray-500 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <AlertCircle className="w-5 h-5 inline mr-2 text-amber-600" />
          <span>This tool provides evidence-based information. Always consult healthcare professionals for medical advice and treatment.</span>
        </div>
      </div>
    </div>
  );
};
