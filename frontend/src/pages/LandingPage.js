import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, TrendingUp, CheckCircle } from 'lucide-react';

function LandingPage({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600" data-testid="logo">MedEvidences</h1>
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
          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6" data-testid="hero-register-button">Join as Candidate</Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="hero-employer-button">Post Jobs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="categories-title">Specialized Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
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
            ].map((category) => (
              <Card key={category} className="hover:shadow-lg transition-shadow" data-testid={`category-card-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                <CardHeader>
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="features-title">Why Choose MedEvidences?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="feature-smart-matching">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  Our intelligent algorithm matches candidates with perfect opportunities based on skills and experience.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="feature-verified-talent">
              <CardHeader>
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Verified Talent</CardTitle>
                <CardDescription>
                  Access a pool of verified medical and scientific professionals with proven expertise.
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

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="how-it-works-title">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-xl font-bold mb-6 flex items-center" data-testid="for-candidates-title">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                For Candidates
              </h4>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-gray-700">Create your professional profile</li>
                <li className="text-gray-700">Browse opportunities matching your expertise</li>
                <li className="text-gray-700">Apply with custom cover letters</li>
                <li className="text-gray-700">Track your applications and get hired</li>
              </ol>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-6 flex items-center" data-testid="for-employers-title">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                For Employers
              </h4>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-gray-700">Post your job openings</li>
                <li className="text-gray-700">Browse qualified candidates</li>
                <li className="text-gray-700">Review applications and profiles</li>
                <li className="text-gray-700">Hire the perfect talent</li>
              </ol>
            </div>
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
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p data-testid="footer-text">© 2025 MedEvidences. Empowering the future of medical and scientific talent.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
