import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

export default function JobOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/job-offers/candidate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    if (!confirm('Accept this job offer?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/job-offers/${offerId}/accept`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success('✅ Offer accepted!');
      fetchOffers();
    } catch (error) {
      console.error('Accept error:', error);
      toast.error(error.response?.data?.detail || 'Failed to accept');
    }
  };

  const handleReject = async (offerId) => {
    if (!confirm('Reject this job offer?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/job-offers/${offerId}/reject`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success('Offer rejected');
      fetchOffers();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={styles[status] || ''}>{status.toUpperCase()}</Badge>;
  };

  if (loading) return <div className="p-6">Loading offers...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-4">
          ← Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-6">💼 Job Offers</h1>

        {offers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600">No job offers yet. Keep applying!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {offers.map(offer => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{offer.job_title}</CardTitle>
                      <p className="text-gray-600 mt-1">{offer.company_name}</p>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Salary Offered</p>
                        <p className="font-semibold text-lg">{offer.salary_offered || 'Negotiable'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Employment Type</p>
                        <p className="font-semibold">{offer.employment_type}</p>
                      </div>
                      {offer.start_date && (
                        <div>
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="font-semibold">{offer.start_date}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Offer Date</p>
                        <p className="font-semibold">
                          {new Date(offer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {offer.benefits && offer.benefits.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Benefits</p>
                        <div className="flex flex-wrap gap-2">
                          {offer.benefits.map((benefit, i) => (
                            <Badge key={i} variant="outline">{benefit}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {offer.notes && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">{offer.notes}</p>
                      </div>
                    )}

                    {offer.status === 'pending' && (
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={() => handleAccept(offer.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          ✓ Accept Offer
                        </Button>
                        <Button
                          onClick={() => handleReject(offer.id)}
                          variant="outline"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                        >
                          ✗ Decline
                        </Button>
                      </div>
                    )}

                    {offer.status === 'accepted' && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded">
                        <p className="text-green-800 font-semibold">🎉 You accepted this offer!</p>
                        <p className="text-sm text-green-700 mt-1">
                          Accepted on: {new Date(offer.accepted_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
