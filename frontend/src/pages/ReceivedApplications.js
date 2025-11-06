import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Briefcase, GraduationCap, MapPin, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-green-500 text-white'
};

function ReceivedApplications({ user, onLogout }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications/received`);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewDetails = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/applications/${applicationId}/interview-details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setInterviewDetails(response.data);
      setShowInterviewModal(true);
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast.error('No interview found for this candidate');
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${applicationId}/status?status=${newStatus}`);
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/">
              <h1 className="text-2xl font-bold text-blue-600" data-testid="logo">MedEvidences</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/employer">
                <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
              </Link>
              <Link to="/candidates">
                <Button variant="ghost" data-testid="browse-candidates-link">Browse Candidates</Button>
              </Link>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="page-title">Received Applications</h2>
          <p className="text-gray-600 mt-2" data-testid="page-subtitle">Review and manage candidate applications</p>
        </div>

        {loading ? (
          <div className="text-center py-12" data-testid="loading-message">
            <p className="text-gray-500">Loading applications...</p>
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4" data-testid="applications-list">
            {applications.map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow" data-testid={`application-card-${app.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <CardTitle className="text-xl" data-testid={`candidate-name-${app.id}`}>{app.candidate_name}</CardTitle>
                      </div>
                      <CardDescription data-testid={`job-title-${app.id}`}>Applied for: {app.job_title}</CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[app.status]} data-testid={`status-${app.id}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span data-testid={`specialization-${app.id}`}>{app.candidate_specialization}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        <span data-testid={`experience-${app.id}`}>{app.candidate_experience} years experience</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span data-testid={`applied-date-${app.id}`}>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium" data-testid={`email-${app.id}`}>{app.candidate_email}</span>
                      </div>
                    </div>

                    {app.cover_letter && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Cover Letter</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded" data-testid={`cover-letter-${app.id}`}>{app.cover_letter}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
                      <span className="text-sm text-gray-600 mr-2">Update Status:</span>
                      <Select value={app.status} onValueChange={(value) => handleStatusUpdate(app.id, value)}>
                        <SelectTrigger className="w-40" data-testid={`status-select-${app.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => fetchInterviewDetails(app.id)} 
                        variant="outline" 
                        size="sm"
                        className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                      >
                        🎥 View AI Interview
                      </Button>
                      <Link to={`/candidates/${app.candidate_id}`} className="ml-auto">
                        <Button variant="outline" size="sm" data-testid={`view-profile-${app.id}`}>View Profile</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-applications-message">
            <p className="text-gray-500 text-lg">No applications received yet</p>
            <p className="text-gray-400 text-sm mt-2">Post jobs to start receiving applications</p>
          </div>
        )}

        {/* AI Interview Modal */}
        <Dialog open={showInterviewModal} onOpenChange={setShowInterviewModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🤖 AI Interview Analysis</DialogTitle>
            </DialogHeader>
            {interviewDetails && (
              <div className="space-y-4">
                {interviewDetails.interviews.length > 0 ? (
                  interviewDetails.interviews.map((interview, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-bold text-lg">Interview for: {interview.job_title}</h3>
                        <p className="text-sm text-gray-600">Completed: {new Date(interview.completed_at).toLocaleString()}</p>
                      </div>

                      {interview.ai_analysis && (
                        <>
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-600">Overall AI Vetting Score</p>
                                <p className="text-4xl font-bold text-blue-600">{interview.ai_analysis.overall_score}/100</p>
                              </div>
                              <div>
                                <Badge className={
                                  interview.ai_analysis.hire_decision.includes('Strong Yes') ? 'bg-green-600' :
                                  interview.ai_analysis.hire_decision.includes('Yes') ? 'bg-green-500' :
                                  interview.ai_analysis.hire_decision.includes('Maybe') ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }>
                                  {interview.ai_analysis.hire_decision}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-gray-600">Communication</p>
                                <p className="text-2xl font-bold">{interview.ai_analysis.communication_score}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-gray-600">Technical</p>
                                <p className="text-2xl font-bold">{interview.ai_analysis.technical_knowledge_score}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-gray-600">Problem Solving</p>
                                <p className="text-2xl font-bold">{interview.ai_analysis.problem_solving_score}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-gray-600">Confidence</p>
                                <p className="text-2xl font-bold">{interview.ai_analysis.confidence_score}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-sm text-gray-600">Job Fit</p>
                                <p className="text-2xl font-bold">{interview.ai_analysis.job_fit_score}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <Card>
                            <CardHeader>
                              <CardTitle>💪 Strengths</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-1">
                                {interview.ai_analysis.strengths.map((s, i) => (
                                  <li key={i} className="text-green-700">{s}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>📈 Areas for Development</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-1">
                                {interview.ai_analysis.weaknesses.map((w, i) => (
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
                                {interview.ai_analysis.key_insights.map((insight, i) => (
                                  <li key={i} className="text-blue-700">{insight}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="font-bold">AI Recommendation:</p>
                            <p className="text-lg">{interview.ai_analysis.recommendation}</p>
                            <p className="text-sm text-gray-600 mt-2">{interview.ai_analysis.reasoning}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">This candidate hasn't completed a video interview yet.</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ReceivedApplications;
