import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Brain, CheckCircle, Award, TrendingUp, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AIInterview({ user, onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      navigate('/login');
      return;
    }
    checkInterviewStatus();
    fetchProfile();
  }, [user, navigate]);

  const checkInterviewStatus = async () => {
    try {
      const response = await axios.get(`${API}/interview/status`);
      setInterviewStatus(response.data);
      if (response.data.completed) {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Error checking interview status:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/candidates/profile`);
      setProfile(response.data);
      fetchQuestions(response.data.specialization);
    } catch (error) {
      toast.error('Please complete your profile first');
      navigate('/dashboard/candidate');
    }
  };

  const fetchQuestions = async (specialization) => {
    try {
      const response = await axios.get(`${API}/interview/questions?specialization=${specialization}`);
      setQuestions(response.data.questions);
      setInstructions(response.data.instructions);
      setTotalDuration(response.data.total_duration_minutes);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load interview questions');
    }
  };

  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [currentQuestion]: value
    });
  };

  const handleNext = () => {
    if (!answers[currentQuestion] || answers[currentQuestion].trim().length < 100) {
      toast.error('Please provide a detailed answer (minimum 100 characters)');
      return;
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!answers[currentQuestion] || answers[currentQuestion].trim().length < 100) {
      toast.error('Please provide a detailed answer for the current question');
      return;
    }

    // Check if all questions are answered
    const unanswered = questions.filter((_, index) => !answers[index] || answers[index].trim().length < 100);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions with detailed responses. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedQuestions = questions.map((q, index) => ({
        question: q.question,
        answer: answers[index],
        score: calculateScore(answers[index]) // Calculate based on answer quality
      }));

      const response = await axios.post(`${API}/interview/submit`, {
        specialization: profile.specialization,
        questions: formattedQuestions
      });

      toast.success('Interview completed successfully!');
      setCompleted(true);
      checkInterviewStatus();
    } catch (error) {
      console.error('Error submitting interview:', error);
      toast.error('Failed to submit interview');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateScore = (answer) => {
    // Simple scoring based on answer length and quality indicators
    const length = answer.length;
    let score = 7; // Base score
    
    if (length > 500) score += 1;
    if (length > 800) score += 1;
    if (answer.includes('example') || answer.includes('specifically')) score += 0.5;
    if (answer.split('.').length > 5) score += 0.5; // Multiple sentences
    
    return Math.min(10, score);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading interview...</p>
      </div>
    );
  }

  if (completed && interviewStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/">
                <h1 className="text-2xl font-bold text-blue-600">MedEvidences</h1>
              </Link>
              <Link to="/dashboard/candidate">
                <Button variant="ghost">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl">Interview Completed!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Your responses have been analyzed by our AI system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Overall Scores */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Overall Score</p>
                  <p className="text-5xl font-bold text-blue-600">{interviewStatus.score?.toFixed(1)}/10</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">AI Vetting Score</p>
                  <p className="text-5xl font-bold text-purple-600">{interviewStatus.ai_vetting_score?.toFixed(1)}/10</p>
                </div>
              </div>

              {/* Recommendation */}
              {interviewStatus.recommendation && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Award className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-green-900">AI Recommendation</h3>
                  </div>
                  <p className="text-lg text-green-800 font-medium">{interviewStatus.recommendation}</p>
                </div>
              )}

              {/* Performance Analysis */}
              {interviewStatus.performance_analysis && (
                <div className="text-left">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Performance Breakdown
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Communication</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {interviewStatus.performance_analysis.communication}/10
                      </p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Technical Skills</p>
                      <p className="text-3xl font-bold text-green-600">
                        {interviewStatus.performance_analysis.technical}/10
                      </p>
                    </div>
                    <div className="p-4 bg-white border rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Problem Solving</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {interviewStatus.performance_analysis.problem_solving}/10
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths */}
              {interviewStatus.strengths && interviewStatus.strengths.length > 0 && (
                <div className="text-left">
                  <h3 className="text-lg font-bold mb-3 text-green-700">✓ Key Strengths</h3>
                  <div className="space-y-2">
                    {interviewStatus.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-gray-700">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {interviewStatus.areas_for_improvement && interviewStatus.areas_for_improvement.length > 0 && (
                <div className="text-left">
                  <h3 className="text-lg font-bold mb-3 text-orange-700">→ Areas for Growth</h3>
                  <div className="space-y-2">
                    {interviewStatus.areas_for_improvement.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 rounded">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <p className="text-gray-700">{area}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What's Next */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">What's Next?</h3>
                <p className="text-gray-700 mb-6">
                  Your profile is now AI-vetted and searchable by companies. You'll receive notifications when companies view your profile or when you match with new opportunities.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/matched-jobs">
                    <Button className="w-full" size="lg">View Matched Jobs</Button>
                  </Link>
                  <Link to="/dashboard/candidate">
                    <Button variant="outline" className="w-full" size="lg">Go to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/">
              <h1 className="text-2xl font-bold text-blue-600">MedEvidences</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium">AI Interview</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Interview Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">In-Depth AI Interview</h3>
                <p className="text-sm text-gray-600">8 comprehensive questions • {totalDuration} minutes total</p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="text-sm">
                  Expected Duration: {currentQ.duration}
                </Badge>
                <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
              </div>
              <CardTitle className="text-2xl leading-relaxed">
                {currentQ.question}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">
                  Your Response (minimum 100 characters for detailed answer)
                </Label>
                <Textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Provide a comprehensive, detailed answer with specific examples from your experience. The AI will analyze the depth of your response, communication clarity, and technical knowledge demonstrated."
                  rows={12}
                  className="text-base leading-relaxed"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {(answers[currentQuestion] || '').length} characters
                  </p>
                  {(answers[currentQuestion] || '').length >= 100 && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Good detail
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous Question
                </Button>

                <div className="space-x-2">
                  {currentQuestion < questions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next Question
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting} size="lg">
                      {submitting ? 'Analyzing Responses...' : 'Submit Interview'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Question Navigation Dots */}
              <div className="flex justify-center space-x-2 pt-4">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentQuestion
                        ? 'bg-blue-600 w-8'
                        : answers[index] && answers[index].length >= 100
                        ? 'bg-green-400 w-2'
                        : 'bg-gray-300 w-2'
                    }`}
                    title={`Question ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Tips */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Interview Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• <strong>Be specific:</strong> Provide concrete examples from your experience</li>
              <li>• <strong>Show depth:</strong> Explain your thought process and decision-making</li>
              <li>• <strong>Demonstrate expertise:</strong> Use technical terms appropriately</li>
              <li>• <strong>Structure your response:</strong> Use clear paragraphs for complex answers</li>
              <li>• <strong>Quality over quantity:</strong> Focus on relevant, detailed information</li>
            </ul>
            <p className="text-xs text-blue-700 mt-3 italic">
              {instructions}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AIInterview;
