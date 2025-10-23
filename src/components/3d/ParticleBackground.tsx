export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900" />
      <div className="absolute inset-0 opacity-20">
        {[...Array(50)].map((_, i) => {
          const colors = ['bg-legal-gold-400', 'bg-legal-gold-300', 'bg-legal-navy-400'];
          const colorClass = colors[i % colors.length];
          return (
            <div
              key={i}
              className={`absolute rounded-full ${colorClass} blur-sm`}
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
                animationDelay: Math.random() * 5 + 's',
              }}
            />
          );
        })}
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
