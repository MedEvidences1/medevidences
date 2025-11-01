import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SelectRole({ onLogin }) {
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session_token } = location.state || {};

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/set-role?role=${role}`, {}, {
        headers: { 'Cookie': `session_token=${session_token}` },
        withCredentials: true
      });

      const updatedUser = response.data;
      onLogin(updatedUser, session_token);
      toast.success('Welcome to MedEvidences!');
      navigate(role === 'candidate' ? '/dashboard/candidate' : '/dashboard/employer');
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to MedEvidences!</CardTitle>
          <CardDescription>Please select your account type to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={role} onValueChange={setRole}>
            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" onClick={() => setRole('candidate')}>
              <RadioGroupItem value="candidate" id="candidate" />
              <div className="flex-1">
                <Label htmlFor="candidate" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">I'm a Candidate</span>
                  </div>
                  <p className="text-sm text-gray-600">Looking for jobs in medical and scientific fields</p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" onClick={() => setRole('employer')}>
              <RadioGroupItem value="employer" id="employer" />
              <div className="flex-1">
                <Label htmlFor="employer" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">I'm an Employer</span>
                  </div>
                  <p className="text-sm text-gray-600">Hiring medical and scientific professionals</p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
            {loading ? 'Setting up...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SelectRole;