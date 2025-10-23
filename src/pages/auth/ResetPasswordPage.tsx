import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ParticleBackground from '../../components/3d/ParticleBackground';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>();

  const passwordValue = watch('password', '');

  useEffect(() => {
    checkResetToken();
  }, []);

  useEffect(() => {
    calculatePasswordStrength(passwordValue);
  }, [passwordValue]);

  const checkResetToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        toast.error('Invalid or expired reset link. Please request a new one.');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setIsValidToken(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    setPasswordStrength(strength);
  };

  const getStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully! Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-legal-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900 flex items-center justify-center p-6">
        <ParticleBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Card glass className="p-8 text-center">
            <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
            <p className="text-gray-300 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-3">
              <Link to="/forgot-password" className="block">
                <Button variant="secondary" className="w-full">
                  Request New Link
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white">
                  Back to Login
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900 flex items-center justify-center p-6">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card glass className="p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-legal-gold-600 to-legal-gold-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-300">
              Choose a strong password to secure your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  aria-label="New password"
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and number',
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
              {passwordValue && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 50 ? 'text-red-400' : passwordStrength < 75 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength}%` }}
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password-input" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-label="Confirm password"
                  aria-required="true"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === passwordValue || 'Passwords do not match',
                  })}
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/5 border border-legal-gold-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-legal-gold-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-legal-gold-500 rounded p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-400"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Password Requirements
              </h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li className={passwordValue.length >= 8 ? 'text-green-400' : ''}>
                  • At least 8 characters long
                </li>
                <li className={/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue) ? 'text-green-400' : ''}>
                  • Contains uppercase and lowercase letters
                </li>
                <li className={/[0-9]/.test(passwordValue) ? 'text-green-400' : ''}>
                  • Contains at least one number
                </li>
                <li className={/[^a-zA-Z0-9]/.test(passwordValue) ? 'text-green-400' : ''}>
                  • Contains a special character (recommended)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              aria-label="Reset password"
            >
              Reset Password
            </Button>

            <div className="text-center text-sm text-gray-400">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-legal-gold-400 hover:text-legal-gold-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-legal-gold-500 rounded px-1"
              >
                Sign in
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
