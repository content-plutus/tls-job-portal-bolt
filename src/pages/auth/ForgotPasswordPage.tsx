import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ParticleBackground from '../../components/3d/ParticleBackground';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSentEmail(data.email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-legal-gold-500 rounded px-1"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to login
          </Link>
        </div>

        <Card glass className="p-8">
          {!emailSent ? (
            <>
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-legal-gold-600 to-legal-gold-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-gray-300">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
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
                      autoFocus
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

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full"
                  aria-label="Send reset instructions"
                >
                  Send Reset Instructions
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
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
              <p className="text-gray-300 mb-6">
                We've sent password reset instructions to:
              </p>
              <p className="text-legal-gold-400 font-medium mb-6">{sentEmail}</p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  Didn't receive the email? Check your spam folder or wait a few minutes before requesting another reset.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Try Another Email
                </Button>
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full text-gray-300 hover:text-white">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
