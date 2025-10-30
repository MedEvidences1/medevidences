import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { Users, Search, Briefcase, MapPin } from 'lucide-react';

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

function BrowseCandidates({ user, onLogout }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: ''
  });

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  const fetchCandidates = async () => {
    try {
      let url = `${API}/candidates`;
      const params = [];
      if (filters.specialization) params.push(`specialization=${filters.specialization}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axios.get(url);
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
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
              <Link to="/dashboard/employer">
                <Button variant="ghost" data-testid="dashboard-link">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={onLogout} data-testid="logout-button">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="page-title">Browse Candidates</h2>
          <p className="text-gray-600 mt-2" data-testid="page-subtitle">Find qualified professionals for your organization</p>
        </div>

        {/* Filters */}
        <Card className="mb-6" data-testid="filters-card">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Select value={filters.specialization} onValueChange={(value) => setFilters({ ...filters, specialization: value })}>
                  <SelectTrigger data-testid="specialization-filter">
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Specializations</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-message">
            <p className="text-gray-500">Loading candidates...</p>
          </div>
        ) : candidates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="candidates-list">
            {candidates.map((candidate) => (
              <Card key={candidate.user_id} className="hover:shadow-lg transition-shadow" data-testid={`candidate-card-${candidate.user_id}`}>
                <CardHeader>
                  <CardTitle className="text-lg" data-testid={`candidate-name-${candidate.user_id}`}>{candidate.full_name}</CardTitle>
                  <CardDescription data-testid={`candidate-specialization-${candidate.user_id}`}>{candidate.specialization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span data-testid={`candidate-experience-${candidate.user_id}`}>{candidate.experience_years} years experience</span>
                    </div>
                    {candidate.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span data-testid={`candidate-location-${candidate.user_id}`}>{candidate.location}</span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1" data-testid={`candidate-skills-${candidate.user_id}`}>
                        {candidate.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {candidate.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{candidate.skills.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                    <Link to={`/candidates/${candidate.user_id}`} className="block">
                      <Button className="w-full mt-4" size="sm" data-testid={`view-profile-${candidate.user_id}`}>View Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-candidates-message">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No candidates found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseCandidates;
