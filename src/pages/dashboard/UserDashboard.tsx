import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Bookmark, Award, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Application } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LegalBackground3D from '../../components/3d/LegalBackground3D';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationCount, setApplicationCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    try {
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('*, job:jobs(*)')
        .eq('user_id', user?.id)
        .order('applied_at', { ascending: false })
        .limit(5);

      if (appsError) throw appsError;
      setApplications(apps || []);
      setApplicationCount(apps?.length || 0);

      const { count: savedCount } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setSavedJobsCount(savedCount || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      shortlisted: 'bg-green-500',
      interview: 'bg-purple-500',
      rejected: 'bg-red-500',
      offer: 'bg-emerald-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const tierLimits: Record<string, number> = {
    free: 5,
    silver: 999,
    gold: 999,
    platinum: 999,
  };

  const currentLimit = tierLimits[user?.subscription_tier || 'free'];
  const applicationsThisMonth = applicationCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900">
      <LegalBackground3D />
      <nav className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-legal-gold-500/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-legal-gold-500 to-legal-gold-300 bg-clip-text text-transparent">
            LegalJobs
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/jobs')} className="text-white">
              Browse Jobs
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-white">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.first_name || 'there'}!
          </h1>
          <p className="text-gray-300">Here's what's happening with your job search</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card glass className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {applicationsThisMonth}/{currentLimit === 999 ? '∞' : currentLimit}
                </span>
              </div>
              <h3 className="text-gray-300 text-sm">Applications This Month</h3>
              {user?.subscription_tier === 'free' && (
                <div className="mt-2">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${(applicationsThisMonth / currentLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card glass className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{savedJobsCount}</span>
              </div>
              <h3 className="text-gray-300 text-sm">Saved Jobs</h3>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card glass className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white capitalize">{user?.subscription_tier}</span>
              </div>
              <h3 className="text-gray-300 text-sm">Current Tier</h3>
              {user?.subscription_tier === 'free' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => navigate('/')}
                >
                  Upgrade
                </Button>
              )}
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card glass className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Applications</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-4">You haven't applied to any jobs yet</p>
                <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => navigate(`/jobs/${application.job_id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-1 truncate">
                          {application.job?.title}
                        </h3>
                        <p className="text-gray-400 text-sm">{application.job?.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-white text-xs ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
