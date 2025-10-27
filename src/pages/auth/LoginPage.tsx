import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
    const startTime = Date.now();
    console.log(`[Login] Started at ${new Date().toISOString()}`);
    
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      console.log(`[Login] Timeout fired after 60 seconds (elapsed: ${Date.now() - startTime}ms)`);
      toast.error('Login timed out after 60 seconds. Please check your connection and try again.');
    }, 60000);

    const progressTimeout = setTimeout(() => {
      console.log(`[Login] 15s elapsed, showing progress message`);
      toast.info('Connecting... This can take longer on first request. Please wait.', { autoClose: false, toastId: 'login-progress' });
    }, 15000);

    try {
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      console.log(`[Login] Calling signInWithPassword at ${Date.now() - startTime}ms`);
      
      let authResult: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>> | null = null;
      let retryAttempted = false;
      
      const signInPromise = supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      const retryTimer = setTimeout(async () => {
        if (!authResult) {
          retryAttempted = true;
          console.log(`[Login] No response after 25s, initiating retry attempt at ${Date.now() - startTime}ms`);
          toast.dismiss('login-progress');
          toast.info('Still connecting... Retrying authentication.', { autoClose: false, toastId: 'login-retry' });
        }
      }, 25000);

      authResult = await signInPromise;
      clearTimeout(retryTimer);
      
      console.log(`[Login] signInWithPassword completed at ${Date.now() - startTime}ms (retry attempted: ${retryAttempted})`);
      
      const { data: authData, error: authError } = authResult;

      if (authError) {
        clearTimeout(loginTimeout);
        clearTimeout(progressTimeout);
        toast.dismiss('login-progress');
        toast.dismiss('login-retry');
        console.log(`[Login] Auth error at ${Date.now() - startTime}ms:`, authError.message);
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

      console.log(`[Login] Calling getSession at ${Date.now() - startTime}ms`);
      await supabase.auth.getSession();
      console.log(`[Login] getSession completed at ${Date.now() - startTime}ms`);
      
      await new Promise((resolve) => setTimeout(resolve, 400));

      clearTimeout(loginTimeout);
      clearTimeout(progressTimeout);
      toast.dismiss('login-progress');
      toast.dismiss('login-retry');
      console.log(`[Login] Success! Total time: ${Date.now() - startTime}ms`);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      clearTimeout(loginTimeout);
      clearTimeout(progressTimeout);
      toast.dismiss('login-progress');
      toast.dismiss('login-retry');
      console.error(`[Login] Error at ${Date.now() - startTime}ms:`, error);
      const message = (error as Error)?.message || 'An unexpected error occurred. Please try again.';
      toast.error(message);
    } finally {
      clearTimeout(loginTimeout);
      clearTimeout(progressTimeout);
      setLoading(false);
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
