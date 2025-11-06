import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [saveEmail, setSaveEmail] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEmailContent, setManualEmailContent] = useState('');
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
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch jobs
      const jobsRes = await axios.get(`${API}/jobs`, { headers });
      const jobs = jobsRes.data;
      
      setStats(prev => ({
        ...prev,
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length
      }));
      setRecentJobs(jobs.slice(0, 5));

      // Fetch all applications (admin endpoint)
      try {
        const appsRes = await axios.get(`${API}/admin/applications`, { headers });
        const applications = appsRes.data;
        
        setRecentApplications(applications.slice(0, 10)); // Show last 10
        setStats(prev => ({
          ...prev,
          totalApplications: applications.length,
          pendingApplications: applications.filter(a => a.status === 'pending').length
        }));
      } catch (appError) {
        console.error('Error fetching applications:', appError);
        // Fallback if endpoint doesn't exist yet
        setStats(prev => ({
          ...prev,
          totalApplications: 0,
          pendingApplications: 0
        }));
      }

      // Note: These would come from admin-specific endpoints in production
      setStats(prev => ({
        ...prev,
        totalUsers: 15,
        totalCandidates: 10,
        totalEmployers: 5,
        revenue: 1490 // $149 x 10 jobs
      }));
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleSendToEmployer = (app) => {
    setSelectedApp(app);
    setCustomEmail(app.employer_email || '');
    setSaveEmail(false);
    setShowSendModal(true);
  };

  const handleConfirmSend = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/admin/send-to-employer-with-options/${selectedApp.id}`,
        {
          employer_email: customEmail,
          save_email: saveEmail
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success(`✓ Sent to ${customEmail}! Referral Code: ${response.data.referral_code}`);
      setShowSendModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error sending to employer:', error);
      toast.error(error.response?.data?.detail || 'Failed to send to employer');
    }
  };

  const handleDownloadPDF = async (appId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/admin/download-application-pdf/${appId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Application_${appId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleComposeManual = async (app) => {
    // Generate email content
    const referralCode = app.referral_code || `MED-${Date.now()}`;
    const emailContent = `To: [Enter employer email here]
Subject: Candidate Referral from MedEvidences - ${app.job_title}

Dear Hiring Manager,

I am forwarding an excellent candidate for your ${app.job_title} position through MedEvidences.

=== CANDIDATE DETAILS ===
Name: ${app.candidate_name}
Email: ${app.candidate_email}
Specialization: ${app.candidate_specialization || 'N/A'}
Experience: ${app.candidate_experience || 0} years

=== JOB DETAILS ===
Position: ${app.job_title}
Company: ${app.company_name}

=== MEDEVIDENCES REFERRAL CODE ===
${referralCode}

⚠️ IMPORTANT: Please use referral code ${referralCode} when contacting this candidate or in your system for tracking purposes.

NEXT STEPS:
1. Review the attached PDF (download separately)
2. Contact candidate at: ${app.candidate_email}
3. Reference code: ${referralCode}

Best regards,
MedEvidences Admin Team
https://medevidences.com

---
This is a manual forward from MedEvidences platform
Generated: ${new Date().toLocaleString()}`;

    setManualEmailContent(emailContent);
    setSelectedApp(app);
    setShowManualModal(true);
  };

  const handleViewEmailDetails = (app) => {
    const emailContent = `
TO: ${app.employer_email}
FROM: MedEvidences Team <noreply@medevidences.com>
SUBJECT: New Candidate Referral from MedEvidences - ${app.job_title}
REFERRAL CODE: ${app.referral_code}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear Employer,

MedEvidences has identified a qualified candidate for your position: ${app.job_title}

=== CANDIDATE DETAILS ===
Name: ${app.candidate_name}
Email: ${app.candidate_email}
Specialization: ${app.candidate_specialization || 'N/A'}
Experience: ${app.candidate_experience || 0} years

=== JOB DETAILS ===
Position: ${app.job_title}
Company: ${app.company_name}

=== MEDEVIDENCES REFERRAL CODE ===
Code: ${app.referral_code}

⚠️ IMPORTANT: Please use this referral code (${app.referral_code}) in all communications regarding this candidate to track this referral from MedEvidences.

${app.cover_letter ? `\nCANDIDATE COVER LETTER:\n${app.cover_letter}\n` : ''}

To view the full candidate profile and manage this application, please log in to your MedEvidences employer dashboard at: https://med-ai-hiring.preview.emergentagent.com

