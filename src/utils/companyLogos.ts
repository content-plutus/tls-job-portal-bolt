/**
 * Company Logo Management for Legal Job Portal
 * Provides company logos with intelligent fallbacks
 */

// Known company logos (can be expanded)
const COMPANY_LOGOS: Record<string, string> = {
  'Wilson & Associates LLP': 'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=200',
  'Sterling Legal Group': 'https://images.pexels.com/photos/8761732/pexels-photo-8761732.jpeg?auto=compress&cs=tinysrgb&w=200',
  'TechLaw Partners': 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200',
  'Roberts & Martinez': 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=200',
  'Harmony Legal Services': 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200',
  'Metropolitan Property Law': 'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=200',
  'Prestige Law Firm': 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200',
};

// Professional legal placeholder images from Pexels
const LEGAL_PLACEHOLDERS = [
  'https://images.pexels.com/photos/6077326/pexels-photo-6077326.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/8761732/pexels-photo-8761732.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=200',
];

/**
 * Get company logo URL with intelligent fallback
 * @param companyName - Name of the company
 * @returns URL to company logo or placeholder
 */
export function getCompanyLogo(companyName: string): string {
  // Check if we have a specific logo for this company
  if (COMPANY_LOGOS[companyName]) {
    return COMPANY_LOGOS[companyName];
  }

  // Generate deterministic placeholder based on company name
  // This ensures the same company always gets the same placeholder
  const hash = companyName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const index = Math.abs(hash) % LEGAL_PLACEHOLDERS.length;
  return LEGAL_PLACEHOLDERS[index];
}

/**
 * Generate initials from company name for fallback display
 * @param companyName - Name of the company
 * @returns 2-3 letter initials
 */
export function getCompanyInitials(companyName: string): string {
  const words = companyName.split(' ').filter(word =>
    word.length > 0 && !['LLC', 'LLP', 'PC', 'P.C.', '&', 'and'].includes(word)
  );

  if (words.length === 0) return 'LC'; // Legal Company fallback
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();

  // Take first letter of first 2-3 words
  return words
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join('');
}

/**
 * Get a gradient background color based on company name
 * @param companyName - Name of the company
 * @returns Tailwind gradient classes
 */
export function getCompanyGradient(companyName: string): string {
  const gradients = [
    'from-legal-navy-700 to-legal-navy-600',
    'from-legal-gold-600 to-legal-gold-500',
    'from-legal-slate-700 to-legal-slate-600',
    'from-legal-navy-800 to-legal-slate-700',
    'from-legal-gold-700 to-legal-gold-600',
  ];

  const hash = companyName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Register a new company logo
 * @param companyName - Name of the company
 * @param logoUrl - URL to the company logo
 */
export function registerCompanyLogo(companyName: string, logoUrl: string): void {
  COMPANY_LOGOS[companyName] = logoUrl;
}
