import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (response.ok) {
        setResetToken(data.reset_token);
        toast.success('Reset token generated!');
      } else {
        toast.error(data.detail || 'Failed to generate reset token');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/"><h1 className="text-2xl font-bold text-blue-600 mb-4">MedEvidences</h1></Link>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          {!resetToken ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Get Reset Token'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-800 mb-2">Your password reset token:</p>
                <code className="block bg-white p-2 rounded text-sm break-all">{resetToken}</code>
              </div>
              <Link to={`/reset-password?token=${resetToken}`}>
                <Button className="w-full">Continue to Reset Password</Button>
              </Link>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
