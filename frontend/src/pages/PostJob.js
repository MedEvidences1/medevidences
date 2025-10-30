import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';

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
const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];

function PostJob({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    role_overview: '',
    project_summary: '',
    specific_tasks: '',
    requirements: '',
    education_requirements: '',
    skills_required: '',
    knowledge_areas: '',
    location: '',
    job_type: '',
    work_type: 'Remote',
    salary_range: '',
    compensation_details: '',
    experience_required: '',
    schedule_commitment: '',
    communication_skills: 'Excellent communication required',
    english_proficiency: 'High proficiency required',
    terms_conditions: '',
    responsiveness_required: true,
    independent_work: true,
    ai_understanding: false
  });

  useEffect(() => {
    if (!user || user.role !== 'employer') {
      toast.error('Only employers can post jobs');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const jobData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      role_overview: formData.role_overview,
      project_summary: formData.project_summary,
      specific_tasks: formData.specific_tasks.split('\n').filter(t => t.trim()),
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      education_requirements: formData.education_requirements,
      skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
      knowledge_areas: formData.knowledge_areas.split(',').map(k => k.trim()).filter(k => k),
      location: formData.location,
      job_type: formData.job_type,
      work_type: formData.work_type,
      salary_range: formData.salary_range,
      compensation_details: formData.compensation_details,
      experience_required: formData.experience_required,
      schedule_commitment: formData.schedule_commitment,
      communication_skills: formData.communication_skills,
      english_proficiency: formData.english_proficiency,
      terms_conditions: formData.terms_conditions,
      responsiveness_required: formData.responsiveness_required,
      independent_work: formData.independent_work,
      ai_understanding: formData.ai_understanding
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

  if (!user || user.role !== 'employer') {
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
              <Link to="/dashboard/employer">
                <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center" data-testid="page-title">
            <Briefcase className="w-8 h-8 mr-3 text-blue-600" />
            Post a New Position
          </h2>
          <p className="text-gray-600 mt-2" data-testid="page-subtitle">Find the perfect talent for your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card data-testid="basic-info-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General details about the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Medical Researcher"
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
                  <Label htmlFor="experience_required">Experience Required *</Label>
                  <Input
                    id="experience_required"
                    placeholder="e.g., 3-5 years, Entry-level"
                    value={formData.experience_required}
                    onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                    required
                    data-testid="experience-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Details */}
          <Card data-testid="role-details-card">
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>Comprehensive description of the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role_overview">Role Overview *</Label>
                <Textarea
                  id="role_overview"
                  placeholder="Provide a comprehensive overview of the role, its importance, and impact..."
                  value={formData.role_overview}
                  onChange={(e) => setFormData({ ...formData, role_overview: e.target.value })}
                  rows={4}
                  required
                  data-testid="role-overview-input"
                />
                <p className="text-sm text-gray-500">Describe what the role entails and why it matters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_summary">Project Summary *</Label>
                <Textarea
                  id="project_summary"
                  placeholder="Summarize the project or initiative this position supports..."
                  value={formData.project_summary}
                  onChange={(e) => setFormData({ ...formData, project_summary: e.target.value })}
                  rows={3}
                  required
                  data-testid="project-summary-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the position, responsibilities, and what success looks like..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                  data-testid="description-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specific_tasks">Specific Tasks & Responsibilities (one per line) *</Label>
                <Textarea
                  id="specific_tasks"
                  placeholder="Conduct clinical research studies\nAnalyze patient data\nPrepare research reports\nCollaborate with medical teams"
                  value={formData.specific_tasks}
                  onChange={(e) => setFormData({ ...formData, specific_tasks: e.target.value })}
                  rows={6}
                  required
                  data-testid="tasks-input"
                />
                <p className="text-sm text-gray-500">List each task on a new line</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card data-testid="requirements-card">
            <CardHeader>
              <CardTitle>Requirements & Qualifications</CardTitle>
              <CardDescription>What you're looking for in candidates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="education_requirements">Education Requirements *</Label>
                <Input
                  id="education_requirements"
                  placeholder="e.g., PhD in Medical Sciences, MD, Master's degree"
                  value={formData.education_requirements}
                  onChange={(e) => setFormData({ ...formData, education_requirements: e.target.value })}
                  required
                  data-testid="education-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">General Requirements (one per line) *</Label>
                <Textarea
                  id="requirements"
                  placeholder="Board certification\n5+ years clinical experience\nStrong analytical skills\nExcellent patient care"
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
                  placeholder="e.g., Clinical Research, Data Analysis, Medical Writing, Statistical Analysis"
                  value={formData.skills_required}
                  onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                  required
                  data-testid="skills-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledge_areas">Knowledge Areas (comma-separated) *</Label>
                <Input
                  id="knowledge_areas"
                  placeholder="e.g., Oncology, Clinical Trials, FDA Regulations, Patient Care"
                  value={formData.knowledge_areas}
                  onChange={(e) => setFormData({ ...formData, knowledge_areas: e.target.value })}
                  required
                  data-testid="knowledge-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Requirements */}
          <Card data-testid="professional-requirements-card">
            <CardHeader>
              <CardTitle>Professional Requirements</CardTitle>
              <CardDescription>Key competencies and attributes needed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="communication_skills">Communication Skills Requirements *</Label>
                <Input
                  id="communication_skills"
                  value={formData.communication_skills}
                  onChange={(e) => setFormData({ ...formData, communication_skills: e.target.value })}
                  required
                  data-testid="communication-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="english_proficiency">English Proficiency Level *</Label>
                <Select value={formData.english_proficiency} onValueChange={(value) => setFormData({ ...formData, english_proficiency: value })}>
                  <SelectTrigger data-testid="english-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Native or bilingual proficiency">Native or bilingual proficiency</SelectItem>
                    <SelectItem value="High proficiency required">High proficiency required</SelectItem>
                    <SelectItem value="Professional working proficiency">Professional working proficiency</SelectItem>
                    <SelectItem value="Limited working proficiency acceptable">Limited working proficiency acceptable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="responsiveness"
                    checked={formData.responsiveness_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, responsiveness_required: checked })}
                    data-testid="responsiveness-checkbox"
                  />
                  <Label htmlFor="responsiveness" className="cursor-pointer">
                    High responsiveness and timely communication required
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="independent_work"
                    checked={formData.independent_work}
                    onCheckedChange={(checked) => setFormData({ ...formData, independent_work: checked })}
                    data-testid="independent-checkbox"
                  />
                  <Label htmlFor="independent_work" className="cursor-pointer">
                    Ability to work independently with minimal supervision
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai_understanding"
                    checked={formData.ai_understanding}
                    onCheckedChange={(checked) => setFormData({ ...formData, ai_understanding: checked })}
                    data-testid="ai-checkbox"
                  />
                  <Label htmlFor="ai_understanding" className="cursor-pointer">
                    Understanding of AI and machine learning concepts required
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Details */}
          <Card data-testid="work-details-card">
            <CardHeader>
              <CardTitle>Work Details</CardTitle>
              <CardDescription>Location, schedule, and work arrangement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="work_type">Work Type *</Label>
                  <Select value={formData.work_type} onValueChange={(value) => setFormData({ ...formData, work_type: value })} required>
                    <SelectTrigger data-testid="work-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule_commitment">Schedule & Time Commitment *</Label>
                <Input
                  id="schedule_commitment"
                  placeholder="e.g., Full-time 40 hours/week, Flexible hours, 20-30 hours/week"
                  value={formData.schedule_commitment}
                  onChange={(e) => setFormData({ ...formData, schedule_commitment: e.target.value })}
                  required
                  data-testid="schedule-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card data-testid="compensation-card">
            <CardHeader>
              <CardTitle>Compensation & Benefits</CardTitle>
              <CardDescription>Salary and additional benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range *</Label>
                <Input
                  id="salary_range"
                  placeholder="e.g., $120,000 - $160,000 per year"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  required
                  data-testid="salary-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensation_details">Detailed Compensation Package *</Label>
                <Textarea
                  id="compensation_details"
                  placeholder="Base salary, bonuses, stock options, health insurance, 401(k), paid time off, professional development budget, etc."
                  value={formData.compensation_details}
                  onChange={(e) => setFormData({ ...formData, compensation_details: e.target.value })}
                  rows={4}
                  required
                  data-testid="compensation-details-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card data-testid="terms-card">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>Legal and contractual information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="terms_conditions">Terms & Conditions *</Label>
                <Textarea
                  id="terms_conditions"
                  placeholder="Contract duration, probation period, notice period, non-compete clauses, confidentiality requirements, etc."
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                  rows={5}
                  required
                  data-testid="terms-input"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4 pt-6">
            <Link to="/dashboard/employer">
              <Button type="button" variant="outline" data-testid="cancel-button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading} size="lg" data-testid="submit-button">
              {loading ? 'Posting Job...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostJob;
