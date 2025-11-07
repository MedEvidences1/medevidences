import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, MapPin, Clock, DollarSign, Building, Globe } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to format dates as "X days ago"
const formatDaysAgo = (dateString) => {
  if (!dateString) return 'Recently posted';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1 day ago';
  if (diffDays < 30) return `Posted ${diffDays} days ago`;
  if (diffDays < 60) return 'Posted 1 month ago';
  if (diffDays < 365) return `Posted ${Math.floor(diffDays / 30)} months ago`;
  return `Posted ${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
};

function JobDetails({ user, onLogout }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await axios.get(`${API}/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }

    if (user.role !== 'candidate') {
      toast.error('Only candidates can apply to jobs');
      return;
    }

    setApplying(true);
    try {
      await axios.post(`${API}/applications`, {
        job_id: jobId,
        cover_letter: coverLetter
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Application submitted successfully! MedEvidences admin will review and forward your profile to the employer.', { duration: 5000 });
      setDialogOpen(false);
      setCoverLetter('');
    } catch (error) {
      console.error('Application error:', error);
      
      const errorMessage = error.response?.data?.detail || 'Failed to submit application';
      
      // Check if it's a subscription error (402 Payment Required)
      if (error.response?.status === 402) {
        toast.error(errorMessage);
        // Save the job ID so we can return after subscription
        sessionStorage.setItem('pendingJobApplication', jobId);
        // Redirect to subscription page
        setTimeout(() => {
          navigate('/subscription');
        }, 2000);
      } else if (error.response?.status === 400) {
        // Validation errors - show detailed message
        toast.error(errorMessage, { duration: 6000 });
        
        // If it's about missing requirements, redirect to dashboard after a delay
        if (errorMessage.includes('Resume required') || 
            errorMessage.includes('Health documents required') || 
            errorMessage.includes('AI Video Interview required')) {
          setTimeout(() => {
            toast.info('Redirecting to your dashboard to complete requirements...');
            navigate('/dashboard/candidate');
          }, 3000);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500" data-testid="loading-message">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return null;
  }

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
              <Link to="/jobs">
                <Button variant="ghost" data-testid="browse-jobs-link">Browse Jobs</Button>
              </Link>
              {user ? (
                <>
                  <Link to={user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer'}>
                    <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
                  </Link>
                  <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" data-testid="login-link">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button data-testid="register-link">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card data-testid="job-details-card">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2" data-testid="job-title">{job.title}</CardTitle>
                <CardDescription className="text-lg" data-testid="company-name">{job.company_name}</CardDescription>
              </div>
              {user && user.role === 'candidate' && (
                <div className="flex flex-col gap-2">
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => {
                      // Save job ID to localStorage for video interview
                      localStorage.setItem('selectedJobForInterview', jobId);
                      navigate('/video-interview');
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                    data-testid="start-interview-button"
                  >
                    🎥 Start AI Interview
                  </Button>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" data-testid="apply-button">Apply Now</Button>
                    </DialogTrigger>
                  <DialogContent data-testid="apply-dialog">
                    <DialogHeader>
                      <DialogTitle data-testid="dialog-title">Apply for {job.title}</DialogTitle>
                      <DialogDescription data-testid="dialog-description">
                        Submit your application with a cover letter
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cover_letter">Cover Letter (Optional)</Label>
                        <Textarea
                          id="cover_letter"
                          placeholder="Tell the employer why you're a great fit..."
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={6}
                          data-testid="cover-letter-input"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-button">
                          Cancel
                        </Button>
                        <Button onClick={handleApply} disabled={applying} data-testid="submit-application-button">
                          {applying ? 'Submitting...' : 'Submit Application'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <Badge variant="secondary" className="text-sm" data-testid="job-category">{job.category}</Badge>
              {job.employment_type && (
                <Badge 
                  variant={job.employment_type === 'Contractual' ? 'outline' : 'default'}
                  className={job.employment_type === 'Contractual' ? 'border-orange-400 text-orange-600 text-sm' : 'bg-green-100 text-green-700 text-sm'}
                  data-testid="employment-type"
                >
                  {job.employment_type}
                </Badge>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="w-4 h-4 mr-2" />
                <span data-testid="job-type">{job.job_type}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span data-testid="job-location">{job.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span data-testid="experience-required">{job.experience_required}</span>
              </div>
              {job.salary_range && (
                <div className="flex items-center text-sm text-green-600 font-semibold">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span data-testid="salary-range">{job.salary_range}</span>
                </div>
              )}
            </div>
            
            {/* Posting Date */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="w-4 h-4 mr-2" />
              <span data-testid="posted-date">{formatDaysAgo(job.posted_at)}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-semibold mb-4" data-testid="company-info-title">About the Company</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <Building className="w-5 h-5 mr-3 text-gray-400" />
                  <span data-testid="company-type">{job.company_type}</span>
                </div>
                {job.company_location && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                    <span data-testid="company-location">{job.company_location}</span>
                  </div>
                )}
                {job.company_website && job.company_website !== 'https://example.com' && (
                  <div className="flex items-center text-gray-700">
                    <Globe className="w-5 h-5 mr-3 text-gray-400" />
                    <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" data-testid="company-website">
                      {job.company_website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-xl font-semibold mb-4" data-testid="description-title">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-line" data-testid="job-description">{job.description}</p>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-xl font-semibold mb-4" data-testid="requirements-title">Requirements</h3>
              <ul className="list-disc list-inside space-y-2" data-testid="requirements-list">
                {job.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>

            {/* Skills Required */}
            <div>
              <h3 className="text-xl font-semibold mb-4" data-testid="skills-title">Skills Required</h3>
              <div className="flex flex-wrap gap-2" data-testid="skills-list">
                {job.skills_required.map((skill, index) => (
                  <Badge key={index} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default JobDetails;
