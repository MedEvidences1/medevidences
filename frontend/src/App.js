import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Activity, Home, AlertCircle, CheckCircle, Clock, AlertTriangle, Brain, Heart, Utensils, Sparkles, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
                Evidence-based AI analysis powered by advanced medical intelligence. 
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
                <Clock className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Complete medical assessment in under 3 minutes with instant results</p>
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
              <CardTitle className="text-xl">Food Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Personalized nutritional recommendations for every symptom</p>
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
            <p className="text-xl mb-6 text-teal-50">Get evidence-based insights with nutritional guidance</p>
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

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [commonSymptoms, setCommonSymptoms] = useState([]);
  const [symptomData, setSymptomData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  const [formData, setFormData] = useState({
    age: "",
    sex: "",
    pregnant: null,
    primarySymptoms: [],
    symptomDuration: "",
    severity: "",
    additionalInfo: "",
    backPainLocation: null,  // For body diagram
    amErectionDuration: null  // For cardiovascular tracking
  });

  useEffect(() => {
    fetchCommonSymptoms();
    fetchSymptomData();
  }, []);

  const fetchCommonSymptoms = async () => {
    try {
      const response = await axios.get(`${API}/symptoms/common`);
      setCommonSymptoms(response.data.symptoms);
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      toast.error("Failed to load symptoms list");
    }
  };

  const fetchSymptomData = async () => {
    try {
      const response = await axios.get(`${API}/symptoms/data`);
      setSymptomData(response.data.symptom_data);
    } catch (error) {
      console.error("Error fetching symptom data:", error);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      primarySymptoms: prev.primarySymptoms.includes(symptom)
        ? prev.primarySymptoms.filter(s => s !== symptom)
        : [...prev.primarySymptoms, symptom]
    }));
  };

  const handleSubmit = async () => {
    if (formData.primarySymptoms.length === 0) {
      toast.error("Please select at least one symptom");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        personal_info: {
          age: parseInt(formData.age),
          sex: formData.sex,
          pregnant: formData.pregnant
        },
        primary_symptoms: formData.primarySymptoms,
        symptom_duration: formData.symptomDuration,
        severity: formData.severity,
        additional_info: formData.additionalInfo
      };

      // Add back pain location if available
      if (formData.backPainLocation) {
        payload.pain_locations = [{
          body_part: "Back pain",
          specific_location: formData.backPainLocation,
          side: formData.backPainLocation.includes("Left") ? "left" : 
                formData.backPainLocation.includes("Right") ? "right" : "center"
        }];
      }

      // Add AM erection duration if available
      if (formData.amErectionDuration) {
        payload.am_erection_duration = formData.amErectionDuration;
      }

      const response = await axios.post(`${API}/symptoms/analyze`, payload);
      setDiagnosisResult(response.data);
      setStep(4);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      toast.error("Failed to analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSymptoms = commonSymptoms.filter(symptom =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUrgencyColor = (level) => {
    switch (level) {
      case "Emergency":
        return "bg-red-500";
      case "Urgent":
        return "bg-orange-500";
      case "Schedule Appointment":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const renderStep1 = () => (
    <Card className="max-w-2xl mx-auto shadow-2xl border-2 border-teal-100" data-testid="step-personal-info">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Heart className="w-6 h-6 text-teal-600" />
          Personal Information
        </CardTitle>
        <CardDescription>Help us personalize your health assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="age" className="text-base font-semibold">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            className="text-lg p-6"
            data-testid="input-age"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex" className="text-base font-semibold">Biological Sex</Label>
          <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
            <SelectTrigger className="text-lg p-6" data-testid="select-sex">
              <SelectValue placeholder="Select biological sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.sex === "female" && (
          <div className="flex items-center space-x-3 p-4 bg-pink-50 rounded-lg">
            <Checkbox
              id="pregnant"
              checked={formData.pregnant === true}
              onCheckedChange={(checked) => setFormData({...formData, pregnant: checked})}
              data-testid="checkbox-pregnant"
            />
            <Label htmlFor="pregnant" className="text-base cursor-pointer">Currently pregnant</Label>
          </div>
        )}

        <Button
          onClick={() => setStep(2)}
          disabled={!formData.age || !formData.sex}
          className="w-full text-lg py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          data-testid="btn-next-step1"
        >
          Continue to Symptoms
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="max-w-5xl mx-auto shadow-2xl border-2 border-teal-100" data-testid="step-symptoms">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Search className="w-6 h-6 text-teal-600" />
          Select Your Symptoms
        </CardTitle>
        <CardDescription>Choose all symptoms you're experiencing. Each symptom includes nutrition guidance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search symptoms (e.g., fever, headache, back pain)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-lg p-6"
            data-testid="input-symptom-search"
          />
        </div>

        <div className="max-h-[500px] overflow-y-auto border-2 border-teal-100 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-teal-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredSymptoms.map((symptom) => {
              const hasImage = symptomData[symptom]?.image;
              const hasFoods = symptomData[symptom]?.foods;
              return (
                <div
                  key={symptom}
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`relative overflow-hidden rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                    formData.primarySymptoms.includes(symptom)
                      ? "ring-4 ring-teal-500 shadow-xl"
                      : "ring-2 ring-gray-200 hover:ring-teal-300 shadow-md"
                  }`}
                  data-testid={`symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {hasImage && (
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={hasImage} 
                        alt={symptom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-4 ${
                    formData.primarySymptoms.includes(symptom)
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                      : "bg-white"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{symptom}</span>
                      {formData.primarySymptoms.includes(symptom) && (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                    {hasFoods && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <Utensils className="w-3 h-3" />
                        <span className={formData.primarySymptoms.includes(symptom) ? "text-teal-100" : "text-gray-600"}>
                          Nutrition guidance available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {formData.primarySymptoms.length > 0 && (
          <div className="bg-teal-50 p-4 rounded-xl border-2 border-teal-200">
            <Label className="text-base font-semibold text-teal-900">Selected Symptoms ({formData.primarySymptoms.length}):</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.primarySymptoms.map((symptom) => (
                <Badge key={symptom} className="text-sm py-2 px-3 bg-teal-600" data-testid="selected-symptom">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={() => setStep(1)} variant="outline" className="flex-1 text-lg py-6" data-testid="btn-back-step2">
            Back
          </Button>
          <Button
            onClick={() => {
              // Check if back pain or AM erection is selected - go to step 2.5
              const hasBackPain = formData.primarySymptoms.includes("Back pain");
              const hasAmErection = formData.primarySymptoms.includes("AM erection issues/Cardio health");
              if (hasBackPain || hasAmErection) {
                setStep(2.5);  // Go to specialized input step
              } else {
                setStep(3);  // Skip to regular details
              }
            }}
            disabled={formData.primarySymptoms.length === 0}
            className="flex-1 text-lg py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            data-testid="btn-next-step2"
          >
            Continue to Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2.5: Back Pain Body Diagram & AM Erection Duration
  const renderStep2_5 = () => {
    const hasBackPain = formData.primarySymptoms.includes("Back pain");
    const hasAmErection = formData.primarySymptoms.includes("AM erection issues/Cardio health");

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Pain Body Diagram */}
        {hasBackPain && (
          <Card className="border-2 border-purple-200 shadow-2xl" data-testid="back-pain-selector">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-purple-600" />
                Pinpoint Your Back Pain Location
              </CardTitle>
              <CardDescription className="text-base">Click directly on the body diagram where you feel pain</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Interactive Body Diagram - Click directly on the image! */}
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1716996236828-18583f5abe5d"
                    alt="Back anatomy diagram"
                    className="w-full rounded-xl shadow-lg border-4 border-purple-200"
                    style={{ maxHeight: '500px', objectFit: 'cover' }}
                  />
                  <div className="absolute top-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
                    Click on your pain area
                  </div>
                  
                  {/* Interactive Clickable Hotspots - MedEvidences Technology */}
                  <svg className="absolute top-0 left-0 w-full h-full" style={{ maxHeight: '500px' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Upper back */}
                    <rect 
                      x="30" y="15" width="40" height="15" 
                      fill={formData.backPainLocation === "Upper back" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.1)"}
                      stroke="rgba(147, 51, 234, 0.8)" 
                      strokeWidth="0.5"
                      className="cursor-pointer hover:fill-purple-400 transition-all"
                      onClick={() => setFormData({...formData, backPainLocation: "Upper back"})}
                      data-testid="hotspot-upper-back"
                    />
                    
                    {/* Mid back */}
                    <rect 
                      x="35" y="32" width="30" height="18" 
                      fill={formData.backPainLocation === "Mid back" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.1)"}
                      stroke="rgba(147, 51, 234, 0.8)" 
                      strokeWidth="0.5"
                      className="cursor-pointer hover:fill-purple-400 transition-all"
                      onClick={() => setFormData({...formData, backPainLocation: "Mid back"})}
                      data-testid="hotspot-mid-back"
                    />
                    
                    {/* Lower back */}
                    <rect 
                      x="38" y="52" width="24" height="18" 
                      fill={formData.backPainLocation === "Lower back" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.1)"}
                      stroke="rgba(147, 51, 234, 0.8)" 
                      strokeWidth="0.5"
                      className="cursor-pointer hover:fill-purple-400 transition-all"
                      onClick={() => setFormData({...formData, backPainLocation: "Lower back"})}
                      data-testid="hotspot-lower-back"
                    />
                    
                    {/* Left side */}
                    <rect 
                      x="15" y="30" width="18" height="35" 
                      fill={formData.backPainLocation === "Left side" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.1)"}
                      stroke="rgba(147, 51, 234, 0.8)" 
                      strokeWidth="0.5"
                      className="cursor-pointer hover:fill-purple-400 transition-all"
                      onClick={() => setFormData({...formData, backPainLocation: "Left side"})}
                      data-testid="hotspot-left-side"
                    />
                    
                    {/* Right side */}
                    <rect 
                      x="67" y="30" width="18" height="35" 
                      fill={formData.backPainLocation === "Right side" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.1)"}
                      stroke="rgba(147, 51, 234, 0.8)" 
                      strokeWidth="0.5"
                      className="cursor-pointer hover:fill-purple-400 transition-all"
                      onClick={() => setFormData({...formData, backPainLocation: "Right side"})}
                      data-testid="hotspot-right-side"
                    />
                    
                    {/* Tailbone */}
                    <ellipse 
                      cx="50" cy="75" rx="10" ry="8" 
                      fill={formData.backPainLocation === "Tailbone" ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.1)"}
                      stroke="rgba(147, 51, 234, 0.8)" 
                      strokeWidth="0.5"
                      className="cursor-pointer hover:fill-purple-400 transition-all"
                      onClick={() => setFormData({...formData, backPainLocation: "Tailbone"})}
                      data-testid="hotspot-tailbone"
                    />
                    
                    {/* Labels on hover */}
                    {!formData.backPainLocation && (
                      <>
                        <text x="50" y="22" textAnchor="middle" fill="white" fontSize="3" fontWeight="bold" className="pointer-events-none">Upper</text>
                        <text x="50" y="41" textAnchor="middle" fill="white" fontSize="3" fontWeight="bold" className="pointer-events-none">Mid</text>
                        <text x="50" y="61" textAnchor="middle" fill="white" fontSize="3" fontWeight="bold" className="pointer-events-none">Lower</text>
                        <text x="24" y="48" textAnchor="middle" fill="white" fontSize="2.5" fontWeight="bold" className="pointer-events-none">Left</text>
                        <text x="76" y="48" textAnchor="middle" fill="white" fontSize="2.5" fontWeight="bold" className="pointer-events-none">Right</text>
                        <text x="50" y="77" textAnchor="middle" fill="white" fontSize="2.5" fontWeight="bold" className="pointer-events-none">Tailbone</text>
                      </>
                    )}
                  </svg>
                </div>

                {/* Location Confirmation */}
                <div className="space-y-4">
                  <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                    <h3 className="text-lg font-bold text-purple-900 mb-4">📍 How to Use MedEvidences Pain Locator:</h3>
                    <ol className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">1.</span>
                        <span>Click directly on the body image where you feel pain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">2.</span>
                        <span>The area will highlight in purple</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">3.</span>
                        <span>You can change your selection by clicking another area</span>
                      </li>
                    </ol>
                  </div>

                  {formData.backPainLocation ? (
                    <div className="bg-purple-600 p-6 rounded-xl border-4 border-purple-400 shadow-2xl animate-pulse">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-8 h-8 text-white" />
                        <Label className="text-xl font-bold text-white">Pain Location Selected:</Label>
                      </div>
                      <p className="text-3xl font-bold text-white mt-3">✓ {formData.backPainLocation}</p>
                      <p className="text-purple-100 text-sm mt-2">Click another area to change</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-300">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                        <Label className="text-base font-bold text-amber-900">Please select a location</Label>
                      </div>
                      <p className="text-sm text-amber-800">Click on the body diagram above to pinpoint your pain</p>
                    </div>
                  )}

                  {/* Quick selection buttons as backup */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-purple-700">Or select from list:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Upper back", "Mid back", "Lower back", "Left side", "Right side", "Tailbone"].map((location) => {
                        const isSelected = formData.backPainLocation === location;
                        return (
                          <button
                            key={location}
                            onClick={() => setFormData({...formData, backPainLocation: location})}
                            className={`p-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-900'
                            }`}
                            data-testid={`back-location-${location.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {location}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AM Erection Duration Selector */}
        {hasAmErection && (
          <Card className="border-2 border-red-200 shadow-2xl" data-testid="am-erection-duration">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-600" />
                Cardiovascular Health - Duration Tracking
              </CardTitle>
              <CardDescription className="text-base">How long has this issue persisted? (Critical for heart health assessment)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="text-lg font-bold mb-4 block text-red-900">Select Duration:</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { value: "1-week", label: "1 Week", warning: false },
                    { value: "1-month", label: "1 Month", warning: true },
                    { value: "2-months", label: "2 Months", warning: true },
                    { value: "6-months", label: "6 Months or more", warning: true }
                  ].map((duration) => {
                    const isSelected = formData.amErectionDuration === duration.value;
                    return (
                      <button
                        key={duration.value}
                        onClick={() => setFormData({...formData, amErectionDuration: duration.value})}
                        className={`p-4 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-red-600 text-white ring-4 ring-red-400 shadow-xl transform scale-105'
                            : duration.warning
                              ? 'bg-red-50 hover:bg-red-100 text-gray-900 border-2 border-red-300'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-2 border-gray-300'
                        }`}
                        data-testid={`duration-${duration.value}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold block">{duration.label}</span>
                            {duration.warning && !isSelected && (
                              <span className="text-xs text-red-600 mt-1 block">⚠️ Cardiologist consultation needed</span>
                            )}
                          </div>
                          {isSelected && <CheckCircle className="w-6 h-6" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {formData.amErectionDuration && (
                  <div className="bg-red-100 p-5 rounded-xl border-2 border-red-400 mt-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-red-900 text-lg mb-2">Important Cardiovascular Alert</p>
                        <p className="text-red-800 leading-relaxed">
                          {formData.amErectionDuration !== "1-week" 
                            ? "⚠️ If this problem persists for MORE THAN 2 DAYS CONTINUOUSLY and is REPEATED EVERY WEEK, you MUST consult a Cardiologist immediately. This can be an early sign of cardiovascular disease."
                            : "Monitor this symptom closely. If it persists or worsens, consult a healthcare professional."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button onClick={() => setStep(2)} variant="outline" className="flex-1 text-lg py-6" data-testid="btn-back-step2-5">
            Back to Symptoms
          </Button>
          <Button
            onClick={() => setStep(3)}
            disabled={
              (hasBackPain && !formData.backPainLocation) ||
              (hasAmErection && !formData.amErectionDuration)
            }
            className="flex-1 text-lg py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            data-testid="btn-next-step2-5"
          >
            Continue to Final Details
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <Card className="max-w-2xl mx-auto shadow-2xl border-2 border-teal-100" data-testid="step-details">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-600" />
          Additional Details
        </CardTitle>
        <CardDescription>Provide more context about your symptoms for accurate analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-base font-semibold">How long have you had these symptoms?</Label>
          <Select value={formData.symptomDuration} onValueChange={(value) => setFormData({...formData, symptomDuration: value})}>
            <SelectTrigger className="text-lg p-6" data-testid="select-duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="less-than-24h">Less than 24 hours</SelectItem>
              <SelectItem value="1-3-days">1-3 days</SelectItem>
              <SelectItem value="4-7-days">4-7 days</SelectItem>
              <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
              <SelectItem value="more-than-2-weeks">More than 2 weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity" className="text-base font-semibold">How severe are your symptoms?</Label>
          <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
            <SelectTrigger className="text-lg p-6" data-testid="select-severity">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mild">Mild - Barely noticeable</SelectItem>
              <SelectItem value="moderate">Moderate - Noticeable but manageable</SelectItem>
              <SelectItem value="severe">Severe - Significantly affecting daily life</SelectItem>
              <SelectItem value="very-severe">Very Severe - Unbearable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional" className="text-base font-semibold">Any additional information? (Optional)</Label>
          <Textarea
            id="additional"
            placeholder="Describe any other relevant details, triggers, or patterns you've noticed..."
            value={formData.additionalInfo}
            onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
            rows={5}
            className="text-base"
            data-testid="textarea-additional"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setStep(2)} variant="outline" className="flex-1 text-lg py-6" data-testid="btn-back-step3">
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.symptomDuration || !formData.severity}
            className="flex-1 text-lg py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            data-testid="btn-submit-analysis"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-5 w-5" />
                Get AI Analysis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="results-page">
      {/* Special Cardiovascular Warnings */}
      {diagnosisResult?.special_warnings && diagnosisResult.special_warnings.length > 0 && (
        <Card className="border-4 border-red-500 bg-red-50 shadow-2xl" data-testid="special-warnings">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-red-900">IMPORTANT HEALTH ALERT</CardTitle>
                <CardDescription className="text-red-700 text-base">Please read carefully</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosisResult.special_warnings.map((warning, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border-2 border-red-300">
                <p className="text-red-900 font-medium leading-relaxed">{warning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Urgency Level */}
      <Card className="border-2 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-teal-600" />
              <div>
                <CardTitle className="text-2xl">Assessment Complete</CardTitle>
                <CardDescription className="text-base">Based on your symptoms analysis</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Urgency:</span>
              <Badge className={`${getUrgencyColor(diagnosisResult?.urgency_level)} text-white text-base px-4 py-2`}>
                {diagnosisResult?.urgency_level}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Possible Conditions */}
      <Card className="shadow-2xl border-2 border-teal-100" data-testid="possible-conditions">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-xl">Possible Conditions - Medical Evidence Based</CardTitle>
          </div>
          <CardDescription>AI-analyzed differential diagnosis based on your symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {diagnosisResult?.possible_conditions?.map((condition, index) => (
            <div key={index} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg" data-testid="condition-item">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg text-gray-900">{condition.name}</h3>
                <Badge 
                  variant={condition.probability === "High" ? "destructive" : "secondary"}
                  className="text-sm"
                >
                  {condition.probability} Probability
                </Badge>
              </div>
              <p className="text-gray-700 leading-relaxed">{condition.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Food Recommendations */}
      {diagnosisResult?.food_recommendations && diagnosisResult.food_recommendations.length > 0 && (
        <Card className="shadow-2xl border-2 border-orange-100" data-testid="food-recommendations">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-2">
              <Utensils className="w-6 h-6 text-orange-600" />
              <CardTitle className="text-xl">Nutritional Guidance - Premium Lab-Certified Supplements</CardTitle>
            </div>
            <CardDescription>Third-party lab certified supplements and foods to support your recovery</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {diagnosisResult.food_recommendations.map((food, index) => {
                const isPremium = food.category === "Premium Lab-Certified Supplement";
                return (
                  <div 
                    key={index} 
                    className={`${
                      isPremium 
                        ? 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-400 ring-2 ring-amber-300' 
                        : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                    } p-4 rounded-lg border-2`} 
                    data-testid="food-item"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${isPremium ? 'bg-amber-600' : 'bg-orange-500'} p-2 rounded-lg`}>
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                          {food.food_item}
                          {isPremium && <Sparkles className="w-4 h-4 text-amber-600" />}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">{food.benefit}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${isPremium ? 'bg-amber-200 text-amber-900 border-amber-400' : ''}`}
                        >
                          {food.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Recommendations */}
      <Card className="shadow-2xl border-2 border-green-100" data-testid="recommendations">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-green-600" />
            <CardTitle className="text-xl">Medical Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">{diagnosisResult?.recommendations}</p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-900 mb-2 text-lg">Important Medical Disclaimer</p>
              <p className="text-amber-800 leading-relaxed">
                This assessment is powered by AI and provides evidence-based information for educational purposes only. 
                It should NOT replace professional medical advice, diagnosis, or treatment. Always consult with qualified 
                healthcare providers for proper medical evaluation and personalized care.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/')} variant="outline" className="flex-1 text-lg py-6" data-testid="btn-back-home">
          <Home className="mr-2 w-5 h-5" />
          Back to Home
        </Button>
        <Button
          onClick={() => {
            setStep(1);
            setFormData({
              age: "",
              sex: "",
              pregnant: null,
              primarySymptoms: [],
              symptomDuration: "",
              severity: "",
              additionalInfo: "",
              backPainLocation: null,
              amErectionDuration: null
            });
            setDiagnosisResult(null);
          }}
          className="flex-1 text-lg py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          data-testid="btn-new-assessment"
        >
          <Sparkles className="mr-2 w-5 h-5" />
          New Assessment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-8 h-8 text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">MedEvidences</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Super Intelligence Symptom Checker</h2>
            </div>
            {step < 4 && (
              <Badge variant="outline" className="text-lg px-6 py-3 border-2 border-teal-500">
                Step {step === 2.5 ? '2.5' : Math.floor(step)} of 3
              </Badge>
            )}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 2.5 && renderStep2_5()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        {/* Navigation Bar */}
        <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-4 border-teal-500" data-testid="main-nav">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-2 rounded-xl">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900 block">MedEvidences</span>
                  <span className="text-xs text-teal-600 font-medium">Super Intelligence</span>
                </div>
              </Link>
              <div className="flex gap-3">
                <Link to="/">
                  <Button variant="ghost" className="flex items-center gap-2 text-base" data-testid="nav-home">
                    <Home className="w-5 h-5" />
                    Home
                  </Button>
                </Link>
                <Link to="/symptom-checker">
                  <Button className="flex items-center gap-2 text-base bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700" data-testid="nav-symptom-checker">
                    <Activity className="w-5 h-5" />
                    Symptom Checker
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;