import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

export default function VideoInterviewRecorder() {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [results, setResults] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Request camera permission
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

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const uploadVideo = async () => {
    if (!recordedBlob) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', recordedBlob, 'interview.webm');
      formData.append('job_id', 'self-interview');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/video-interview/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setInterviewId(response.data.interview_id);
      toast.success('Video uploaded successfully!');
      
      // Auto-start transcription
      await transcribeVideo(response.data.interview_id);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const transcribeVideo = async (id) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/video-interview/transcribe/${id}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setResults(response.data);
      toast.success('✅ AI Analysis Complete!');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Processing failed: ' + (error.response?.data?.detail || 'Unknown error'));
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
            {!results ? (
              <>
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
                      🔴 Start Recording
                    </Button>
                  )}
                  {recording && (
                    <Button onClick={stopRecording} className="bg-gray-600 hover:bg-gray-700">
                      ⏹️ Stop Recording
                    </Button>
                  )}
                  {recordedBlob && !uploading && (
                    <Button onClick={uploadVideo} className="bg-blue-600 hover:bg-blue-700">
                      📤 Upload & Analyze
                    </Button>
                  )}
                  {uploading && <Button disabled>Uploading...</Button>}
                  {processing && <Button disabled>🤖 AI Processing...</Button>}
                </div>

                {recordedBlob && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">✅ Video recorded! Click "Upload & Analyze" to get AI vetting.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">✅ Interview Analysis Complete!</h3>
                  <p className="text-sm">Your AI vetting score: <span className="font-bold text-2xl">{results.analysis.overall_score}/100</span></p>
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-bold">Recommendation:</p>
                  <p className="text-lg">{results.analysis.recommendation}</p>
                </div>

                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
