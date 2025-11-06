import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { Briefcase, MapPin, Clock, Search } from 'lucide-react';

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

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote'];

function BrowseJobs({ user, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    jobType: '',
    location: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs`);
      setJobs(response.data);
      setTotalCount(response.data.length);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    if (filters.search) {
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          job.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    if (filters.jobType) {
      filtered = filtered.filter(job => job.job_type === filters.jobType);
    }

    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
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
                    <Button data-testid="register-link">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="page-title">Browse Jobs</h2>
          <p className="text-gray-600 mt-2" data-testid="page-subtitle">Find your next opportunity in medical and scientific fields</p>
        </div>

        {/* Filters */}
        <Card className="mb-6" data-testid="filters-card">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search jobs..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
              </div>
              <div>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger data-testid="category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filters.jobType} onValueChange={(value) => setFilters({ ...filters, jobType: value })}>
                  <SelectTrigger data-testid="job-type-filter">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Types</SelectItem>
                    {JOB_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-message">
            <p className="text-gray-500">Loading jobs...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4" data-testid="jobs-list">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`job-card-${job.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`job-title-${job.id}`}>{job.title}</CardTitle>
                      <CardDescription className="mt-2" data-testid={`job-company-${job.id}`}>{job.company_name}</CardDescription>
                    </div>
                    <Link to={`/jobs/${job.id}`}>
                      <Button data-testid={`view-job-${job.id}`}>View Details</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Badge variant="secondary" data-testid={`job-category-${job.id}`}>{job.category}</Badge>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {job.job_type}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {job.experience_required}
                    </div>
                  </div>
                  <p className="text-gray-700 line-clamp-2" data-testid={`job-description-${job.id}`}>{job.description}</p>
                  {job.salary_range && (
                    <p className="text-sm text-green-600 font-semibold mt-2" data-testid={`job-salary-${job.id}`}>{job.salary_range}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="no-jobs-message">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseJobs;
