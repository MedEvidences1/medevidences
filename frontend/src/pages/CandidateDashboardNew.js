import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Briefcase, FileText, DollarSign, User, Settings as SettingsIcon, HelpCircle, Users, Target } from 'lucide-react';

function CandidateDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/">
              <h1 className="text-2xl font-bold text-blue-600" data-testid="logo">MedEvidences</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Dashboard</h2>
          <p className="text-gray-600 mt-2" data-testid="welcome-message">Welcome back, {user.full_name}!</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full" data-testid="dashboard-tabs">
            <TabsTrigger value="home" className="flex items-center gap-2" data-testid="tab-home">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-2" data-testid="tab-explore">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Explore</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2" data-testid="tab-applications">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2" data-testid="tab-offers">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2" data-testid="tab-earnings">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2" data-testid="tab-support">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card data-testid="quick-action-interview">
                <CardHeader>
                  <CardTitle className="text-lg">AI Interview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Complete your AI interview to get better job matches</p>
                  <Link to="/ai-interview">
                    <Button className="w-full">Take Interview</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card data-testid="quick-action-jobs">
                <CardHeader>
                  <CardTitle className="text-lg">Browse Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Explore thousands of opportunities</p>
                  <Link to="/jobs">
                    <Button className="w-full" variant="outline">View Jobs</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card data-testid="quick-action-matched">
                <CardHeader>
                  <CardTitle className="text-lg">Matched Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">See AI-recommended positions for you</p>
                  <Link to="/matched-jobs">
                    <Button className="w-full" variant="outline">View Matches</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">Applications</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">0</p>
                    <p className="text-sm text-gray-600">Offers</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-gray-600">Interviews</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-600">0</p>
                    <p className="text-sm text-gray-600">Contracts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Explore Tab */}
          <TabsContent value="explore">
            <Card>
              <CardHeader>
                <CardTitle>Explore Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/jobs">
                  <Button className="w-full" size="lg">Browse All Jobs</Button>
                </Link>
                <Link to="/matched-jobs">
                  <Button className="w-full" size="lg" variant="outline">AI Matched Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Link to="/my-applications">
                    <Button>View All Applications</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Job Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No offers yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Earnings & Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Earnings</p>
                    <p className="text-5xl font-bold text-blue-600">$0</p>
                  </div>
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4">Referral Program</h4>
                    <p className="text-sm text-gray-600 mb-4">Earn $500 for each successful referral!</p>
                    <Button variant="outline" className="w-full">Get Referral Link</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profile & Settings</CardTitle>
                  <Link to="/dashboard/candidate">
                    <Button variant="outline" size="sm">Edit Profile</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <Link to="/settings">
                    <Button className="w-full mt-4">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Go to Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How Applications Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Complete your profile and AI interview</li>
                    <li>Browse jobs or get AI-matched recommendations</li>
                    <li>Apply with your profile and custom cover letter</li>
                    <li>Track application status in your dashboard</li>
                    <li>Receive offers and negotiate terms</li>
                    <li>Sign contracts and start working!</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Policies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-gray-700">
                    <p>• Earn $500 for each successful referral</p>
                    <p>• Referral must complete profile and get hired</p>
                    <p>• Payment processed within 30 days of hire</p>
                    <p>• Unlimited referrals welcome</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">Have questions? We're here to help!</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Email:</span>
                      <a href="mailto:HIREMEdevidences.com" className="text-blue-600 hover:underline">
                        HIREMEdevidences.com
                      </a>
                    </div>
                    <Button className="w-full">Send Message</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default CandidateDashboard;
