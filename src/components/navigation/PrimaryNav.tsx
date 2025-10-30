import { ReactNode } from 'react';

interface PrimaryNavProps {
  variant?: 'transparent' | 'glass';
  className?: string;
  containerClassName?: string;
  rightContainerClassName?: string;
  logoSlot?: ReactNode;
  rightSlot?: ReactNode;
  onLogoClick?: () => void;
  logoHref?: string;
  logoAlt?: string;
  logoClassName?: string;
}

interface PrimaryNavLogoProps {
  onClick?: () => void;
  href?: string;
  alt?: string;
  className?: string;
}

const LOGO_SRC = 'https://cdn.testbook.com/1760528149448-Header_Logo1.png/1760528151.png';

export function PrimaryNavLogo({
  onClick,
  href,
  alt = 'LegalElite Logo',
  className = 'h-8',
}: PrimaryNavLogoProps) {
  const sharedClasses = 'hover:opacity-80 transition-opacity';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClasses}>
        <img src={LOGO_SRC} alt={alt} className={className} />
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} className={sharedClasses}>
        <img src={LOGO_SRC} alt={alt} className={className} />
      </a>
    );
  }

  return <img src={LOGO_SRC} alt={alt} className={className} />;
}

export default function PrimaryNav({
  variant = 'glass',
  className = '',
  containerClassName = 'px-6 py-4',
  rightContainerClassName = 'flex items-center gap-4',
  logoSlot,
  rightSlot,
  onLogoClick,
  logoHref,
  logoAlt,
  logoClassName,
}: PrimaryNavProps) {
  const variantClasses: Record<'transparent' | 'glass', string> = {
    transparent: '',
    glass: 'bg-white/5 backdrop-blur-lg border-b border-legal-gold-500/20',
  };

  const navClasses = [variantClasses[variant], className].filter(Boolean).join(' ').trim();
  const innerContainerBase = ['container mx-auto flex justify-between items-center', containerClassName]
    .filter(Boolean)
    .join(' ');
  const rightContainerClasses = [rightContainerClassName].filter(Boolean).join(' ');

  const logoContent = logoSlot ?? (
    <PrimaryNavLogo
      onClick={onLogoClick}
      href={logoHref ?? '/'}
      alt={logoAlt}
      className={logoClassName}
    />
  );

  return (
    <nav className={navClasses}>
      <div className={innerContainerBase}>
        {logoContent}
        <div className={rightContainerClasses}>{rightSlot}</div>
      </div>
    </nav>
  );
}
