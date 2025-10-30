import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { MapPin, Briefcase, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-green-500 text-white'
};

function MyApplications({ user, onLogout }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications/my-applications`);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
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
              <Link to="/dashboard/candidate">
                <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
              </Link>
              <Link to="/jobs">
                <Button variant="ghost" data-testid="browse-jobs-link">Browse Jobs</Button>
              </Link>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="page-title">My Applications</h2>
          <p className="text-gray-600 mt-2" data-testid="page-subtitle">Track the status of your job applications</p>
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
                      <CardTitle className="text-xl" data-testid={`job-title-${app.id}`}>{app.job_title}</CardTitle>
                      <CardDescription className="mt-2" data-testid={`company-name-${app.id}`}>{app.company_name}</CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[app.status]} data-testid={`status-${app.id}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      <span data-testid={`job-category-${app.id}`}>{app.job_category}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span data-testid={`applied-date-${app.id}`}>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {app.cover_letter && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Cover Letter</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded" data-testid={`cover-letter-${app.id}`}>{app.cover_letter}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-applications-message">
            <p className="text-gray-500 text-lg">You haven't applied to any jobs yet</p>
            <Link to="/jobs">
              <Button className="mt-4" data-testid="browse-jobs-button">Browse Jobs</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyApplications;
