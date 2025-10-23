import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-300 inline-flex items-center justify-center';

    const variants = {
      primary: 'bg-gradient-to-r from-legal-navy-700 to-legal-navy-600 text-white hover:from-legal-navy-800 hover:to-legal-navy-700 shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-legal-gold-600 to-legal-gold-500 text-legal-navy-900 hover:from-legal-gold-700 hover:to-legal-gold-600 shadow-lg hover:shadow-xl font-semibold',
      outline: 'border-2 border-legal-gold-500 text-legal-gold-500 hover:bg-legal-gold-500/10',
      ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-legal-navy-800/50',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const disabledStyles = 'opacity-50 cursor-not-allowed';

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
          disabled || isLoading ? disabledStyles : ''
        } ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
