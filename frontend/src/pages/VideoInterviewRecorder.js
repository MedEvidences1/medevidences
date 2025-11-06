import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function VideoInterviewRecorder() {
  const [step, setStep] = useState('select-job'); // select-job, interview, results
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [answers, setAnswers] = useState([]); // Array of {question_index, video_path}
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (step === 'interview' && videoRef.current) {
      // Request camera when interview starts
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Camera error:', err);
          toast.error('Could not access camera/microphone');
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching jobs from:', `${API}/jobs`);
      const response = await axios.get(`${API}/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Jobs fetched:', response.data.length);
      setJobs(response.data);
      if (response.data.length === 0) {
        toast.info('No jobs available yet. Please check back later.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load jobs: ' + (error.response?.data?.detail || error.message));
    }
  };

  const startInterview = async () => {
    if (!selectedJob) {
      toast.error('Please select a job first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/video-interview/start`,
        { job_id: selectedJob },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setInterviewId(response.data.interview_id);
      setQuestions(response.data.questions);
      setCurrentQuestionIndex(0);
      setStep('interview');
      toast.success('Interview started! Answer each question.');
    } catch (error) {
      console.error('Start interview error:', error);
      toast.error(error.response?.data?.detail || 'Failed to start interview');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      toast.success('Recording started');
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Could not start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.success('Recording stopped');
    }
  };

  const uploadAnswer = async () => {
    if (!recordedBlob) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', recordedBlob, `answer_${currentQuestionIndex}.webm`);
      formData.append('interview_id', interviewId);
      formData.append('question_index', currentQuestionIndex);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/video-interview/upload-answer`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Save answer path
      const newAnswers = [...answers, {
        question_index: currentQuestionIndex,
        path: response.data.video_path
      }];
      setAnswers(newAnswers);

      toast.success(`Answer ${currentQuestionIndex + 1} uploaded!`);
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setRecordedBlob(null);
      } else {
        // All questions answered, complete interview
        await completeInterview(newAnswers);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const completeInterview = async (allAnswers) => {
    setProcessing(true);
    toast.info('🤖 AI is analyzing your interview...');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/video-interview/complete/${interviewId}`,
        { video_paths: allAnswers },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setResults(response.data);
      setStep('results');
      toast.success('✅ AI Analysis Complete!');
    } catch (error) {
      console.error('Complete error:', error);
      toast.error('Analysis failed: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-4">
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>🎥 AI Video Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'select-job' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold mb-2">📋 How it works:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Select a job you want to interview for</li>
                    <li>AI will generate 12 interview questions (6 health + 6 job-specific)</li>
                    <li>Record your video answer for each question (one at a time)</li>
                    <li>Videos are stored and can be reviewed by employers</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium">Select Job to Interview For:</label>
                  <Select value={selectedJob || ''} onValueChange={setSelectedJob}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a job..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={startInterview} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedJob}
                >
                  🚀 Start AI Interview
                </Button>
              </>
            )}

            {step === 'interview' && !results && (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="font-bold">Question {currentQuestionIndex + 1} of {questions.length}</p>
                  <p className="text-lg mt-2">{questions[currentQuestionIndex]}</p>
                </div>

                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-96 object-cover"
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  {!recording && !recordedBlob && (
                    <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                      🔴 Record Answer
                    </Button>
                  )}
                  {recording && (
                    <Button onClick={stopRecording} className="bg-gray-600 hover:bg-gray-700">
                      ⏹️ Stop Recording
                    </Button>
                  )}
                  {recordedBlob && !uploading && !processing && (
                    <>
                      <Button onClick={() => setRecordedBlob(null)} variant="outline">
                        🔄 Re-record
                      </Button>
                      <Button onClick={uploadAnswer} className="bg-blue-600 hover:bg-blue-700">
                        {currentQuestionIndex < questions.length - 1 ? '➡️ Next Question' : '✅ Submit Interview'}
                      </Button>
                    </>
                  )}
                  {uploading && <Button disabled>Uploading...</Button>}
                  {processing && <Button disabled>🤖 AI Analyzing...</Button>}
                </div>

                {recordedBlob && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">✅ Answer recorded! Click next to continue.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {answers.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 flex-1 rounded ${index === currentQuestionIndex ? 'bg-blue-500' : index < currentQuestionIndex ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                  ))}
                  {Array.from({ length: questions.length - answers.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className={`h-2 flex-1 rounded ${answers.length + index === currentQuestionIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {step === 'results' && results && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">✅ Interview Analysis Complete!</h3>
                  <p className="text-sm">Your AI vetting score: <span className="font-bold text-2xl">{results.analysis.overall_score}/100</span></p>
                  <p className="text-sm mt-2">Hire Decision: <span className="font-bold">{results.analysis.hire_decision}</span></p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>📊 Detailed Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Communication</p>
                        <p className="text-xl font-bold">{results.analysis.communication_score}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Technical Knowledge</p>
                        <p className="text-xl font-bold">{results.analysis.technical_knowledge_score}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Problem Solving</p>
                        <p className="text-xl font-bold">{results.analysis.problem_solving_score}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="text-xl font-bold">{results.analysis.confidence_score}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Job Fit</p>
                        <p className="text-xl font-bold">{results.analysis.job_fit_score}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>💪 Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {results.analysis.strengths.map((s, i) => (
                        <li key={i} className="text-green-700">{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📈 Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {results.analysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-orange-600">{w}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>💡 Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {results.analysis.key_insights.map((insight, i) => (
                        <li key={i} className="text-blue-700">{insight}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-bold">Recommendation:</p>
                  <p className="text-lg">{results.analysis.recommendation}</p>
                  <p className="text-sm mt-2 text-gray-600">{results.analysis.reasoning}</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => {
                    setStep('select-job');
                    setRecordedBlob(null);
                    setAnswers([]);
                    setResults(null);
                    setQuestions([]);
                    setCurrentQuestionIndex(0);
                  }} variant="outline" className="flex-1">
                    🔄 New Interview
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} className="flex-1">
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
