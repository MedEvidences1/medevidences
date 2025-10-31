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
import { Loader2, Activity, Home, AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">AI Symptom Checker</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized health insights in minutes with our AI-powered symptom analysis
          </p>
        </div>

        <div className="max-w-md mx-auto mb-12">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Start Your Assessment</CardTitle>
              <CardDescription>Answer a few questions about your symptoms</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/symptom-checker')} 
                className="w-full text-lg py-6"
                data-testid="start-assessment-btn"
              >
                Begin Symptom Check
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card data-testid="feature-card-fast">
            <CardHeader>
              <Clock className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>Fast & Easy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Complete assessment in just 3 minutes</p>
            </CardContent>
          </Card>

          <Card data-testid="feature-card-ai">
            <CardHeader>
              <Activity className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Advanced medical AI for accurate insights</p>
            </CardContent>
          </Card>

          <Card data-testid="feature-card-personalized">
            <CardHeader>
              <CheckCircle className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>Personalized</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Tailored to your age, sex, and symptoms</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>⚠️ This tool provides information only. Always consult healthcare professionals for medical advice.</p>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  const [formData, setFormData] = useState({
    age: "",
    sex: "",
    pregnant: null,
    primarySymptoms: [],
    symptomDuration: "",
    severity: "",
    additionalInfo: ""
  });

  useEffect(() => {
    fetchCommonSymptoms();
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
        return "text-red-600 bg-red-50";
      case "Urgent":
        return "text-orange-600 bg-orange-50";
      case "Schedule Appointment":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case "Emergency":
        return <AlertCircle className="w-6 h-6" />;
      case "Urgent":
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  const renderStep1 = () => (
    <Card className="max-w-2xl mx-auto" data-testid="step-personal-info">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Help us personalize your assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            data-testid="input-age"
          />
        </div>

        <div>
          <Label htmlFor="sex">Biological Sex</Label>
          <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
            <SelectTrigger data-testid="select-sex">
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.sex === "female" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pregnant"
              checked={formData.pregnant === true}
              onCheckedChange={(checked) => setFormData({...formData, pregnant: checked})}
              data-testid="checkbox-pregnant"
            />
            <Label htmlFor="pregnant">Currently pregnant</Label>
          </div>
        )}

        <Button
          onClick={() => setStep(2)}
          disabled={!formData.age || !formData.sex}
          className="w-full"
          data-testid="btn-next-step1"
        >
          Next
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="max-w-3xl mx-auto" data-testid="step-symptoms">
      <CardHeader>
        <CardTitle>Select Your Symptoms</CardTitle>
        <CardDescription>Choose all symptoms you're experiencing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-symptom-search"
        />

        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredSymptoms.map((symptom) => (
              <div
                key={symptom}
                onClick={() => handleSymptomToggle(symptom)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  formData.primarySymptoms.includes(symptom)
                    ? "bg-blue-100 border-2 border-blue-500"
                    : "bg-gray-50 border-2 border-gray-200 hover:border-blue-300"
                }`}
                data-testid={`symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-sm">{symptom}</span>
              </div>
            ))}
          </div>
        </div>

        {formData.primarySymptoms.length > 0 && (
          <div className="mt-4">
            <Label>Selected Symptoms ({formData.primarySymptoms.length}):</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.primarySymptoms.map((symptom) => (
                <Badge key={symptom} variant="secondary" data-testid="selected-symptom">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => setStep(1)} variant="outline" className="flex-1" data-testid="btn-back-step2">
            Back
          </Button>
          <Button
            onClick={() => setStep(3)}
            disabled={formData.primarySymptoms.length === 0}
            className="flex-1"
            data-testid="btn-next-step2"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="max-w-2xl mx-auto" data-testid="step-details">
      <CardHeader>
        <CardTitle>Additional Details</CardTitle>
        <CardDescription>Tell us more about your symptoms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="duration">How long have you had these symptoms?</Label>
          <Select value={formData.symptomDuration} onValueChange={(value) => setFormData({...formData, symptomDuration: value})}>
            <SelectTrigger data-testid="select-duration">
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

        <div>
          <Label htmlFor="severity">How severe are your symptoms?</Label>
          <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
            <SelectTrigger data-testid="select-severity">
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

        <div>
          <Label htmlFor="additional">Any additional information? (Optional)</Label>
          <Textarea
            id="additional"
            placeholder="Describe any other relevant details..."
            value={formData.additionalInfo}
            onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
            rows={4}
            data-testid="textarea-additional"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setStep(2)} variant="outline" className="flex-1" data-testid="btn-back-step3">
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.symptomDuration || !formData.severity}
            className="flex-1"
            data-testid="btn-submit-analysis"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Get Results"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="results-page">
      <Card className={`${getUrgencyColor(diagnosisResult?.urgency_level)} border-2`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getUrgencyIcon(diagnosisResult?.urgency_level)}
            <div>
              <CardTitle className="text-2xl">Urgency Level: {diagnosisResult?.urgency_level}</CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Based on your symptoms analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card data-testid="possible-conditions">
        <CardHeader>
          <CardTitle>Possible Conditions</CardTitle>
          <CardDescription>These are potential causes based on your symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnosisResult?.possible_conditions?.map((condition, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2" data-testid="condition-item">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{condition.name}</h3>
                <Badge variant={condition.probability === "High" ? "destructive" : "secondary"}>
                  {condition.probability} Probability
                </Badge>
              </div>
              <p className="text-gray-600 text-sm">{condition.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-testid="recommendations">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-line">{diagnosisResult?.recommendations}</p>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">Important Disclaimer</p>
              <p className="text-sm text-yellow-800">
                This assessment is for informational purposes only and should not replace professional medical advice. 
                Always consult with a healthcare provider for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => navigate('/')} variant="outline" className="flex-1" data-testid="btn-back-home">
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
              additionalInfo: ""
            });
            setDiagnosisResult(null);
          }}
          className="flex-1"
          data-testid="btn-new-assessment"
        >
          New Assessment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900">Symptom Checker</h2>
            {step < 4 && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                Step {step} of 3
              </Badge>
            )}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
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
        <nav className="bg-white shadow-md sticky top-0 z-50" data-testid="main-nav">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Activity className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">HealthCheck AI</span>
              </div>
              <div className="flex gap-4">
                <Link to="/">
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="nav-home">
                    <Home className="w-4 h-4" />
                    Home
                  </Button>
                </Link>
                <Link to="/symptom-checker">
                  <Button className="flex items-center gap-2" data-testid="nav-symptom-checker">
                    <Activity className="w-4 h-4" />
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