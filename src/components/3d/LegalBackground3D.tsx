import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LegalBackground3D() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const elements = document.querySelectorAll('.parallax-element');
      elements.forEach((el, index) => {
        const speed = (index + 1) * 0.05;
        const element = el as HTMLElement;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={canvasRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900" />

      {/* Scales of Justice - Left Side */}
      <motion.div
        className="parallax-element absolute top-20 -left-10 opacity-15"
        animate={{
          y: [0, -20, 0],
          rotate: [-5, 5, -5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 200 200" className="drop-shadow-2xl">
          <defs>
            <linearGradient id="scaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#C5A572', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8B6914', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Center pole */}
          <rect x="95" y="40" width="10" height="120" fill="url(#scaleGradient)" />
          {/* Base */}
          <ellipse cx="100" cy="165" rx="40" ry="8" fill="url(#scaleGradient)" />
          {/* Balance beam */}
          <rect x="30" y="45" width="140" height="6" fill="url(#scaleGradient)" rx="3" />
          {/* Left scale */}
          <line x1="50" y1="48" x2="50" y2="75" stroke="url(#scaleGradient)" strokeWidth="2" />
          <ellipse cx="50" cy="80" rx="20" ry="5" fill="url(#scaleGradient)" />
          <path d="M 30 80 Q 50 95 70 80" fill="none" stroke="url(#scaleGradient)" strokeWidth="2" />
          {/* Right scale */}
          <line x1="150" y1="48" x2="150" y2="75" stroke="url(#scaleGradient)" strokeWidth="2" />
          <ellipse cx="150" cy="80" rx="20" ry="5" fill="url(#scaleGradient)" />
          <path d="M 130 80 Q 150 95 170 80" fill="none" stroke="url(#scaleGradient)" strokeWidth="2" />
        </svg>
      </motion.div>

      {/* Gavel - Right Side */}
      <motion.div
        className="parallax-element absolute top-1/3 -right-10 opacity-15"
        animate={{
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="250" height="250" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gavelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#C5A572', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#AF8B2A', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Gavel head */}
          <rect x="40" y="60" width="80" height="30" fill="url(#gavelGradient)" rx="5" transform="rotate(-45 80 75)" />
          {/* Gavel handle */}
          <rect x="85" y="80" width="15" height="90" fill="url(#gavelGradient)" rx="7" transform="rotate(-45 92 125)" />
          {/* Sound block */}
          <ellipse cx="140" cy="150" rx="30" ry="10" fill="url(#gavelGradient)" opacity="0.8" />
        </svg>
      </motion.div>

      {/* Floating Legal Documents */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`doc-${i}`}
          className="parallax-element absolute opacity-15"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 18}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        >
          <svg width="100" height="120" viewBox="0 0 80 100">
            <defs>
              <linearGradient id={`docGradient${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#C5A572', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#D4B88E', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>
            <rect x="10" y="5" width="60" height="90" fill={`url(#docGradient${i})`} rx="3" />
            <path d="M 10 5 L 55 5 L 70 20 L 70 95 L 10 95 Z" fill={`url(#docGradient${i})`} opacity="0.9" />
            <path d="M 55 5 L 55 20 L 70 20" fill="none" stroke="#8B6914" strokeWidth="1" />
            {/* Lines on document */}
            {[...Array(8)].map((_, j) => (
              <line
                key={j}
                x1="20"
                y1={30 + j * 8}
                x2="60"
                y2={30 + j * 8}
                stroke="#8B6914"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
          </svg>
        </motion.div>
      ))}

      {/* Courthouse Pillars */}
      <motion.div
        className="parallax-element absolute bottom-0 left-1/4 opacity-12"
        animate={{
          opacity: [0.08, 0.12, 0.08],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="300" height="400" viewBox="0 0 300 400">
          <defs>
            <linearGradient id="pillarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#C5A572', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#8B6914', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          {/* Left pillar */}
          <rect x="50" y="100" width="40" height="280" fill="url(#pillarGradient)" />
          <rect x="45" y="90" width="50" height="15" fill="url(#pillarGradient)" />
          <rect x="48" y="375" width="44" height="20" fill="url(#pillarGradient)" />
          {/* Middle pillar */}
          <rect x="130" y="80" width="40" height="300" fill="url(#pillarGradient)" />
          <rect x="125" y="70" width="50" height="15" fill="url(#pillarGradient)" />
          <rect x="128" y="375" width="44" height="20" fill="url(#pillarGradient)" />
          {/* Right pillar */}
          <rect x="210" y="100" width="40" height="280" fill="url(#pillarGradient)" />
          <rect x="205" y="90" width="50" height="15" fill="url(#pillarGradient)" />
          <rect x="208" y="375" width="44" height="20" fill="url(#pillarGradient)" />
          {/* Top triangle */}
          <path d="M 30 70 L 150 30 L 270 70 Z" fill="url(#pillarGradient)" opacity="0.7" />
        </svg>
      </motion.div>

      {/* Floating Legal Books */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`book-${i}`}
          className="parallax-element absolute opacity-12"
          style={{
            bottom: `${15 + i * 20}%`,
            right: `${15 + i * 15}%`,
          }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1,
          }}
        >
          <svg width="80" height="100" viewBox="0 0 60 80">
            <defs>
              <linearGradient id={`bookGradient${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#00205B', stopOpacity: 0.8 }} />
                <stop offset="50%" style={{ stopColor: '#C5A572', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#00205B', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>
            {/* Book cover */}
            <rect x="5" y="10" width="50" height="65" fill={`url(#bookGradient${i})`} rx="2" />
            {/* Book spine shadow */}
            <rect x="5" y="10" width="5" height="65" fill="#000" opacity="0.3" />
            {/* Book pages */}
            <rect x="10" y="12" width="40" height="61" fill="#F8F9FA" opacity="0.2" />
            {/* Title lines */}
            <line x1="15" y1="25" x2="45" y2="25" stroke="#C5A572" strokeWidth="2" />
            <line x1="15" y1="33" x2="45" y2="33" stroke="#C5A572" strokeWidth="1.5" />
          </svg>
        </motion.div>
      ))}

      {/* Animated Legal Symbols */}
      <motion.div
        className="parallax-element absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-15"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg width="400" height="400" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="symbolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#C5A572', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#00205B', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#symbolGradient)" strokeWidth="2" strokeDasharray="5,5" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="url(#symbolGradient)" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="url(#symbolGradient)" strokeWidth="1" />
          {/* Legal symbol in center */}
          <text x="100" y="110" textAnchor="middle" fontSize="48" fill="url(#symbolGradient)" fontFamily="Georgia, serif">§</text>
        </svg>
      </motion.div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-15">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C5A572" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Glowing Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full bg-legal-gold-400"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}
