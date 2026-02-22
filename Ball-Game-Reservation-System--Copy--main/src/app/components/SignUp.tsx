import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signup, signInWithProvider } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRole = (new URLSearchParams(location.search).get('role') || 'player') as 'admin' | 'coach' | 'player';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast.error('You must accept the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const { success, message } = await signup(email, password, selectedRole, {
        name,
      });
      
      if (success) {
        toast.success('Account created successfully! Please sign in.');
        navigate(`/sign-in?role=${selectedRole}`, { state: { role: selectedRole } });
      } else {
        toast.error(message || 'Failed to create account');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    const result = await signInWithProvider(provider, selectedRole);
    if (!result.success) {
      toast.error(result.message || 'Unable to continue with social sign-up.');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen overflow-hidden flex items-center justify-center p-3 bg-cover bg-center relative"
      style={{
        backgroundImage: `url('/landing-bg.png')`
      }}
    >
      <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"></div>
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-7 relative z-10 border border-white/50 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-5">
          <img src="/ventra-logo.png" alt="Ventra" className="h-24 md:h-28 w-auto mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl text-slate-900 mb-1">Create Account</h1>
          <p className="text-gray-600">Join us to book your next game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-2">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
                placeholder="John Doe"
                required
              />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
                placeholder="you@example.com"
                required
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pl-10 pr-10"
                placeholder="Enter your password"
                required
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-500"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-green-300"
              />
            </div>
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the <a href="#" className="text-green-600 hover:underline">Terms of Service</a> and <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign Up'}
          </button>
        </form>

        <div className="my-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gray-300" />
            <p className="text-sm text-gray-600 text-center whitespace-nowrap">or sign up with</p>
            <div className="h-px flex-1 bg-gray-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialSignUp('facebook')}
              disabled={isLoading}
              aria-label="Sign up with Facebook"
              className="w-full border border-gray-300 bg-white text-gray-800 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <img src="/facebook.png" alt="Facebook" className="w-5 h-5" />
              Facebook
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignUp('google')}
              disabled={isLoading}
              aria-label="Sign up with Google"
              className="w-full border border-gray-300 bg-white text-gray-800 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <img src="/Google.png" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to={`/sign-in?role=${selectedRole}`} className="text-indigo-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
