import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Briefcase, DollarSign, Heart, Calendar, Lock, Users, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { publicSupabase } from '../../lib/publicSupabase';
import { Job, SubscriptionTier } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getCompanyLogo, getCompanyInitials, getCompanyGradient } from '../../utils/companyLogos';
import { GOOGLE_FORM_URL } from '../../config/constants';

export default function JobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uiError, setUiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedOrgType, setSelectedOrgType] = useState('');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState('');
  const [barRegistrationRequired, setBarRegistrationRequired] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // Saved jobs state (job_id set)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Access control constants
  const FREE_JOB_LIMIT = 20;
  const PAGE_SIZE = 30;
  const isFreeUser = !user || user.subscription_tier === 'free';

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const displayedJobs = isFreeUser ? filteredJobs.slice(0, FREE_JOB_LIMIT) : filteredJobs;
  const hiddenJobsCount = isFreeUser ? Math.max(0, totalJobCount - FREE_JOB_LIMIT) : 0;

  // Indian-specific filter options
  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad',
    'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Indore', 'Bhopal',
    'Gurgaon', 'Noida', 'Ghaziabad', 'Faridabad', 'Remote'
  ];

  const practiceAreas = [
    'Corporate Law', 'Litigation', 'Intellectual Property', 'Tax Law',
    'Banking & Finance', 'Real Estate', 'Employment Law', 'Criminal Law',
    'Family Law', 'Constitutional Law', 'Environmental Law', 'Cyber Law',
    'Securities Law', 'Mergers & Acquisitions', 'Arbitration & Mediation'
  ];

  const experienceLevels = [
    'Fresher (0-1 years)', 'Junior (1-3 years)', 'Mid-level (3-7 years)', 'Senior (7+ years)'
  ];

  const organizationTypes = [
    'Law Firms', 'Corporate Legal Departments', 'Government', 'NGOs',
    'Legal Tech Companies', 'Consulting Firms', 'Banks & Financial Institutions'
  ];

  const salaryRanges = [
    '₹2-5 Lakhs', '₹5-10 Lakhs', '₹10-20 Lakhs', '₹20-50 Lakhs',
    '₹50 Lakhs - 1 Crore', '₹1+ Crore', 'Not Disclosed'
  ];
  const tierOrder: SubscriptionTier[] = ['free', 'silver', 'gold', 'platinum'];
  const userTier = user?.subscription_tier || 'free';
  const userTierIndex = tierOrder.indexOf(userTier);

  useEffect(() => {
    fetchJobs(true);
    if (user) {
      loadSavedJobs();
    } else {
      setSavedJobIds(new Set());
    }
  }, [user]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, selectedLocation, selectedJobType, selectedCategory, selectedExperience, selectedOrgType, selectedSalaryRange, barRegistrationRequired]);

  function applyTierFilter(data: Job[]) {
    const effectiveTierIndex = user ? userTierIndex : 0;
    return (data || []).filter(job => {
      const jobTier = job.tier_requirement || 'free';
      const jobTierIndex = tierOrder.indexOf(jobTier as SubscriptionTier);
      return jobTierIndex !== -1 && jobTierIndex <= effectiveTierIndex;
    });
  }

  async function fetchJobs(reset: boolean = false) {
    setUiError(null);

    try {
      setLoading(true);

      if (reset) {
        setPage(0);
        setHasMore(true);
        setJobs([]);
        setFilteredJobs([]);
      }

      // Anonymous-first fetch for maximum resilience (RLS allows public SELECT on active jobs)
      const from = 0;
      const to = PAGE_SIZE - 1;
      const { data: anonData, error: anonErr, count: anonCount } = await publicSupabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('posted_date', { ascending: false })
        .range(from, to);

      if (anonErr) throw anonErr;
      if (anonCount !== null && anonCount !== undefined) setTotalJobCount(anonCount);

      const filtered = applyTierFilter(anonData || []);
      const newJobs = filtered;
      setJobs(newJobs);
      setFilteredJobs(newJobs);
      setPage(1);
      setHasMore((isFreeUser ? newJobs.length < FREE_JOB_LIMIT : true) && (anonCount ?? 0) > PAGE_SIZE);

      // Optionally validate session silently (non-blocking)
      if (user) {
        supabase.auth.getSession().catch(() => {
          setUiError((prev) => prev ?? 'You are viewing public results. Your session may have expired.');
        });
      }
    } catch (primaryErr: unknown) {
      console.warn('Anonymous jobs fetch failed, trying authenticated client...');
      try {
        const from = 0;
        const to = PAGE_SIZE - 1;
        const { data, error, count } = await supabase
          .from('jobs')
          .select('*', { count: 'exact' })
          .eq('status', 'active')
          .order('posted_date', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (count !== null && count !== undefined) setTotalJobCount(count);

        const filtered = applyTierFilter(data || []);
        const newJobs = filtered;
        setJobs(newJobs);
        setFilteredJobs(newJobs);
        setPage(1);
        setHasMore((isFreeUser ? newJobs.length < FREE_JOB_LIMIT : true) && (count ?? 0) > PAGE_SIZE);
      } catch (fallbackErr: unknown) {
        console.error('Authenticated fetch also failed:', fallbackErr);
        setJobs([]);
        setFilteredJobs([]);
        setUiError('Unable to load jobs. Please try again or reset your session.');
      }
    } finally {
      setLoading(false);
    }
  }

  function filterJobs() {
    let filtered = [...jobs];

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(job => job.location?.includes(selectedLocation));
    }

    if (selectedJobType) {
      filtered = filtered.filter(job => job.job_type === selectedJobType);
    }

    if (selectedCategory) {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    if (selectedExperience) {
      // This would need to be implemented based on job data structure
      // For now, we'll filter based on job title or description containing experience keywords
      const expKeywords = selectedExperience.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(expKeywords) || 
        job.description.toLowerCase().includes(expKeywords)
      );
    }

    if (selectedOrgType) {
      filtered = filtered.filter(job => 
        job.company.toLowerCase().includes(selectedOrgType.toLowerCase()) ||
        job.description.toLowerCase().includes(selectedOrgType.toLowerCase())
      );
    }

    if (selectedSalaryRange && selectedSalaryRange !== 'Not Disclosed') {
      filtered = filtered.filter(job => 
        job.compensation && job.compensation.includes('₹')
      );
    }

    setFilteredJobs(filtered);
  }

  function clearAllFilters() {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedJobType('');
    setSelectedCategory('');
    setSelectedExperience('');
    setSelectedOrgType('');
    setSelectedSalaryRange('');
    setBarRegistrationRequired('');
  }

  async function loadSavedJobs() {
    if (!user) return;
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setSavedJobIds(new Set((data as { job_id: string }[]).map((r) => r.job_id)));
    }
  }

  async function toggleSave(jobId: string) {
    if (!user) {
      navigate('/login');
      return;
    }
    if (savingJobId) return;
    setSavingJobId(jobId);
    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId);
        if (error) throw error;
        const next = new Set(savedJobIds);
        next.delete(jobId);
        setSavedJobIds(next);
      } else {
        const { error } = await supabase
          .from('saved_jobs')
          .insert({ user_id: user.id, job_id: jobId });
        if (error) throw error;
        const next = new Set(savedJobIds);
        next.add(jobId);
        setSavedJobIds(next);
      }
    } finally {
      setSavingJobId(null);
    }
  }
  const getTierBadgeColor = (tier: SubscriptionTier) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-500',
      silver: 'bg-gray-400',
      gold: 'bg-amber-500',
      platinum: 'bg-purple-500'
    };
    return colors[tier] ?? 'bg-gray-500';
  };

  return (
    <div className="relative z-10 min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900">
      <nav className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-legal-gold-500/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://cdn.testbook.com/1760528149448-Header_Logo1.png/1760528151.png"
              alt="LegalElite Logo"
              className="h-8"
            />
          </button>
          <div className="flex items-center gap-4">
            {!user && (
              <div className="flex items-center gap-2 text-legal-gold-400 text-sm">
                <Users className="w-4 h-4" />
               <span>Viewing {displayedJobs.length} of {totalJobCount}+ jobs</span>
              </div>
            )}
            {user ? (
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-white">
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} className="text-white">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Browse Legal Jobs</h1>
          <p className="text-gray-300">
            {totalJobCount}+ opportunities available
            {isFreeUser && ` • Showing first ${FREE_JOB_LIMIT} jobs`}
            {user && ` • Full access with ${user.subscription_tier} account`}
          </p>
        </motion.div>

        {uiError && (
          <div className="mb-6 p-4 rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300 flex items-center justify-between">
            <span className="text-sm">{uiError}</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => { try { await supabase.auth.signOut({ scope: 'local' }); } catch (e) { console.warn('Local signOut failed', e); } window.location.reload(); }}
                className="border-amber-400/40 text-amber-300 hover:bg-amber-500/10"
              >
                Reset session
              </Button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search legal jobs by title, company, or location in India..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-6 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20"
            >
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City/Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Locations</option>
                    {indianCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Practice Area</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Practice Areas</option>
                    {practiceAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Experience Levels</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Organization Type</label>
                  <select
                    value={selectedOrgType}
                    onChange={(e) => setSelectedOrgType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Organizations</option>
                    {organizationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Salary Range (INR)</label>
                  <select
                    value={selectedSalaryRange}
                    onChange={(e) => setSelectedSalaryRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Salary Ranges</option>
                    {salaryRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bar Registration</label>
                  <select
                    value={barRegistrationRequired}
                    onChange={(e) => setBarRegistrationRequired(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Any</option>
                    <option value="required">Required</option>
                    <option value="not-required">Not Required</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full border-legal-gold-500/30 text-legal-gold-400 hover:bg-legal-gold-500/10"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>

              {!user && filteredJobs.length > FREE_JOB_LIMIT && (
                <div className="mt-4 p-4 bg-legal-gold-500/10 border border-legal-gold-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-legal-gold-400" />
                      <div>
                        <p className="text-white font-medium">
                          {hiddenJobsCount} more jobs available
                        </p>
                        <p className="text-legal-slate-300 text-sm">
                          Sign up to view all {totalJobCount}+ job opportunities
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => window.open(GOOGLE_FORM_URL, '_blank', 'noopener,noreferrer')} size="sm">
                      Sign Up Free
                    </Button>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </div>

        {loading ? (
          <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} glass className="p-6 animate-pulse">
                  <div className="h-6 bg-white/10 rounded mb-4" />
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                </Card>
              ))}
            </div>
          </div>
        ) : displayedJobs.length === 0 ? (
          <Card glass className="p-12 text-center border border-legal-gold-500/20">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-legal-slate-400" />
            <h3 className="text-2xl font-bold text-white mb-2">No Jobs Found</h3>
            <p className="text-legal-slate-300 mb-6">
              {jobs.length === 0
                ? "We're currently updating our job listings. Please check back soon!"
                : "No jobs match your current filters. Try adjusting your search criteria."}
            </p>
            {jobs.length === 0 && (
              <div className="text-legal-slate-400 text-sm mt-6 space-y-2">
                <p className="font-semibold">Troubleshooting tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your internet connection</li>
                  <li>Clear browser cache and try again</li>
                  <li>Disable browser extensions</li>
                </ul>
                <Button onClick={() => window.location.reload()} className="mt-4" size="sm">
                  Refresh Page
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    glass
                    hover
                    className="p-6 cursor-pointer relative border border-legal-gold-500/10 hover:border-legal-gold-500/30"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    {/* Badges and Save button (avoid overlap) */}
                    {job.tier_requirement === 'free' && (
                      <div className="absolute top-4 right-16 z-10">
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 backdrop-blur-sm">
                          FREE
                        </span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(job.id);
                      }}
                      disabled={!!savingJobId}
                      aria-label={savedJobIds.has(job.id) ? 'Unsave job' : 'Save job'}
                      className={`absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${savedJobIds.has(job.id) ? 'text-legal-red-400' : 'text-legal-slate-400'}`}
                    >
                      <Heart className="w-5 h-5" fill={savedJobIds.has(job.id) ? 'currentColor' : 'none'} />
                    </button>

                    <div className="flex items-start justify-between mb-4">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-legal-gold-500/30">
                        <img
                          src={getCompanyLogo(job.company)}
                          alt={job.company}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLDivElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getCompanyGradient(job.company)} items-center justify-center text-white font-bold text-sm hidden`}
                        >
                          {getCompanyInitials(job.company)}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{job.title}</h3>
                    <p className="text-legal-gold-400 font-medium mb-4">{job.company}</p>

                    <div className="space-y-2 mb-4">
                      {job.location && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.job_type && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.job_type}</span>
                        </div>
                      )}
                      {job.compensation && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.compensation}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {job.category && (
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                            {job.category}
                          </span>
                        )}
                        {job.tier_requirement !== 'free' && (
                          <span className={`px-3 py-1 rounded-full ${getTierBadgeColor(job.tier_requirement as SubscriptionTier)} text-white text-xs uppercase`}>
                            {job.tier_requirement}
                          </span>
                        )}
                      </div>
                      {job.posted_date && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Load more / Pagination controls */}
            {!isFreeUser && hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  size="md"
                  isLoading={loadingMore}
                  onClick={async () => {
                    if (loadingMore) return;
                    setLoadingMore(true);
                    try {
                      const from = page * PAGE_SIZE;
                      const to = from + PAGE_SIZE - 1;

                      // Try auth client first
                      let resp = await supabase
                        .from('jobs')
                        .select('*')
                        .eq('status', 'active')
                        .order('posted_date', { ascending: false })
                        .range(from, to);

                      if (resp.error) {
                        resp = await publicSupabase
                          .from('jobs')
                          .select('*')
                          .eq('status', 'active')
                          .order('posted_date', { ascending: false })
                          .range(from, to);
                      }

                      if (!resp.error) {
                        const appended = applyTierFilter(resp.data || []);
                        const combined = [...jobs, ...appended];
                        setJobs(combined);
                        setFilteredJobs(combined);
                        const total = totalJobCount || combined.length;
                        setHasMore(combined.length < total);
                        setPage(page + 1);
                      }
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  Load more
                </Button>
              </div>
            )}

            {/* Access Restriction CTA */}
            {!user && hiddenJobsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <Card
                  glass
                  className="p-8 text-center border-2 border-legal-gold-500/30 bg-gradient-to-br from-legal-gold-500/5 to-legal-navy-800/20"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-gradient-to-br from-legal-gold-500 to-legal-gold-600 w-16 h-16 rounded-full flex items-center justify-center">
                      <Lock className="w-8 h-8 text-legal-navy-900" />
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Unlock {hiddenJobsCount}+ More Legal Opportunities
                  </h3>
                  
                  <p className="text-legal-slate-200 text-lg mb-6 max-w-2xl mx-auto">
                    Join thousands of legal professionals who found their dream jobs. 
                    Get instant access to all {totalJobCount}+ opportunities across India.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                    <div className="text-center">
                      <div className="bg-legal-navy-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Briefcase className="w-6 h-6 text-legal-gold-400" />
                      </div>
                      <h4 className="text-white font-semibold mb-1">Premium Jobs</h4>
                      <p className="text-legal-slate-300 text-sm">Access exclusive positions from top law firms</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-legal-navy-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-legal-gold-400" />
                      </div>
                      <h4 className="text-white font-semibold mb-1">Direct Applications</h4>
                      <p className="text-legal-slate-300 text-sm">Apply directly to employers with one click</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-legal-navy-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-legal-gold-400" />
                      </div>
                      <h4 className="text-white font-semibold mb-1">Career Growth</h4>
                      <p className="text-legal-slate-300 text-sm">Track applications and get career insights</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => window.open('https://forms.gle/GHdByKSYJQm6dajv6', '_blank', 'noopener,noreferrer')}
                      className="bg-gradient-to-r from-legal-gold-600 to-legal-gold-500 text-legal-navy-900 hover:from-legal-gold-700 hover:to-legal-gold-600"
                    >
                      Sign Up Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => navigate('/login')}
                      className="border-legal-gold-500 text-legal-gold-400 hover:bg-legal-gold-500/10"
                    >
                      Already have an account? Sign In
                    </Button>
                  </div>
                  
                  <p className="text-legal-slate-400 text-sm mt-6">
                    ✓ Free forever • ✓ No credit card required • ✓ Instant access
                  </p>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
