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
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-95';

  const variants = {
    primary: 'bg-accent-lime text-[#0a0a0a] hover:brightness-110 shadow-glow-lime',
    secondary: 'bg-dark-input hover:bg-dark-hover text-text-primary',
    destructive: 'bg-severity-critical text-text-primary hover:brightness-110 shadow-glow-critical',
    outline: 'bg-transparent hover:bg-dark-hover text-text-primary border border-dark-border'
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
