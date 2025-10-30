import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { toast } from 'sonner';
import { Brain, CheckCircle } from 'lucide-react';

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
    if (!answers[currentQuestion] || answers[currentQuestion].trim().length < 50) {
      toast.error('Please provide a detailed answer (minimum 50 characters)');
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
    if (!answers[currentQuestion] || answers[currentQuestion].trim().length < 50) {
      toast.error('Please provide a detailed answer for the current question');
      return;
    }

    // Check if all questions are answered
    const unanswered = questions.filter((_, index) => !answers[index] || answers[index].trim().length < 50);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedQuestions = questions.map((q, index) => ({
        question: q.question,
        answer: answers[index],
        score: Math.floor(Math.random() * 3) + 7 // Mock score 7-10 (in real app, would be AI-evaluated)
      }));

      await axios.post(`${API}/interview/submit`, {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading interview...</p>
      </div>
    );
  }

  if (completed) {
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

        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Interview Completed!</CardTitle>
              <CardDescription>
                Thank you for completing the AI interview
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interviewStatus && interviewStatus.score && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Your Score</p>
                  <p className="text-4xl font-bold text-blue-600">{interviewStatus.score.toFixed(1)}/10</p>
                </div>
              )}
              <p className="text-gray-700 mb-6">
                Your responses have been recorded and will be used to match you with the best opportunities.
                Our AI system has analyzed your answers to better understand your skills and experience.
              </p>
              <div className="space-y-3">
                <Link to="/dashboard/candidate">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Link to="/jobs">
                  <Button variant="outline" className="w-full">Browse Jobs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardDescription>
              Take your time to provide thoughtful, detailed answers. Your responses help us match you with the right opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-4 block">
                  {questions[currentQuestion].question}
                </Label>
                <Textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Provide a detailed answer (minimum 50 characters)..."
                  rows={8}
                  className="text-base"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {(answers[currentQuestion] || '').length} characters
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>

                <div className="space-x-2">
                  {currentQuestion < questions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next Question
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Interview'}
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
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentQuestion
                        ? 'bg-blue-600 w-8'
                        : answers[index]
                        ? 'bg-green-400'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Interview Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific and provide examples from your experience</li>
            <li>• Highlight your skills and achievements</li>
            <li>• Show your passion and motivation for the field</li>
            <li>• Use professional language and check for typos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AIInterview;
