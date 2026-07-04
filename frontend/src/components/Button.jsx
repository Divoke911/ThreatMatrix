import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button'
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent-cyan text-dark-base hover:bg-accent-cyan/95 border border-accent-cyan/30 shadow-glow-cyan hover:shadow-[#00f0ff]/50 active:scale-95',
    secondary: 'bg-dark-hover hover:bg-dark-hover/80 text-text-primary border border-dark-border active:scale-95',
    destructive: 'bg-severity-critical/80 hover:bg-severity-critical text-text-primary border border-severity-critical/35 shadow-glow-critical active:scale-95',
    outline: 'bg-transparent hover:bg-dark-hover text-text-primary border border-dark-border active:scale-95'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-md'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
