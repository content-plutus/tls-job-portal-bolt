import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Chrome } from 'lucide-react';
import { GOOGLE_FORM_URL } from '../../config/constants';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ParticleBackground from '../../components/3d/ParticleBackground';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      rememberMe: localStorage.getItem('rememberedEmail') ? true : false,
    },
  });


  useEffect(() => {
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      toast.error('Login timed out after 20 seconds. Please check your connection and try again.');
    }, 20000);

    try {
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Explicit timeout race for the auth call to avoid rare hanging promises
      const authPromise = supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('login_request_timeout')), 15000));
      const authResult = (await Promise.race([authPromise, timeoutPromise])) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

      const { data: authData, error: authError } = authResult || ({} as any);

      if (authError) {
        clearTimeout(loginTimeout);
        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message?.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.');
        } else if (authError.message?.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        }
        throw authError;
      }

      if (!authData?.user) {
        throw new Error('Login failed unexpectedly. Please try again.');
      }

      // Verify session established
      await supabase.auth.getSession();
      await new Promise((resolve) => setTimeout(resolve, 400));

      clearTimeout(loginTimeout);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      clearTimeout(loginTimeout);
      console.error('Login error:', error);
      const message = error?.message === 'login_request_timeout'
        ? 'Login is taking longer than expected. Please try again.'
        : (error?.message || 'An unexpected error occurred. Please try again.');
      toast.error(message);
    } finally {
      clearTimeout(loginTimeout);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSocialLoading('google');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to login with Google. Please try again.');
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900 flex items-center justify-center p-6">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to home
          </Link>
        </div>

        <Card glass className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-legal-gold-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-legal-gold-500 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                  role="alert"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-label="Password"
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-legal-gold-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-legal-gold-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-legal-gold-500 rounded p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                  role="alert"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label htmlFor="remember-me" className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  id="remember-me"
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-legal-gold-500/30 bg-white/5 text-legal-gold-500 focus:ring-2 focus:ring-legal-gold-500 cursor-pointer"
                  aria-label="Remember me"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-legal-gold-400 hover:text-legal-gold-300 transition-colors focus:outline-none focus:ring-2 focus:ring-legal-gold-500 rounded px-1"
                tabIndex={0}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              aria-label="Sign in to your account"
            >
              Sign In
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-legal-gold-500/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-legal-navy-900 text-gray-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              isLoading={socialLoading === 'google'}
              disabled={socialLoading !== null}
              className="w-full"
              aria-label="Sign in with Google"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>

            <p className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-legal-gold-400 hover:text-legal-gold-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-legal-gold-500 rounded px-1"
              >
                Sign up
              </a>
            </p>
          </form>

        </Card>
      </motion.div>
    </div>
  );
}
