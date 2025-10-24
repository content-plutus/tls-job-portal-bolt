import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Briefcase, Users, TrendingUp, ArrowRight } from 'lucide-react';
import LegalBackground3D from '../components/3d/LegalBackground3D';
import PricingTable from '../components/pricing/PricingTable';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function LandingPage() {
  const navigate = useNavigate();

  // Toggle to show/hide testimonials section - set to true to restore
  const showTestimonials = false;

  const features = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: 'Curated Legal Jobs',
      description: 'Access thousands of legal positions from top firms and companies',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Tiered Access',
      description: 'Unlock exclusive opportunities with premium subscriptions',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Career Growth',
      description: 'Advanced tools to help you land your dream legal position',
    },
  ];

  const steps = [
    { number: '01', title: 'Browse Jobs', description: 'Search and filter jobs based on your preferences' },
    { number: '02', title: 'Get Access', description: 'Request access to premium opportunities' },
    { number: '03', title: 'Apply & Track', description: 'Apply with one click and track your applications' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900">
      <LegalBackground3D />

      <div className="relative z-10">
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <img
              src="https://cdn.testbook.com/1760528149448-Header_Logo1.png/1760528151.png"
              alt="LegalLadder Logo"
              className="h-8"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <Button onClick={() => navigate('/login')} className="text-white">
              Sign In
            </Button>
          </motion.div>
        </nav>

        <section className="container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="hero-headline text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-legal-gold-500 via-legal-gold-400 to-legal-gold-300 bg-clip-text text-transparent leading-tight">
              Elite Legal
              <br />
              Opportunities
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light">
              Exclusive access to premier legal positions at the world's most prestigious law firms and corporations
            </p>

            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search premium legal positions..."
                  className="w-full pl-14 pr-4 py-5 rounded-full bg-white/10 backdrop-blur-lg border border-legal-gold-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-legal-gold-500 text-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      navigate('/jobs');
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/jobs')} className="border-legal-gold-500 text-legal-gold-400 hover:bg-legal-gold-500/10">
                Explore Positions
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-col items-center justify-center gap-3 text-gray-400"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5 rotate-90" />
              </motion.div>
              <span className="text-sm font-light">Scroll to explore</span>
            </motion.div>
          </motion.div>
        </section>

        <section className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Active Jobs' },
              { value: '500+', label: 'Law Firms' },
              { value: '95%', label: 'Success Rate' },
              { value: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card glass className="p-6 border border-legal-gold-500/20">
                  <div className="text-4xl font-bold bg-gradient-to-r from-legal-gold-400 to-legal-gold-200 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-legal-slate-200">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-white mb-16"
          >
            Why Choose LegalJobs?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card glass hover className="p-8 h-full">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-xl flex items-center justify-center text-white mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {showTestimonials && (
          <section className="container mx-auto px-6 py-20">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-center text-white mb-6"
            >
              Trusted by Legal Professionals
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 text-center mb-16"
            >
              Join thousands of attorneys who found their dream jobs through our platform
            </motion.p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "LegalJobs helped me land my dream position at a top firm in just 3 weeks. The platform is intuitive and the job quality is exceptional.",
                  author: "Sarah Mitchell",
                  title: "Corporate Associate Attorney",
                  firm: "Wilson & Associates LLP",
                  credentials: "JD, Harvard Law | NY Bar",
                  linkedin: "https://linkedin.com",
                  image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400"
                },
                {
                  quote: "As a recent graduate, I was overwhelmed by the job search. LegalJobs made it simple and I received multiple offers within a month.",
                  author: "Michael Chen",
                  title: "Litigation Associate",
                  firm: "Sterling Legal Group",
                  credentials: "JD, Yale Law | CA Bar",
                  linkedin: "https://linkedin.com",
                  image: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400"
                },
                {
                  quote: "The premium tier was worth every penny. I got access to exclusive opportunities and landed a position that wasn't advertised elsewhere.",
                  author: "Jennifer Rodriguez",
                  title: "Intellectual Property Counsel",
                  firm: "TechLaw Partners",
                  credentials: "JD, Stanford Law | USPTO Registered",
                  linkedin: "https://linkedin.com",
                  image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card glass className="p-8 h-full border border-legal-gold-500/20 hover:border-legal-gold-500/40 transition-colors">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-6">
                        <img
                          src={testimonial.image}
                          alt={testimonial.author}
                          className="w-20 h-20 rounded-full object-cover border-2 border-legal-gold-500"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-lg">{testimonial.author}</h4>
                          <p className="text-legal-gold-400 text-sm font-medium">{testimonial.title}</p>
                          <p className="text-legal-slate-300 text-xs">{testimonial.firm}</p>
                        </div>
                      </div>
                      <p className="text-legal-slate-200 mb-4 flex-grow italic leading-relaxed">"{testimonial.quote}"</p>
                      <div className="pt-4 border-t border-legal-gold-500/20">
                        <p className="text-legal-slate-400 text-xs mb-2">{testimonial.credentials}</p>
                        <a
                          href={testimonial.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-legal-gold-400 hover:text-legal-gold-300 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          View LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <section className="container mx-auto px-6 py-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-white mb-16"
          >
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-6xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500 to-transparent -translate-x-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-white mb-6"
          >
            Choose Your Plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 text-center mb-16"
          >
            One-time payment for 3, 6, or 12-month access • Save more with longer commitments
          </motion.p>
          <PricingTable />
        </section>

        <footer className="container mx-auto px-6 py-12 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <img
                src="https://cdn.testbook.com/1760528149448-Header_Logo1.png/1760528151.png"
                alt="LegalLadder - Premium Legal Job Portal"
                className="h-8 md:h-10 w-auto object-contain transition-opacity duration-300 hover:opacity-80"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLDivElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div 
                className="text-2xl font-bold bg-gradient-to-r from-legal-gold-500 to-legal-gold-300 bg-clip-text text-transparent hidden"
                role="img"
                aria-label="LegalLadder"
              >
                LegalLadder
              </div>
            </div>
            <div className="flex gap-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Careers</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 LegalJobs. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
