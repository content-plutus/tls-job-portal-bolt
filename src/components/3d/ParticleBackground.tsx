import { useMemo } from 'react';

export default function ParticleBackground() {
  const particles = useMemo(() => {
    const colors = ['bg-legal-gold-400', 'bg-legal-gold-300', 'bg-legal-navy-400'];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      colorClass: colors[i % colors.length],
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900" />
      <div className="absolute inset-0 opacity-20">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute rounded-full ${particle.colorClass} blur-sm`}
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s infinite ease-in-out`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          50% { transform: translateY(-20px) translateX(20px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
