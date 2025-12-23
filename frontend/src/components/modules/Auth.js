/**
 * Authentication Components for Plutus Predict
 * AuthModal, ChangePasswordModal
 */
import React, { useState } from 'react';
import { X, Eye, EyeOff, LogIn, UserPlus, Lock, Loader2, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

export const AuthModal = ({ isOpen, onClose, login, register }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password, name);
        toast.success('Account created! Welcome to Plutus Predict.');
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    }
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#888] hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[#888] text-sm">
            {mode === 'login' 
              ? 'Sign in to access your predictions' 
              : 'Start your 60-minute free trial'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs text-[#888] uppercase tracking-wider">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 bg-[#050505] border-[#1F1F1F]"
                required
              />
            </div>
          )}
          
          <div>
            <label className="text-xs text-[#888] uppercase tracking-wider">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-10 bg-[#050505] border-[#1F1F1F]"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-[#888] uppercase tracking-wider">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-[#050505] border-[#1F1F1F]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4 mr-2" /> Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-[#00E5FF] hover:underline"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#888] hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
        
        <form className="space-y-4">
          <div>
            <label className="text-xs text-[#888] uppercase">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 bg-[#050505] border-[#1F1F1F]"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#888] uppercase">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 bg-[#050505] border-[#1F1F1F]"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#888] uppercase">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 bg-[#050505] border-[#1F1F1F]"
              required
            />
          </div>
          <Button className="w-full bg-[#00E5FF] text-black" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default { AuthModal, ChangePasswordModal };
