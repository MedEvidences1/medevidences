import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Briefcase, FileText, DollarSign, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCandidates: 0,
    totalEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeJobs: 0,
    pendingApplications: 0,
    revenue: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCheckedAuth) return;
    
    if (!user) {
      navigate('/login');
      setHasCheckedAuth(true);
      return;
    }
    if (user.email !== 'admin@medevidences.com') {
      toast.error('Access Denied! Admin access only.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
      setHasCheckedAuth(true);
      return;
    }
    setHasCheckedAuth(true);
    fetchDashboardData();
  }, [user, navigate, hasCheckedAuth]);

  const fetchDashboardData = async () => {
    try {
      // Fetch jobs
      const jobsRes = await axios.get(`${API}/jobs`);
      const jobs = jobsRes.data;
      
      setStats(prev => ({
        ...prev,
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length
      }));
      setRecentJobs(jobs.slice(0, 5));

      // Note: These would come from admin-specific endpoints in production
      setStats(prev => ({
        ...prev,
        totalUsers: 15,
        totalCandidates: 10,
        totalEmployers: 5,
        totalApplications: 25,
        pendingApplications: 8,
        revenue: 1490 // $149 x 10 jobs
      }));
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.email !== 'admin@medevidences.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p>Admin access only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <h1 className="text-2xl font-bold text-blue-600">MedEvidences</h1>
              </Link>
              <Badge variant="destructive">ADMIN</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/mercor-jobs">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  📥 Import Jobs
                </Button>
              </Link>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-2">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalCandidates} candidates, {stats.totalEmployers} employers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.activeJobs} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
              <FileText className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.pendingApplications} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.revenue.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                From job postings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.category} • {job.location}</p>
                      </div>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>All Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.length > 0 ? (
                    recentApplications.map((app) => (
                      <div key={app.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{app.candidate_name || 'Candidate'}</h3>
                          <p className="text-sm text-gray-600">Applied for: {app.job_title}</p>
                          <p className="text-xs text-gray-500">Company: {app.company_name}</p>
                          <p className="text-xs text-gray-400">
                            Applied: {new Date(app.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            app.status === 'pending' ? 'secondary' : 
                            app.status === 'accepted' ? 'default' : 
                            'destructive'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">No applications yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Payment tracking features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Pricing Configuration</h4>
                    <p className="text-sm text-gray-600">Job Posting: $149</p>
                    <p className="text-sm text-gray-600">Premium Subscription: $499/month</p>
                    <p className="text-sm text-gray-600">Success Fee: 10%</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Email Notifications</h4>
                    <Badge>Configured</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Payment Processing</h4>
                    <Badge variant="outline">Stripe Integration Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPanel;