import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MercorJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(50);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchMercorJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams({
        order_by: orderBy,
        limit: limit
      });
      
      if (searchQuery && orderBy === 'search') {
        params.append('search_query', searchQuery);
      }
      
      const response = await fetch(`${API}/scrape/mercor-jobs?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setJobs(data.jobs || []);
        toast.success(data.message);
      } else {
        toast.error(data.detail || 'Failed to fetch jobs');
      }
    } catch (error) {
      toast.error('Error fetching jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const importJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/scrape/convert-to-job/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Job imported successfully!');
        // Update job in list to show as imported
        setJobs(jobs.map(j => j.id === jobId ? {...j, imported: true} : j));
      } else {
        toast.error(data.detail || 'Failed to import job');
      }
    } catch (error) {
      toast.error('Error importing job: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/employer-dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Import External Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order By</label>
                <select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="search">Search Relevance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Limit</label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Search Query {orderBy !== 'search' && <span className="text-gray-400">(set order to "Search")</span>}
                </label>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. software engineer"
                  disabled={orderBy !== 'search'}
                  className="w-full"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchMercorJobs}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Fetching...' : 'Fetch Jobs'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Note:</strong> When using "Newest" or "Oldest", search query is ignored.</p>
              <p>Use "Search Relevance" with a search query to filter by keywords.</p>
            </div>
          </CardContent>
        </Card>

        {jobs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Found {jobs.length} Jobs
            </h2>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          {job.imported && (
                            <Badge className="bg-green-100 text-green-800">Imported</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{job.company}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{job.location}</Badge>
                          <Badge variant="outline">{job.commitment}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">{job.salary_range}</Badge>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                          {job.description}
                        </p>

                        <div className="flex gap-4 text-sm text-gray-600">
                          {job.referral_amount && (
                            <span>💰 Referral: ${job.referral_amount}</span>
                          )}
                          {job.recent_candidates && (
                            <span>👥 {job.recent_candidates} hired this month</span>
                          )}
                          <span>📅 Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => importJob(job.id)}
                          disabled={job.imported}
                          size="sm"
                        >
                          {job.imported ? 'Imported' : 'Import Job'}
                        </Button>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline text-center"
                        >
                          View Original
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p className="text-lg mb-2">No jobs fetched yet</p>
              <p className="text-sm">Click "Fetch Jobs" to import listings from Mercor</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
