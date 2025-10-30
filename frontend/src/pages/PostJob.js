import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

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

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote'];

function PostJob({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    requirements: '',
    skills_required: '',
    location: '',
    job_type: '',
    salary_range: '',
    experience_required: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const jobData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
      location: formData.location,
      job_type: formData.job_type,
      salary_range: formData.salary_range,
      experience_required: formData.experience_required
    };

    try {
      await axios.post(`${API}/jobs`, jobData);
      toast.success('Job posted successfully!');
      navigate('/dashboard/employer');
    } catch (error) {
      console.error('Job post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to post job');
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
              <Link to="/dashboard/employer">
                <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="page-title">Post a Job</h2>
          <p className="text-gray-600 mt-2" data-testid="page-subtitle">Find the perfect talent for your organization</p>
        </div>

        <Card data-testid="post-job-card">
          <CardHeader>
            <CardTitle data-testid="card-title">Job Details</CardTitle>
            <CardDescription data-testid="card-description">Fill in the information about the position</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Research Scientist"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="title-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })} required>
                    <SelectTrigger data-testid="job-type-select">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity special..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                  data-testid="description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (one per line) *</Label>
                <Textarea
                  id="requirements"
                  placeholder="PhD in relevant field\n5+ years of experience\nStrong analytical skills"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={5}
                  required
                  data-testid="requirements-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills_required">Skills Required (comma-separated) *</Label>
                <Input
                  id="skills_required"
                  placeholder="e.g., Python, Statistical Analysis, Clinical Research"
                  value={formData.skills_required}
                  onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                  required
                  data-testid="skills-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Boston, MA or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    data-testid="location-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_required">Experience Required *</Label>
                  <Input
                    id="experience_required"
                    placeholder="e.g., 3-5 years"
                    value={formData.experience_required}
                    onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                    required
                    data-testid="experience-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                <Input
                  id="salary_range"
                  placeholder="e.g., $90,000 - $130,000"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  data-testid="salary-input"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link to="/dashboard/employer">
                  <Button type="button" variant="outline" data-testid="cancel-button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading} data-testid="submit-button">
                  {loading ? 'Posting...' : 'Post Job'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PostJob;
