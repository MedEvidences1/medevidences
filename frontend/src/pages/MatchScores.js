import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function MatchScores() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(jobId || '');
  const [matches, setMatches] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchMatchScores();
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/employers/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0].id);
      }
    } catch (error) {
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchScores = async () => {
    if (!selectedJob) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/matching/scores/${selectedJob}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching match scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScores = async () => {
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/matching/generate-scores/${selectedJob}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Match scores generated successfully!');
        await fetchMatchScores();
      } else {
        toast.error(data.detail || 'Failed to generate scores');
      }
    } catch (error) {
      toast.error('Error generating scores: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/employer-dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            AI Candidate Matching
          </h1>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={generateScores}
                disabled={!selectedJob || generating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {generating ? 'Generating AI Scores...' : 'Generate Match Scores'}
              </button>
            </div>
          </div>

          {selectedJob && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Match Results</h2>
                <span className="text-sm text-gray-600">
                  {matches.length} candidate{matches.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No match scores available yet.</p>
                  <p className="text-sm mt-2">Click "Generate Match Scores" to analyze candidates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match, idx) => (
                    <div
                      key={match.candidate_id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-700">
                              #{idx + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {match.candidate_name || 'Unknown Candidate'}
                            </h3>
                          </div>
                          
                          {match.candidate_specialization && (
                            <p className="text-sm text-gray-600 mt-1">
                              {match.candidate_specialization} • {match.candidate_experience || 0} years experience
                            </p>
                          )}

                          {match.ai_reasoning && (
                            <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">
                              {match.ai_reasoning}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              Skills: {match.skills_match}%
                            </div>
                            <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                              Experience: {match.experience_match}%
                            </div>
                            <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                              Education: {match.education_match}%
                            </div>
                            {match.ai_interview_score && (
                              <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                                Interview: {match.ai_interview_score}%
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          <div className={`text-center px-4 py-2 rounded-lg ${getScoreColor(match.overall_score)}`}>
                            <div className="text-2xl font-bold">
                              {Math.round(match.overall_score)}
                            </div>
                            <div className="text-xs font-medium">Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
