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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'candidate'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      onLogin(response.data.user, response.data.access_token);
      toast.success('Registration successful!');
      
      // Navigate based on role
      if (formData.role === 'candidate') {
        navigate('/dashboard/candidate');
      } else {
        navigate('/dashboard/employer');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md" data-testid="register-card">
        <CardHeader className="space-y-1">
          <Link to="/">
            <h1 className="text-2xl font-bold text-blue-600 mb-4" data-testid="logo">MedEvidences</h1>
          </Link>
          <CardTitle className="text-2xl" data-testid="register-title">Create an account</CardTitle>
          <CardDescription data-testid="register-description">Join MedEvidences to find your dream role</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                data-testid="fullname-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                data-testid="password-input"
              />
            </div>
            <div className="space-y-2">
              <Label>I am a:</Label>
              <RadioGroup value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} data-testid="role-radio-group">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="candidate" id="candidate" data-testid="role-candidate" />
                  <Label htmlFor="candidate" className="cursor-pointer">Candidate (Looking for jobs)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="employer" id="employer" data-testid="role-employer" />
                  <Label htmlFor="employer" className="cursor-pointer">Employer (Hiring talent)</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="register-button">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-blue-600 hover:underline" data-testid="login-link">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;
