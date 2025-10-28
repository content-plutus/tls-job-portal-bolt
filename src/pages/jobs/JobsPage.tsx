import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Briefcase, DollarSign, Heart, Calendar, Lock, Users, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { Job, SubscriptionTier } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getCompanyLogo, getCompanyInitials, getCompanyGradient } from '../../utils/companyLogos';

const TIER_ORDER: SubscriptionTier[] = ['free', 'silver', 'gold', 'platinum'];
const FREE_JOB_LIMIT = 20;
const PAGE_SIZE = 18;
const BAR_KEYWORD = '%bar registration%';

export default function JobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedOrgType, setSelectedOrgType] = useState('');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState('');
  const [barRegistrationRequired, setBarRegistrationRequired] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isFreeUser = !user || user.subscription_tier === 'free';
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

  const fetchTotalJobCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching total job count:', error);
        return;
      }

      setTotalJobCount(count || 0);
    } catch (error) {
      console.error('Error fetching total job count:', error);
    }
  }, []);

  const fetchJobs = useCallback(async (pageToFetch = 0, append = false) => {
    const tierForLog = user?.subscription_tier || 'free';
    const tierIndex = TIER_ORDER.indexOf(tierForLog);

    console.log('🔍 Fetching jobs...', {
      user,
      tier: tierForLog,
      tierIndex,
      pageToFetch,
      append
    });

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const effectiveTierIndex = tierIndex >= 0 ? tierIndex : 0;
      const accessibleTiers = TIER_ORDER.slice(0, effectiveTierIndex + 1);

      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('posted_date', { ascending: false })
        .range(pageToFetch * PAGE_SIZE, pageToFetch * PAGE_SIZE + PAGE_SIZE - 1);

      if (accessibleTiers.length > 0) {
        const tierConditions = [`tier_requirement.in.(${accessibleTiers.join(',')})`, 'tier_requirement.is.null'];
        query = query.or(tierConditions.join(','));
      } else {
        query = query.or('tier_requirement.is.null');
      }

      if (selectedLocation) {
        query = query.ilike('location', `%${selectedLocation}%`);
      }

      if (selectedJobType) {
        query = query.eq('job_type', selectedJobType);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedExperience) {
        const experiencePattern = `%${selectedExperience}%`;
        query = query.or(`title.ilike.${experiencePattern},description.ilike.${experiencePattern}`);
      }

      if (selectedOrgType) {
        const organizationPattern = `%${selectedOrgType}%`;
        query = query.or(`company.ilike.${organizationPattern},description.ilike.${organizationPattern}`);
      }

      if (selectedSalaryRange && selectedSalaryRange !== 'Not Disclosed') {
        query = query.ilike('compensation', '%₹%');
      }

      if (barRegistrationRequired) {
        if (barRegistrationRequired === 'required') {
          query = query.ilike('description', BAR_KEYWORD);
        } else if (barRegistrationRequired === 'not-required') {
          query = query.not('description', 'ilike', BAR_KEYWORD);
        }
      }

      if (searchQuery) {
        const searchPattern = `%${searchQuery}%`;
        query = query.or(
          `title.ilike.${searchPattern},company.ilike.${searchPattern},location.ilike.${searchPattern},description.ilike.${searchPattern}`
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching jobs:', error);
        throw error;
      }

      const sanitizedData = (data || []).map(job => ({
        ...job,
        tier_requirement: (job.tier_requirement || 'free') as SubscriptionTier
      }));

      setJobs(prevJobs => (append ? [...prevJobs, ...sanitizedData] : sanitizedData));
      setFilteredJobs(prevJobs => (append ? [...prevJobs, ...sanitizedData] : sanitizedData));

      const totalRecords = count || 0;
      const isFreeTierUser = !user || user.subscription_tier === 'free';
      const moreAvailable = totalRecords > (pageToFetch + 1) * PAGE_SIZE;
      setHasMore(!isFreeTierUser && moreAvailable);
      setPage(pageToFetch);

      console.log(`✅ Loaded page ${pageToFetch}, received ${sanitizedData.length} jobs (total matching: ${totalRecords})`);
    } catch (error: any) {
      console.error('❌ Error fetching jobs:', error);
      toast.error('Failed to load jobs. Please refresh the page.');
      if (!append) {
        setJobs([]);
        setFilteredJobs([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [barRegistrationRequired, searchQuery, selectedCategory, selectedExperience, selectedJobType, selectedLocation, selectedOrgType, selectedSalaryRange, user]);

  useEffect(() => {
    fetchTotalJobCount();
  }, [fetchTotalJobCount]);

  useEffect(() => {
    fetchJobs(0, false);
  }, [fetchJobs]);

  const handleLoadMore = () => {
    fetchJobs(page + 1, true);
  };

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
  const getTierBadgeColor = (tier: SubscriptionTier) => {
    const colors = {
      free: 'bg-gray-500',
      silver: 'bg-gray-400',
      gold: 'bg-amber-500',
      platinum: 'bg-purple-500'
    };
    return colors[tier];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900">
      <nav className="bg-white/5 backdrop-blur-lg border-b border-legal-gold-500/20">
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

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Browse Legal Jobs</h1>
          <p className="text-gray-300">
            {totalJobCount}+ opportunities available
            {isFreeUser && ` • Showing first ${FREE_JOB_LIMIT} jobs`}
            {user && ` • Full access with ${user.subscription_tier} account`}
          </p>
        </motion.div>

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
                    <Button onClick={() => navigate('/login')} size="sm">
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
                    {/* Free Tier Badge */}
                    {job.tier_requirement === 'free' && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 backdrop-blur-sm">
                          FREE
                        </span>
                      </div>
                    )}

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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-legal-slate-400 hover:text-legal-red-500 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                      </button>
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

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button onClick={handleLoadMore} disabled={loadingMore} className="min-w-[200px]">
                  {loadingMore ? 'Loading more jobs...' : 'Load More Jobs'}
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
