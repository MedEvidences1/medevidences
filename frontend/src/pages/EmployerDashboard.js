import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, Users, FileText, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function EmployerDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: '',
    description: '',
    location: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchJobs();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/employers/profile`);
      setProfile(response.data);
      setFormData({
        company_name: response.data.company_name,
        company_type: response.data.company_type,
        description: response.data.description || '',
        location: response.data.location || '',
        website: response.data.website || ''
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setIsEditing(true);
      }
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/employers/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (profile) {
        await axios.put(`${API}/employers/profile`, formData);
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`${API}/employers/profile`, formData);
        toast.success('Profile created successfully!');
      }
      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      await axios.delete(`${API}/jobs/${jobId}`);
      toast.success('Job deleted successfully!');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
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
              <Link to="/post-job">
                <Button data-testid="post-job-link">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              </Link>
              <Link to="/candidates">
                <Button variant="ghost" data-testid="browse-candidates-link">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Candidates
                </Button>
              </Link>
              <Link to="/received-applications">
                <Button variant="ghost" data-testid="applications-link">
                  <FileText className="w-4 h-4 mr-2" />
                  Applications
                </Button>
              </Link>
              <Link to="/match-scores">
                <Button variant="ghost" className="bg-purple-50 hover:bg-purple-100">
                  <Users className="w-4 h-4 mr-2" />
                  AI Matching
                </Button>
              </Link>
              <Link to="/payroll-tracking">
                <Button variant="ghost">
                  Payroll
                </Button>
              </Link>
              <Link to="/mercor-jobs">
                <Button variant="ghost" className="bg-orange-50 hover:bg-orange-100">
                  📥 Import from Mercor
                </Button>
              </Link>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Employer Dashboard</h2>
          <p className="text-gray-600 mt-2" data-testid="welcome-message">Welcome back, {user.full_name}!</p>
        </div>

        <div className="space-y-6">
          {/* Company Profile */}
          <Card data-testid="profile-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle data-testid="profile-title">Company Profile</CardTitle>
                  <CardDescription data-testid="profile-description">
                    {profile ? 'Manage your company information' : 'Create your company profile to start posting jobs'}
                  </CardDescription>
                </div>
                {profile && !isEditing && (
                  <Button onClick={() => setIsEditing(true)} data-testid="edit-profile-button">Edit Profile</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        required
                        data-testid="company-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_type">Company Type *</Label>
                      <Input
                        id="company_type"
                        placeholder="e.g., Hospital, Research Lab, University"
                        value={formData.company_type}
                        onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                        required
                        data-testid="company-type-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell candidates about your organization..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      data-testid="description-input"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Boston, MA"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        data-testid="location-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        data-testid="website-input"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={loading} data-testid="save-profile-button">
                      {loading ? 'Saving...' : 'Save Profile'}
                    </Button>
                    {profile && (
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)} data-testid="cancel-edit-button">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Company Name</h4>
                      <p className="text-gray-900" data-testid="profile-company-name">{profile.company_name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Type</h4>
                      <p className="text-gray-900" data-testid="profile-company-type">{profile.company_type}</p>
                    </div>
                  </div>
                  {profile.description && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Description</h4>
                      <p className="text-gray-900" data-testid="profile-description">{profile.description}</p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.location && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500 mb-1">Location</h4>
                        <p className="text-gray-900" data-testid="profile-location">{profile.location}</p>
                      </div>
                    )}
                    {profile.website && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500 mb-1">Website</h4>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" data-testid="profile-website">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500" data-testid="no-profile-message">No profile created yet. Click "Edit Profile" to get started.</p>
              )}
            </CardContent>
          </Card>

          {/* Posted Jobs */}
          <Card data-testid="jobs-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle data-testid="jobs-title">Your Posted Jobs</CardTitle>
                  <CardDescription data-testid="jobs-description">Manage your job postings</CardDescription>
                </div>
                <Link to="/post-job">
                  <Button data-testid="post-new-job-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="space-y-4" data-testid="jobs-list">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`job-item-${job.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900" data-testid={`job-title-${job.id}`}>{job.title}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{job.category}</Badge>
                            <Badge variant="outline">{job.job_type}</Badge>
                            <span className="text-sm text-gray-500">{job.location}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Link to={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm" data-testid={`view-job-${job.id}`}>View</Button>
                          </Link>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteJob(job.id)} data-testid={`delete-job-${job.id}`}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8" data-testid="no-jobs-message">No jobs posted yet. Create your first job posting to start hiring!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default EmployerDashboard;
