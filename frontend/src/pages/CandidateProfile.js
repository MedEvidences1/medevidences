import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { Briefcase, MapPin, GraduationCap, Award, FileText, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CandidateProfile({ user, onLogout }) {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  const fetchCandidate = async () => {
    try {
      const response = await axios.get(`${API}/candidates/${candidateId}`);
      setCandidate(response.data);
    } catch (error) {
      console.error('Error fetching candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500" data-testid="loading-message">Loading profile...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500" data-testid="not-found-message">Candidate not found</p>
      </div>
    );
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
              {user && user.role === 'employer' && (
                <Link to="/candidates">
                  <Button variant="ghost" data-testid="back-link">Back to Candidates</Button>
                </Link>
              )}
              {user ? (
                <>
                  <Link to={user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer'}>
                    <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
                  </Link>
                  <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
                </>
              ) : (
                <Link to="/login">
                  <Button data-testid="login-link">Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card data-testid="profile-card">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2" data-testid="candidate-name">{candidate.full_name}</CardTitle>
                <CardDescription className="text-lg" data-testid="candidate-specialization">{candidate.specialization}</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center text-gray-600">
                <Briefcase className="w-5 h-5 mr-2" />
                <span data-testid="candidate-experience">{candidate.experience_years} years experience</span>
              </div>
              {candidate.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span data-testid="candidate-location">{candidate.location}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2" />
                <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline" data-testid="candidate-email">
                  {candidate.email}
                </a>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Bio */}
            {candidate.bio && (
              <div>
                <h3 className="text-xl font-semibold mb-3" data-testid="bio-title">About</h3>
                <p className="text-gray-700 whitespace-pre-line" data-testid="candidate-bio">{candidate.bio}</p>
              </div>
            )}

            {/* Skills */}
            <div>
              <h3 className="text-xl font-semibold mb-3" data-testid="skills-title">Skills</h3>
              <div className="flex flex-wrap gap-2" data-testid="candidate-skills">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center mb-3">
                <GraduationCap className="w-5 h-5 mr-2 text-gray-400" />
                <h3 className="text-xl font-semibold" data-testid="education-title">Education</h3>
              </div>
              <p className="text-gray-700" data-testid="candidate-education">{candidate.education}</p>
            </div>

            {/* Certifications */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <Award className="w-5 h-5 mr-2 text-gray-400" />
                  <h3 className="text-xl font-semibold" data-testid="certifications-title">Certifications</h3>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="candidate-certifications">
                  {candidate.certifications.map((cert, index) => (
                    <Badge key={index}>{cert}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Publications */}
            {candidate.publications && candidate.publications.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 mr-2 text-gray-400" />
                  <h3 className="text-xl font-semibold" data-testid="publications-title">Publications</h3>
                </div>
                <ul className="list-disc list-inside space-y-2" data-testid="candidate-publications">
                  {candidate.publications.map((pub, index) => (
                    <li key={index} className="text-gray-700">{pub}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Info */}
            <div className="pt-6 border-t">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Availability</h4>
                  <p className="text-gray-900" data-testid="candidate-availability">{candidate.availability}</p>
                </div>
                {candidate.salary_expectation && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Salary Expectation</h4>
                    <p className="text-gray-900" data-testid="candidate-salary">{candidate.salary_expectation}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CandidateProfile;
