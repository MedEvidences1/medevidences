import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, User, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  'Doctors/Physicians',
  'Medicine & Medical Research',
  'Scientific Research',
  'Nutrition & Dietetics',
  'Physics',
  'Consulting',
  'Teaching & Academia',
  'Chemistry',
  'Medical Tutoring',
  'Behavioral Science',
  'Mathematics'
];

function CandidateDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    experience_years: 0,
    skills: '',
    education: '',
    bio: '',
    location: '',
    publications: '',
    certifications: '',
    availability: 'Full-time',
    salary_expectation: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify user role
    if (user && user.role !== 'candidate') {
      toast.error('Access denied. This page is for candidates only.');
      setTimeout(() => {
        if (user.role === 'employer') {
          navigate('/dashboard/employer');
        } else if (user.email === 'admin@medevidences.com') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 2000);
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/candidates/profile`);
      setProfile(response.data);
      setFormData({
        specialization: response.data.specialization,
        experience_years: response.data.experience_years,
        skills: response.data.skills.join(', '),
        education: response.data.education,
        bio: response.data.bio || '',
        location: response.data.location || '',
        publications: response.data.publications.join(', '),
        certifications: response.data.certifications.join(', '),
        availability: response.data.availability,
        salary_expectation: response.data.salary_expectation || ''
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setIsEditing(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const profileData = {
      specialization: formData.specialization,
      experience_years: parseInt(formData.experience_years),
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      education: formData.education,
      bio: formData.bio,
      location: formData.location,
      publications: formData.publications ? formData.publications.split(',').map(s => s.trim()).filter(s => s) : [],
      certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(s => s) : [],
      availability: formData.availability,
      salary_expectation: formData.salary_expectation
    };

    try {
      if (profile) {
        await axios.put(`${API}/candidates/profile`, profileData);
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`${API}/candidates/profile`, profileData);
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
              <Link to="/ai-interview">
                <Button variant="ghost" data-testid="ai-interview-link">
                  <User className="w-4 h-4 mr-2" />
                  AI Interview
                </Button>
              </Link>
              <Link to="/jobs">
                <Button variant="ghost" data-testid="browse-jobs-link">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
              <Link to="/my-applications">
                <Button variant="ghost" data-testid="my-applications-link">
                  <FileText className="w-4 h-4 mr-2" />
                  My Applications
                </Button>
              </Link>
              <Link to="/video-interview">
                <Button variant="ghost" className="bg-blue-50 hover:bg-blue-100">
                  🎥 Video Interview
                </Button>
              </Link>
              <Link to="/job-offers">
                <Button variant="ghost" className="bg-purple-50 hover:bg-purple-100">
                  💼 My Offers
                </Button>
              </Link>
              <Link to="/resume-upload">
                <Button variant="ghost" className="bg-green-50 hover:bg-green-100">
                  <FileText className="w-4 h-4 mr-2" />
                  Resume AI
                </Button>
              </Link>
              <Link to="/payroll-tracking">
                <Button variant="ghost">
                  Payroll
                </Button>
              </Link>
              <Link to="/subscription">
                <Button variant="ghost" className="bg-yellow-50 hover:bg-yellow-100">
                  ⭐ Subscription
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="bg-orange-50 hover:bg-orange-100"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${API}/stripe/customer-portal`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    window.open(response.data.portal_url, '_blank');
                  } catch (error) {
                    toast.error(error.response?.data?.detail || 'Failed to open portal');
                  }
                }}
              >
                💳 Manage Billing
              </Button>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button" className="border-red-300 text-red-600 hover:bg-red-50">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Candidate Dashboard</h2>
          <p className="text-gray-600 mt-2" data-testid="welcome-message">Welcome back, {user.full_name}!</p>
        </div>

        {/* AI Interview Banner */}
        {!profile?.interview_completed && (
          <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Complete Your AI Interview</h3>
                  <p className="text-blue-100 mb-4">Get AI-vetted and increase your chances of getting hired by 10x!</p>
                  <Link to="/ai-interview">
                    <Button size="lg" variant="secondary">
                      Start AI Interview (15-30 min)
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="profile-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle data-testid="profile-title">Your Profile</CardTitle>
                <CardDescription data-testid="profile-description">
                  {profile ? 'Manage your professional profile' : 'Create your profile to start applying for jobs'}
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
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Select value={formData.specialization} onValueChange={(value) => setFormData({ ...formData, specialization: value })} required>
                      <SelectTrigger data-testid="specialization-select">
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Years of Experience *</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      required
                      data-testid="experience-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education *</Label>
                  <Input
                    id="education"
                    placeholder="e.g., PhD in Molecular Biology, Harvard University"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    required
                    data-testid="education-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated) *</Label>
                  <Input
                    id="skills"
                    placeholder="e.g., Clinical Research, Data Analysis, Medical Writing"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    required
                    data-testid="skills-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself and your experience..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    data-testid="bio-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, USA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      data-testid="location-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                      <SelectTrigger data-testid="availability-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_expectation">Salary Expectation</Label>
                  <Input
                    id="salary_expectation"
                    placeholder="e.g., $80,000 - $120,000"
                    value={formData.salary_expectation}
                    onChange={(e) => setFormData({ ...formData, salary_expectation: e.target.value })}
                    data-testid="salary-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publications">Publications (comma-separated)</Label>
                  <Textarea
                    id="publications"
                    placeholder="List your research publications..."
                    value={formData.publications}
                    onChange={(e) => setFormData({ ...formData, publications: e.target.value })}
                    data-testid="publications-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                  <Input
                    id="certifications"
                    placeholder="e.g., Board Certified, Licensed Physician"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    data-testid="certifications-input"
                  />
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
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Specialization</h4>
                    <p className="text-gray-900" data-testid="profile-specialization">{profile.specialization}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Experience</h4>
                    <p className="text-gray-900" data-testid="profile-experience">{profile.experience_years} years</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2" data-testid="profile-skills">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Education</h4>
                  <p className="text-gray-900" data-testid="profile-education">{profile.education}</p>
                </div>

                {profile.bio && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Bio</h4>
                    <p className="text-gray-900" data-testid="profile-bio">{profile.bio}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {profile.location && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Location</h4>
                      <p className="text-gray-900" data-testid="profile-location">{profile.location}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Availability</h4>
                    <p className="text-gray-900" data-testid="profile-availability">{profile.availability}</p>
                  </div>
                </div>

                {profile.certifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2" data-testid="profile-certifications">
                      {profile.certifications.map((cert, index) => (
                        <Badge key={index}>{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.publications.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Publications</h4>
                    <ul className="list-disc list-inside space-y-1" data-testid="profile-publications">
                      {profile.publications.map((pub, index) => (
                        <li key={index} className="text-gray-900 text-sm">{pub}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500" data-testid="no-profile-message">No profile created yet. Click "Edit Profile" to get started.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CandidateDashboard;
