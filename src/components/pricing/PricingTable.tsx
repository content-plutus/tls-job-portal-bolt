import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Star, Calendar, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeq40J_9Hmh6zf6M787qOBn1mewpbELAECNRsqTDvMmRiv4ng/viewform';

interface PricingTier {
  name: string;
  validityMonths: number;
  priceINR: number;
  priceUSD: number;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
  savingsPercentage?: number;
}

const FEATURES = [
  'Access to all job listings',
  'Unlimited job applications',
  'Email support',
  'Resume builder',
  'Job alerts',
  'Save unlimited jobs',
  'Application tracking',
];

const TIERS: PricingTier[] = [
  {
    name: 'Basic',
    validityMonths: 3,
    priceINR: 4999,
    priceUSD: 60,
    description: 'Perfect for individuals starting their legal career',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-legal-navy-600 to-legal-navy-700',
  },
  {
    name: 'Professional',
    validityMonths: 6,
    priceINR: 6999,
    priceUSD: 85,
    description: 'For active job seekers and legal professionals',
    icon: <Star className="w-6 h-6" />,
    color: 'from-legal-gold-600 to-legal-gold-500',
    popular: true,
    savingsPercentage: 30,
  },
  {
    name: 'Premium',
    validityMonths: 12,
    priceINR: 9999,
    priceUSD: 120,
    description: 'Ultimate package for serious legal professionals',
    icon: <Crown className="w-6 h-6" />,
    color: 'from-legal-red-600 to-legal-red-500',
    savingsPercentage: 50,
  },
];

const PricingCard = memo(({ tier, currency, index }: { tier: PricingTier; currency: 'INR' | 'USD'; index: number }) => {
  const price = currency === 'INR' ? `₹${tier.priceINR.toLocaleString('en-IN')}` : `$${tier.priceUSD}`;
  const monthly = currency === 'INR'
    ? `₹${Math.round(tier.priceINR / tier.validityMonths).toLocaleString('en-IN')}`
    : `$${Math.round(tier.priceUSD / tier.validityMonths)}`;
  const altPrice = currency === 'INR' ? `$${tier.priceUSD}` : `₹${tier.priceINR.toLocaleString('en-IN')}`;
  const paymentInfo = currency === 'INR' ? 'GST applicable' : 'No hidden fees';

  return (
    <motion.div
      key={tier.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative ${tier.popular ? 'md:-mt-4' : ''}`}
    >
      {tier.popular && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-legal-gold-600 to-legal-gold-500 text-legal-navy-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      {tier.savingsPercentage && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-legal-navy-900">
            <div className="text-center">
              <div className="text-xs font-bold leading-none">SAVE</div>
              <div className="text-lg font-bold leading-none">{tier.savingsPercentage}%</div>
            </div>
          </div>
        </div>
      )}

      <Card
        glass
        hover
        className={`p-8 h-full border-2 ${
          tier.popular ? 'border-legal-gold-500/50 shadow-2xl shadow-legal-gold-500/20' : 'border-legal-gold-500/20'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-legal-navy-700/50 px-4 py-2 rounded-full border border-legal-gold-500/30">
            <Calendar className="w-4 h-4 text-legal-gold-400" />
            <span className="text-sm font-semibold text-legal-gold-400">{tier.validityMonths}-Month Access</span>
          </div>
          {tier.savingsPercentage && (
            <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
              <TrendingDown className="w-4 h-4" />
              <span>Best Value</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg`}>
            {tier.icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
            <p className="text-legal-slate-300 text-sm">{tier.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <motion.span
              key={`${tier.name}-${currency}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold bg-gradient-to-r from-legal-gold-400 to-legal-gold-200 bg-clip-text text-transparent"
            >
              {price}
            </motion.span>
            <span className="text-legal-slate-400 text-sm">
              <div>for {tier.validityMonths} months</div>
            </span>
          </div>
          <div className="mt-2 text-legal-slate-400 text-sm">
            <span className="font-semibold text-legal-gold-400">{monthly}/month</span>
            <span> effective rate</span>
          </div>
          <p className="text-legal-slate-500 text-xs mt-2">≈ {altPrice}</p>
        </div>

        <ul className="space-y-3 mb-8 flex-grow">
          {FEATURES.map((feature, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + i * 0.05 }}
              className="flex items-start gap-3 text-legal-slate-200"
            >
              <Check className="w-5 h-5 text-legal-gold-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </motion.li>
          ))}
        </ul>

        <Button
          variant={tier.popular ? 'secondary' : 'primary'}
          className="w-full"
          size="lg"
          onClick={(e) => {
            e.preventDefault();
            window.open(GOOGLE_FORM_URL, '_blank', 'noopener,noreferrer');
          }}
        >
          Get Access
        </Button>

        <p className="text-center text-legal-slate-400 text-xs mt-4">
          {paymentInfo} • Valid for {tier.validityMonths} months
        </p>
      </Card>
    </motion.div>
  );
});

PricingCard.displayName = 'PricingCard';

export default function PricingTable() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  return (
    <div className="w-full py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-lg border border-legal-gold-500/30 rounded-full p-2">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              currency === 'INR'
                ? 'bg-gradient-to-r from-legal-gold-600 to-legal-gold-500 text-legal-navy-900 shadow-lg'
                : 'text-white hover:bg-white/5'
            }`}
          >
            ₹ INR (Indian Rupee)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              currency === 'USD'
                ? 'bg-gradient-to-r from-legal-gold-600 to-legal-gold-500 text-legal-navy-900 shadow-lg'
                : 'text-white hover:bg-white/5'
            }`}
          >
            $ USD (US Dollar)
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
        {TIERS.map((tier, index) => (
          <PricingCard key={tier.name} tier={tier} currency={currency} index={index} />
        ))}
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto mt-12 px-6"
      >
        <Card glass className="p-6 border border-legal-gold-500/20">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="text-legal-gold-400 font-bold mb-2">30-Day Money Back</h4>
              <p className="text-legal-slate-300 text-sm">
                Not satisfied? Get a full refund within 30 days
              </p>
            </div>
            <div>
              <h4 className="text-legal-gold-400 font-bold mb-2">Secure Payment</h4>
              <p className="text-legal-slate-300 text-sm">
                256-bit SSL encryption for all transactions
              </p>
            </div>
            <div>
              <h4 className="text-legal-gold-400 font-bold mb-2">Validity-Based Access</h4>
              <p className="text-legal-slate-300 text-sm">
                One-time payment • Full access for the entire validity period
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Currency Conversion Notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-legal-slate-400 text-sm mt-6"
      >
        * One-time upfront payment provides full access for the selected validity period. Currency conversion rates are approximate. All prices exclude applicable taxes.
      </motion.p>
    </div>
  );
}
