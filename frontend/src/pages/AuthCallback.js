import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthCallback({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error('No session ID found');
        navigate('/login');
        return;
      }

      // Send to backend
      const response = await axios.post(`${API}/auth/session`, {}, {
        headers: { 'X-Session-ID': sessionId }
      });

      const { session_token, user } = response.data;

      // Set session cookie
      document.cookie = `session_token=${session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // If no role, ask user to select
      if (!user.role) {
        navigate('/select-role', { state: { user, session_token } });
      } else {
        onLogin(user, session_token);
        toast.success(`Welcome back, ${user.name}!`);
        navigate(user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Authentication failed. Please try again.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;