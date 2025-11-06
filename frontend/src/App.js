import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '@/App.css';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AuthCallback from '@/pages/AuthCallback';
import SelectRole from '@/pages/SelectRole';
import CandidateDashboard from '@/pages/CandidateDashboard';
import EmployerDashboard from '@/pages/EmployerDashboard';
import BrowseJobs from '@/pages/BrowseJobs';
import JobDetails from '@/pages/JobDetails';
import BrowseCandidates from '@/pages/BrowseCandidates';
import CandidateProfile from '@/pages/CandidateProfile';
import PostJob from '@/pages/PostJob';
import MyApplications from '@/pages/MyApplications';
import ReceivedApplications from '@/pages/ReceivedApplications';
import AIInterview from '@/pages/AIInterview';
import MatchedJobs from '@/pages/MatchedJobs';
import AdminPanel from '@/pages/AdminPanel';
import ResumeUpload from '@/pages/ResumeUpload';
import MatchScores from '@/pages/MatchScores';
import PayrollTracking from '@/pages/PayrollTracking';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import SubscriptionPlans from '@/pages/SubscriptionPlans';
import MercorJobs from '@/pages/MercorJobs';
import VideoInterviewRecorder from '@/pages/VideoInterviewRecorder';
import JobOffers from '@/pages/JobOffers';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set axios default headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    // Check for session_id in URL fragment (OAuth callback)
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');
      
      if (sessionId) {
        try {
          console.log('Processing OAuth session_id...');
          
          // Exchange session_id for user data and session_token
          const response = await fetch(`${API}/auth/session`, {
            method: 'POST',
            headers: {
              'X-Session-ID': sessionId,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
          
          const data = await response.json();
          
          if (response.ok) {
            console.log('OAuth session created successfully');
            
            // Store session token
            localStorage.setItem('token', data.session_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Clean URL
            window.history.replaceState(null, '', window.location.pathname);
            
            // If user has no role, redirect to role selection
            if (!data.user.role) {
              console.log('User has no role, redirecting to role selection');
              window.location.href = '/select-role';
              return;
            }
            
            // Set user and redirect to dashboard
            console.log('Redirecting to dashboard for role:', data.user.role);
            setUser(data.user);
            window.location.href = data.user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer';
            return;
          } else {
            console.error('OAuth session creation failed:', data);
            alert('Authentication failed: ' + (data.detail || 'Unknown error'));
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          alert('Authentication error. Please try again.');
          window.location.href = '/login';
        }
        setLoading(false);
        return;
      }
    }
    
    // Check existing auth
    await checkAuth();
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} onLogout={handleLogout} />} />
        <Route
          path="/login"
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.email === 'admin@medevidences.com' ? '/admin' : (user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer')} />}
        />
        <Route
          path="/register"
          element={!user ? <Register onLogin={handleLogin} /> : <Navigate to={user.email === 'admin@medevidences.com' ? '/admin' : (user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer')} />}
        />
        <Route
          path="/dashboard/candidate"
          element={user && user.role === 'candidate' ? <CandidateDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard/employer"
          element={user && user.role === 'employer' ? <EmployerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/jobs" element={<BrowseJobs user={user} onLogout={handleLogout} />} />
        <Route path="/jobs/:jobId" element={<JobDetails user={user} onLogout={handleLogout} />} />
        <Route
          path="/candidates"
          element={user && user.role === 'employer' ? <BrowseCandidates user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/candidates/:candidateId" element={<CandidateProfile user={user} onLogout={handleLogout} />} />
        <Route
          path="/post-job"
          element={user && user.role === 'employer' ? <PostJob user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-applications"
          element={user && user.role === 'candidate' ? <MyApplications user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/received-applications"
          element={user && user.role === 'employer' ? <ReceivedApplications user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/ai-interview"
          element={user && user.role === 'candidate' ? <AIInterview user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/matched-jobs"
          element={user && user.role === 'candidate' ? <MatchedJobs user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/resume-upload"
          element={user && user.role === 'candidate' ? <ResumeUpload user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/match-scores"
          element={user && user.role === 'employer' ? <MatchScores user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/match-scores/:jobId"
          element={user && user.role === 'employer' ? <MatchScores user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/payroll-tracking"
          element={user ? <PayrollTracking user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
        <Route path="/select-role" element={<SelectRole onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subscription" element={user && user.role === 'candidate' ? <SubscriptionPlans /> : <Navigate to="/login" />} />
        <Route path="/video-interview" element={user && user.role === 'candidate' ? <VideoInterviewRecorder /> : <Navigate to="/login" />} />
        <Route path="/job-offers" element={user && user.role === 'candidate' ? <JobOffers /> : <Navigate to="/login" />} />
        <Route path="/mercor-jobs" element={user && user.email === 'admin@medevidences.com' ? <MercorJobs /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user && user.email === 'admin@medevidences.com' ? <AdminPanel user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
