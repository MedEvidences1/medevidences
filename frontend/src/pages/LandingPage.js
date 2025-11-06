import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, TrendingUp, CheckCircle, Search, Mail, Building2, Headphones, BookOpen, MapPin } from 'lucide-react';
import axios from 'axios';

const JOB_CATEGORIES = [
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

function LandingPage({ user, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedJobs();
  }, []);

  const fetchFeaturedJobs = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/jobs`);
      setFeaturedJobs(response.data.slice(0, 6)); // Show top 6 jobs
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSearch = () => {
    navigate(`/jobs?search=${searchQuery}&category=${selectedCategory}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/">
                <h1 className="text-2xl font-bold text-blue-600" data-testid="logo">MedEvidences</h1>
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link to="/apex" className="text-gray-600 hover:text-gray-900" data-testid="apex-link">Apex</Link>
                <Link to="/research" className="text-gray-600 hover:text-gray-900" data-testid="research-link">Research</Link>
                <Link to="/careers" className="text-gray-600 hover:text-gray-900" data-testid="careers-link">Careers</Link>
                <Link to="/blog" className="text-gray-600 hover:text-gray-900" data-testid="blog-link">Blog</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
                    <Button data-testid="get-started-button">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6" data-testid="hero-title">
            Enhance Future Of AI
          </h2>
          <p className="text-2xl text-gray-600 mb-8" data-testid="hero-subtitle">
            With your Outstanding Skills & Knowledge.<br />Grab top remote jobs with AI roles.
          </p>
          
          {/* Search Section */}
          <Card className="max-w-4xl mx-auto mb-8" data-testid="search-card">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search roles (e.g., Medical Researcher, Physician)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="md:w-64" data-testid="category-select">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Categories</SelectItem>
                    {JOB_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} size="lg" data-testid="search-button">
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6" data-testid="hero-register-button">Find Work</Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="hero-employer-button">Hire Talent</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Start Working Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" data-testid="start-working-title">Start Working in 3 Simple Steps</h3>
            <p className="text-gray-600" data-testid="start-working-subtitle">Join thousands of professionals advancing their careers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="step-1">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <CardTitle>Create Profile</CardTitle>
                <CardDescription>
                  Build your professional profile with your skills, experience, and complete our AI interview
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="step-2">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <CardTitle>Get Matched</CardTitle>
                <CardDescription>
                  Our AI algorithm matches you with perfect opportunities based on your profile and interview
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="step-3">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <CardTitle>Start Working</CardTitle>
                <CardDescription>
                  Apply to matched positions and start your journey with leading organizations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-3xl font-bold" data-testid="featured-jobs-title">Featured Opportunities</h3>
              <p className="text-gray-600 mt-2">Discover top positions in medical and scientific fields</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline" data-testid="view-all-jobs">View All Jobs</Button>
            </Link>
          </div>
          
          {featuredJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="featured-jobs-grid">
              {featuredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)} data-testid={`featured-job-${job.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <Building2 className="w-4 h-4 mr-1" />
                      {job.company_name || 'MedEvidences Partner'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 mr-2" />
                        {job.job_type}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {job.location}
                      </div>
                      <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                      {job.salary_range && (
                        <p className="text-sm font-semibold text-green-600">{job.salary_range}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg" data-testid="no-jobs-message">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No jobs available at the moment</p>
              <p className="text-sm text-gray-400">Check back soon for new opportunities</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Labs, Startups & Global Companies Hiring */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4" data-testid="companies-hiring-title">
              Top Organizations Hiring Now
            </h3>
            <p className="text-gray-600 text-lg">
              Join leading AI labs, innovative startups, and globally recognized companies
            </p>
          </div>

          {/* AI Labs Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">AI Research Labs</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'OpenAI Research', jobs: 12, focus: 'AI Safety & Alignment' },
                { name: 'DeepMind Health', jobs: 8, focus: 'Medical AI Applications' },
                { name: 'Google Brain', jobs: 15, focus: 'Healthcare AI' }
              ].map((lab, idx) => (
                <Card key={idx} className="hover:shadow-xl transition-all border-2 border-purple-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{lab.name}</CardTitle>
                      <Badge className="bg-purple-600">{lab.jobs} jobs</Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      {lab.focus}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full border-purple-300 hover:bg-purple-50"
                      onClick={() => navigate(`/jobs?company=${lab.name}`)}
                    >
                      View Positions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Startups Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Innovative Health-Tech Startups</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Tempus Labs', jobs: 6, funding: 'Series G - $1.3B', focus: 'Precision Medicine' },
                { name: 'Freenome', jobs: 9, funding: 'Series D - $270M', focus: 'Cancer Detection AI' },
                { name: 'Recursion Pharma', jobs: 11, funding: 'Public', focus: 'Drug Discovery AI' }
              ].map((startup, idx) => (
                <Card key={idx} className="hover:shadow-xl transition-all border-2 border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{startup.name}</CardTitle>
                      <Badge className="bg-green-600">{startup.jobs} jobs</Badge>
                    </div>
                    <CardDescription className="text-xs text-green-700 font-semibold mb-1">
                      {startup.funding}
                    </CardDescription>
                    <CardDescription className="text-sm text-gray-600">
                      {startup.focus}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-300 hover:bg-green-50"
                      onClick={() => navigate(`/jobs?company=${startup.name}`)}
                    >
                      Explore Opportunities
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Global Companies Section */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Globally Recognized Organizations</h4>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'Johns Hopkins Medicine', jobs: 24, type: 'Healthcare Institution' },
                { name: 'Mayo Clinic', jobs: 18, type: 'Medical Research' },
                { name: 'Pfizer', jobs: 32, type: 'Pharmaceutical' },
                { name: 'Roche', jobs: 21, type: 'Diagnostics & Research' }
              ].map((company, idx) => (
                <Card key={idx} className="hover:shadow-xl transition-all border-2 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-base">{company.name}</CardTitle>
                      <Badge className="bg-blue-600">{company.jobs}</Badge>
                    </div>
                    <CardDescription className="text-xs text-gray-600">
                      {company.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full border-blue-300 hover:bg-blue-50 text-xs"
                      onClick={() => navigate(`/jobs?company=${company.name}`)}
                    >
                      View Jobs
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="categories-title">Specialized Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {JOB_CATEGORIES.map((category) => (
              <Card key={category} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`category-card-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => navigate(`/jobs?category=${category}`)}>
                <CardHeader>
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="features-title">Why Choose MedEvidences?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="feature-ai-matching">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>AI-Powered Matching</CardTitle>
                <CardDescription>
                  Our intelligent algorithm uses AI interviews and profile analysis to match candidates with perfect opportunities.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="feature-verified-talent">
              <CardHeader>
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Verified Talent</CardTitle>
                <CardDescription>
                  Access a pool of verified medical and scientific professionals with proven expertise and AI-vetted skills.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="feature-remote-jobs">
              <CardHeader>
                <Briefcase className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Remote Opportunities</CardTitle>
                <CardDescription>
                  Find flexible remote positions from leading healthcare and research institutions worldwide.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6" data-testid="cta-title">Ready to Get Started?</h3>
          <p className="text-xl text-blue-100 mb-8" data-testid="cta-subtitle">
            Join thousands of professionals advancing their careers in medical and scientific fields.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="cta-join-button">
              Join MedEvidences Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* For Companies */}
            <div data-testid="footer-companies">
              <h4 className="font-semibold text-lg mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                For Companies
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/contact" className="hover:text-white">Get in Touch</a></li>
                <li><a href="/human-data" className="hover:text-white">Human Data</a></li>
                <li><a href="/post-job" className="hover:text-white">Post Jobs</a></li>
              </ul>
            </div>

            {/* For Candidates */}
            <div data-testid="footer-candidates">
              <h4 className="font-semibold text-lg mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                For Candidates
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-white">Create Profile</Link></li>
                <li><a href="/ai-interview" className="hover:text-white">AI Interview</a></li>
                <li><a href="/success-stories" className="hover:text-white">Success Stories</a></li>
              </ul>
            </div>

            {/* Support */}
            <div data-testid="footer-support">
              <h4 className="font-semibold text-lg mb-4 flex items-center">
                <Headphones className="w-5 h-5 mr-2" />
                Support
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <a href="mailto:support@MedEvidences.com" className="hover:text-white">support@MedEvidences.com</a>
                </li>
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/faq" className="hover:text-white">FAQ</a></li>
                <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div data-testid="footer-resources">
              <h4 className="font-semibold text-lg mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Resources
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/research" className="hover:text-white">Research</Link></li>
                <li><a href="/guides" className="hover:text-white">Career Guides</a></li>
                <li><a href="/whitepapers" className="hover:text-white">Whitepapers</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p data-testid="footer-text">© 2025 MedEvidences. Empowering the future of medical and scientific talent.</p>
            <div className="mt-4 space-x-4">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/cookies" className="hover:text-white">Cookie Policy</a>
              {!user && (
                <>
                  <span className="text-gray-600">|</span>
                  <Link to="/admin" className="hover:text-white text-xs">Admin</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
