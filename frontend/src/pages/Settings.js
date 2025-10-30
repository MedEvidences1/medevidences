import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, FileText } from 'lucide-react';
import { COUNTRIES } from '@/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Settings({ user, onLogout }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    linkedin_url: '',
    other_links: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/candidates/profile`);
      const profile = response.data;
      setFormData({
        full_name: profile.full_name || user.full_name || '',
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || '',
        linkedin_url: profile.linkedin_url || '',
        other_links: profile.other_links?.join(', ') || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error('File size must be less than 3MB');
        return;
      }
      setResumeFile(file);
      toast.success('Resume selected: ' + file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: In production, you'd upload the file to cloud storage first
      // For now, we'll just save the profile data
      const profileData = {
        ...formData,
        other_links: formData.other_links ? formData.other_links.split(',').map(l => l.trim()) : []
      };

      await axios.put(`${API}/candidates/profile`, profileData);
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Navigation */}
      <nav className=\"bg-white shadow-sm\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
          <div className=\"flex justify-between items-center h-16\">
            <Link to=\"/\">
              <h1 className=\"text-2xl font-bold text-blue-600\">MedEvidences</h1>
            </Link>
            <div className=\"flex items-center space-x-4\">
              <Link to=\"/dashboard/candidate\">
                <Button variant=\"ghost\">Back to Dashboard</Button>
              </Link>
              <Button variant=\"outline\" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <div className=\"mb-8\">
          <h2 className=\"text-3xl font-bold text-gray-900\">Settings</h2>
          <p className=\"text-gray-600 mt-2\">Manage your account and profile settings</p>
        </div>

        <form onSubmit={handleSubmit} className=\"space-y-6\">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"grid md:grid-cols-2 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"full_name\">Full Name *</Label>
                  <Input
                    id=\"full_name\"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className=\"space-y-2\">
                  <Label htmlFor=\"email\">Email *</Label>
                  <Input
                    id=\"email\"
                    type=\"email\"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className=\"grid md:grid-cols-2 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"phone\">Phone</Label>
                  <Input
                    id=\"phone\"
                    type=\"tel\"
                    placeholder=\"+1 (555) 123-4567\"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className=\"space-y-2\">
                  <Label htmlFor=\"city\">City</Label>
                  <Input
                    id=\"city\"
                    placeholder=\"e.g., New York\"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className=\"space-y-2\">
                <Label htmlFor=\"country\">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder=\"Select country\" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Professional Links */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Links</CardTitle>
              <CardDescription>Add your professional profiles and portfolio</CardDescription>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"linkedin_url\">LinkedIn URL</Label>
                <Input
                  id=\"linkedin_url\"
                  type=\"url\"
                  placeholder=\"https://linkedin.com/in/yourprofile\"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>

              <div className=\"space-y-2\">
                <Label htmlFor=\"other_links\">Other Links (comma-separated)</Label>
                <Input
                  id=\"other_links\"
                  placeholder=\"https://github.com/username, https://portfolio.com\"
                  value={formData.other_links}
                  onChange={(e) => setFormData({ ...formData, other_links: e.target.value })}
                />
                <p className=\"text-sm text-gray-500\">Add GitHub, portfolio, or other professional links</p>
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Resume/CV</CardTitle>
              <CardDescription>Upload your resume (PDF format, max 3MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                <div className=\"border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors\">
                  <input
                    type=\"file\"
                    id=\"resume-upload\"
                    accept=\".pdf\"
                    onChange={handleFileChange}
                    className=\"hidden\"
                  />
                  <label htmlFor=\"resume-upload\" className=\"cursor-pointer\">
                    {resumeFile ? (
                      <div>
                        <FileText className=\"w-12 h-12 text-green-600 mx-auto mb-2\" />
                        <p className=\"text-sm font-medium text-gray-900\">{resumeFile.name}</p>
                        <p className=\"text-xs text-gray-500 mt-1\">{(resumeFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className=\"w-12 h-12 text-gray-400 mx-auto mb-2\" />
                        <p className=\"text-sm font-medium text-gray-700\">Click to upload resume</p>
                        <p className=\"text-xs text-gray-500 mt-1\">PDF format, max 3MB</p>
                      </div>
                    )}
                  </label>
                </div>
                {resumeFile && (
                  <Button
                    type=\"button\"
                    variant=\"outline\"
                    onClick={() => setResumeFile(null)}
                    className=\"w-full\"
                  >
                    Remove File
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className=\"flex justify-end space-x-4\">
            <Link to=\"/dashboard/candidate\">
              <Button type=\"button\" variant=\"outline\">Cancel</Button>
            </Link>
            <Button type=\"submit\" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
