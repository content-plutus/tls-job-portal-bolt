import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Building2, Heart, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { Job } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  async function fetchJob() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);

      await supabase
        .from('jobs')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!user) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert({
        job_id: id,
        user_id: user.id,
        cover_letter: coverLetter,
        status: 'submitted',
      });

      if (error) throw error;

      await supabase
        .from('jobs')
        .update({ applications_count: (job?.applications_count || 0) + 1 })
        .eq('id', id);

      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already applied to this job');
      } else {
        toast.error('Failed to submit application');
      }
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card glass className="p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                    <p className="text-xl text-cyan-400 font-medium">{job.company}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard');
                    }}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {job.location && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Briefcase className="w-5 h-5 text-cyan-400" />
                    <span>{job.job_type}</span>
                  </div>
                )}
                {job.compensation && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <span>{job.compensation}</span>
                  </div>
                )}
                {job.posted_date && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <span>Posted {new Date(job.posted_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold text-white mb-4">Job Description</h2>
                <div className="text-gray-300 whitespace-pre-wrap">{job.description}</div>
              </div>
            </Card>
          </div>

          <div>
            <Card glass className="p-6 sticky top-8">
              <Button
                size="lg"
                className="w-full mb-4"
                onClick={() => setShowApplyModal(true)}
              >
                Apply Now
              </Button>

              {job.category && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Category</h3>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                    {job.category}
                  </span>
                </div>
              )}

              {job.deadline && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Application Deadline</h3>
                  <p className="text-white">{new Date(job.deadline).toLocaleDateString()}</p>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Job Statistics</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Views</span>
                    <span className="text-white font-medium">{job.views_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applications</span>
                    <span className="text-white font-medium">{job.applications_count || 0}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <Card glass className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Apply to {job.title}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Tell the employer why you're a great fit for this position..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  isLoading={applying}
                  className="flex-1"
                >
                  Submit Application
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
