import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const activateSubscription = async () => {
      const sessionId = searchParams.get('session_id');
      const success = searchParams.get('success');
      const cancelled = searchParams.get('cancelled');

      if (cancelled === 'true') {
        toast.error('Payment cancelled');
        navigate('/subscription');
        return;
      }

      if (success === 'true' && sessionId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API}/subscription/activate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId })
          });

          const data = await response.json();

          if (response.ok) {
            toast.success('Subscription activated successfully! 🎉');
            
            // Check if there's a pending job application
            const pendingJobId = sessionStorage.getItem('pendingJobApplication');
            
            if (pendingJobId) {
              // Clear the pending job
              sessionStorage.removeItem('pendingJobApplication');
              // Redirect to job details to apply
              setTimeout(() => {
                navigate(`/jobs/${pendingJobId}`);
              }, 1500);
            } else {
              // Redirect to browse jobs
              setTimeout(() => {
                navigate('/browse-jobs');
              }, 1500);
            }
          } else {
            toast.error(data.detail || 'Failed to activate subscription');
            navigate('/subscription');
          }
        } catch (error) {
          console.error('Activation error:', error);
          toast.error('Error activating subscription');
          navigate('/subscription');
        }
      } else {
        navigate('/subscription');
      }
      
      setProcessing(false);
    };

    activateSubscription();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing your subscription...</h2>
            <p className="text-gray-600">Please wait while we activate your account</p>
          </>
        ) : (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
            <p className="text-gray-600">Redirecting you...</p>
          </>
        )}
      </div>
    </div>
  );
}
