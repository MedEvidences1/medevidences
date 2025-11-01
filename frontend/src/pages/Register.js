import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Register({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'candidate' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      onLogin(response.data.user, response.data.access_token);
      toast.success('Registration successful!');
      if (formData.role === 'candidate') { navigate('/dashboard/candidate'); } else { navigate('/dashboard/employer'); }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `https://demobackend.emergentagent.com/auth/v1/env/oauth?redirect_url=${redirectUrl}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link to="/"><h1 className="text-2xl font-bold text-blue-600 mb-4">MedEvidences</h1></Link>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Join MedEvidences to find your dream role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign up with Google
            </Button>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with email</span></div></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="full_name">Full Name</Label><Input id="full_name" type="text" placeholder="John Doe" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} /></div>
              <div className="space-y-2"><Label>I am a:</Label><RadioGroup value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}><div className="flex items-center space-x-2"><RadioGroupItem value="candidate" id="candidate" /><Label htmlFor="candidate" className="cursor-pointer">Candidate</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="employer" id="employer" /><Label htmlFor="employer" className="cursor-pointer">Employer</Label></div></RadioGroup></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm"><span className="text-gray-600">Already have an account? </span><Link to="/login" className="text-blue-600 hover:underline">Login</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;