Best regards,
MedEvidences Team
https://medevidences.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message from MedEvidences platform.
Referral Code: ${app.referral_code}
Sent At: ${new Date(app.sent_at).toLocaleString()}
    `;
    
    setSelectedEmail({
      ...app,
      emailContent
    });
    setShowEmailModal(true);
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
                  📥 Import External Jobs
                </Button>
              </Link>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/import-all-jobs?keywords=medical`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert(`Success! ${data.message}\n\nJobdata: ${data.results.jobdata.count} jobs\nJSearch: ${data.results.jsearch.count} jobs`);
                    } else {
                      alert('Error: ' + data.detail);
                    }
                  } catch (error) {
                    alert('Error: ' + error.message);
                  }
                }}
              >
                🌐 Import from APIs
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={async () => {
                  if (!confirm('This will make all imported jobs visible to applicants. Continue?')) return;
                  
                  try {
                    const response = await axios.post(
                      `${process.env.REACT_APP_BACKEND_URL}/api/admin/activate-imported-jobs`
                    );
                    
                    alert(`✅ Success! ${response.data.message}\n\n📊 Activated: ${response.data.activated} jobs\n⏭️ Skipped: ${response.data.skipped} duplicates\n📦 Total: ${response.data.total_processed} jobs`);
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (error) {
                    console.error('Activation error:', error);
                    alert('Error: ' + (error.response?.data?.detail || error.message));
                  }
                }}
              >
                ✅ Activate Jobs
              </Button>
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
            <TabsTrigger value="sources">Job Sources</TabsTrigger>
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

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Job Sources Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">External Job APIs</h3>
                      <p className="text-sm text-gray-600 mb-3">Import jobs from external sources</p>
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-orange-500 hover:bg-orange-600"
                          onClick={() => window.location.href = '/mercor-jobs'}
                        >
                          📥 Mercor Jobs Portal
                        </Button>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/import-all-jobs?keywords=medical`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const data = await response.json();
                              if (response.ok) {
                                toast.success(`Success! ${data.message}\n\nJobdata: ${data.results.jobdata.count} jobs\nJSearch: ${data.results.jsearch.count} jobs`);
                              } else {
                                toast.error('Error: ' + data.detail);
                              }
                            } catch (error) {
                              toast.error('Error: ' + error.message);
                            }
                          }}
                        >
                          🌐 Import from APIs
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Job Activation</h3>
                      <p className="text-sm text-gray-600 mb-3">Manage imported job visibility</p>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={async () => {
                          if (!confirm('This will make all imported jobs visible to applicants. Continue?')) return;
                          
                          try {
                            const response = await axios.post(
                              `${process.env.REACT_APP_BACKEND_URL}/api/admin/activate-imported-jobs`
                            );
                            
                            toast.success(`✅ Success! ${response.data.message}\n\n📊 Activated: ${response.data.activated} jobs\n⏭️ Skipped: ${response.data.skipped} duplicates\n📦 Total: ${response.data.total_processed} jobs`);
                            setTimeout(() => window.location.reload(), 2000);
                          } catch (error) {
                            console.error('Activation error:', error);
                            toast.error('Error: ' + (error.response?.data?.detail || error.message));
                          }
                        }}
                      >
                        ✅ Activate Imported Jobs
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Job Source Statistics</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalJobs}</div>
                        <div className="text-sm text-gray-600">Total Jobs</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
                        <div className="text-sm text-gray-600">Active Jobs</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{stats.totalJobs - stats.activeJobs}</div>
                        <div className="text-sm text-gray-600">Pending Activation</div>
                      </div>
                    </div>
                  </div>
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
                      <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{app.candidate_name || 'Candidate'}</h3>
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
                            
                            <div className="space-y-1 mb-3">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Job:</span> {app.job_title}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Company:</span> {app.company_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Candidate Email:</span>{' '}
                                <a href={`mailto:${app.candidate_email}`} className="text-blue-600 hover:underline">
                                  {app.candidate_email}
                                </a>
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Employer Email:</span>{' '}
                                <a href={`mailto:${app.employer_email}`} className="text-blue-600 hover:underline">
                                  {app.employer_email}
                                </a>
                              </p>
                              {app.sent_to_email && app.sent_to_email !== app.employer_email && (
                                <p className="text-sm text-green-600">
                                  <span className="font-medium">✓ Also sent to:</span>{' '}
                                  <a href={`mailto:${app.sent_to_email}`} className="text-green-600 hover:underline font-semibold">
                                    {app.sent_to_email}
                                  </a>
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                Applied: {new Date(app.applied_at).toLocaleDateString()}
                              </p>
                            </div>
                            
                            {app.referral_code && (
                              <div className="mt-2">
                                <Badge className="bg-green-100 text-green-800">
                                  Ref: {app.referral_code}
                                </Badge>
                                <span className="text-xs text-gray-500 ml-2">
                                  Sent: {new Date(app.sent_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4 flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSendToEmployer(app)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              📧 Send to Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPDF(app.id)}
                            >
                              📄 Download PDF
                            </Button>
                            {app.sent_to_employer && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewEmailDetails(app)}
                              >
                                👁️ View Details
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleComposeManual(app)}
                              className="border-green-600 text-green-700 hover:bg-green-50"
                            >
                              ✍️ Compose Manual
                            </Button>
                          </div>
                        </div>
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

      {/* Send to Employer Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Application to Employer Email</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm"><b>Candidate:</b> {selectedApp.candidate_name}</p>
                <p className="text-sm"><b>Job:</b> {selectedApp.job_title}</p>
                <p className="text-sm"><b>Company:</b> {selectedApp.company_name}</p>
                {selectedApp.sent_to_email && (
                  <p className="text-sm text-green-600 mt-2">
                    <b>✓ Previously sent to:</b> {selectedApp.sent_to_email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Employer Email Address *
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Enter employer email (can send to multiple)"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <p className="text-xs text-gray-500">
                  💡 You can send to different emails - just change the address and click send again
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveEmail"
                  checked={saveEmail}
                  onChange={(e) => setSaveEmail(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="saveEmail" className="text-sm">
                  Save this email for future use with this employer
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <b>📧 Email will include:</b>
                  <br/>• Candidate details & cover letter
                  <br/>• MedEvidences Referral Code
                  <br/>• <b>PDF attachment</b> with full application
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSend}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!customEmail}
                >
                  📧 Send with PDF Attachment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Details Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Sent to Employer</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📧 Email Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">To:</span> {selectedEmail.employer_email}</p>
                  <p><span className="font-medium">Subject:</span> New Candidate Referral - {selectedEmail.job_title}</p>
                  <p><span className="font-medium">Referral Code:</span> 
                    <Badge className="ml-2 bg-green-600">{selectedEmail.referral_code}</Badge>
                  </p>
                  <p><span className="font-medium">Sent:</span> {new Date(selectedEmail.sent_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📄 Email Content</h3>
                <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border">
                  {selectedEmail.emailContent}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedEmail.emailContent);
                    toast.success('Email content copied to clipboard!');
                  }}
                  variant="outline"
                >
                  📋 Copy Email
                </Button>
                <Button
                  onClick={() => {
                    const mailto = `mailto:${selectedEmail.employer_email}?subject=${encodeURIComponent('New Candidate Referral - ' + selectedEmail.job_title)}&body=${encodeURIComponent(selectedEmail.emailContent)}`;
                    window.location.href = mailto;
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ✉️ Send via Your Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Email Composer Modal */}
      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✍️ Compose Email Manually</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">📧 Manual Email Sending Instructions</h3>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>Copy the email content below</li>
                  <li>Open YOUR email client (Gmail, Outlook, etc.)</li>
                  <li>Paste the content</li>
                  <li>Replace "[Enter employer email here]" with actual email</li>
                  <li>Attach the PDF (download using "Download PDF" button)</li>
                  <li>Send!</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">Email Content (Editable)</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(manualEmailContent);
                      toast.success('Email content copied! Paste in your email client');
                    }}
                  >
                    📋 Copy All
                  </Button>
                </div>
                <textarea
                  value={manualEmailContent}
                  onChange={(e) => setManualEmailContent(e.target.value)}
                  className="w-full h-96 px-3 py-2 border rounded-md font-mono text-sm"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <b>📎 Don't forget:</b>
                  <br/>• Download PDF using "Download PDF" button
                  <br/>• Attach PDF to your email
                  <br/>• Replace placeholder email with real address
                  <br/>• Reference Code: <span className="font-mono font-bold">{selectedApp.referral_code || 'To be generated'}</span>
                </p>
              </div>

              <div className="flex gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedApp.id)}
                  className="border-blue-600 text-blue-700"
                >
                  📄 Download PDF First
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(manualEmailContent);
                      toast.success('Copied! Now open your email client and paste');
                      setShowManualModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    📋 Copy & Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminPanel;