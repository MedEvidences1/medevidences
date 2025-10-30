import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { TrendingUp, Briefcase, MapPin, Target } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MatchedJobs({ user, onLogout }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/matching/jobs`);
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/">
              <h1 className="text-2xl font-bold text-blue-600">MedEvidences</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/candidate">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="w-8 h-8 mr-3 text-blue-600" />
            AI-Matched Jobs
          </h2>
          <p className="text-gray-600 mt-2">Jobs matched to your profile using AI algorithms</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Finding your perfect matches...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.job_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{match.job_title}</CardTitle>
                        <Badge className="bg-green-100 text-green-800">
                          {match.match_percentage}% Match
                        </Badge>
                      </div>
                      <CardDescription>{match.company_name}</CardDescription>
                    </div>
                    <Link to={`/jobs/${match.job_id}`}>
                      <Button>View Job</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Match Score</span>
                        <span className="font-semibold">{match.match_percentage}%</span>
                      </div>
                      <Progress value={match.match_percentage} className="h-2" />
                    </div>

                    {match.matched_skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Matching Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.matched_skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.match_reasons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Why You're a Great Fit</h4>
                        <ul className="space-y-1">
                          {match.match_reasons.map((reason, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {match.missing_skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills to Develop</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.missing_skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-gray-500">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No matched jobs found</p>
              <p className="text-gray-400 text-sm mb-6">
                Complete your profile and AI interview to get personalized job matches
              </p>
              <Link to="/ai-interview">
                <Button>Take AI Interview</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default MatchedJobs;
