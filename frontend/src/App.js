import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '@/App.css';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import CandidateDashboard from '@/pages/CandidateDashboardNew';
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
import Settings from '@/pages/Settings';
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
    checkAuth();
  }, []);

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
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer'} />}
        />
        <Route
          path="/register"
          element={!user ? <Register onLogin={handleLogin} /> : <Navigate to={user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer'} />}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
