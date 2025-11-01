import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

function PaymentCheckout({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, amount } = location.state || {};
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'employer') {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      toast.success('Payment successful! Your job will be posted.');
      setProcessing(false);
      navigate('/dashboard/employer');
    }, 2000);
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Purchase</CardTitle>
            <CardDescription>Secure payment powered by Stripe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">{plan}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">${amount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Secure SSL encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">In production, Stripe payment form would appear here</p>
              <Button 
                onClick={handlePayment} 
                disabled={processing}
                size="lg"
                className="w-full"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {processing ? 'Processing...' : `Pay $${amount}`}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PaymentCheckout;