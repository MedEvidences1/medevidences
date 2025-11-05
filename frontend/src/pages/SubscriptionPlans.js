import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'candidate') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pricing plans
      const plansRes = await fetch(`${API}/subscription/pricing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      // Fetch current subscription
      const subRes = await fetch(`${API}/subscription/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subData = await subRes.json();
      setCurrentSubscription(subData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_id: planId })
      });

      const data = await response.json();
      
      if (response.ok) {
        // In production, redirect to Stripe checkout
        toast.success('Redirecting to payment...');
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.detail || 'Failed to create checkout session');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/subscription/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Unlock premium features and apply to unlimited jobs</p>
        </div>

        {currentSubscription && currentSubscription.subscription_status === 'active' && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Current Plan: {currentSubscription.subscription_plan?.toUpperCase()}
                  </h3>
                  <p className="text-sm text-green-700">
                    Active until {new Date(currentSubscription.subscription_end).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" onClick={handleCancelSubscription} className="border-red-300 text-red-600 hover:bg-red-50">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Get started with basic features</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Browse all job listings
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View job details
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create profile
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Apply to jobs
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  AI interview
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Render paid plans */}
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? 'border-blue-500 shadow-lg relative' : ''}>
              {plan.popular && (
                <Badge className="absolute -top-3 right-4 bg-blue-600">Most Popular</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={currentSubscription?.subscription_status === 'active' && currentSubscription?.subscription_plan === plan.id}
                >
                  {currentSubscription?.subscription_status === 'active' && currentSubscription?.subscription_plan === plan.id
                    ? 'Current Plan'
                    : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>All plans include secure payment processing and can be cancelled anytime.</p>
        </div>
      </div>
    </div>
  );
}
