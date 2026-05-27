import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-gold to-gold-light text-bg-primary hover:shadow-hover disabled:opacity-60 border border-gold-dark/40 hover:border-gold',
    secondary: 'bg-bg-secondary border-2 border-border-light text-text-primary hover:bg-bg-tertiary hover:border-gold hover:text-gold disabled:opacity-60',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-hover disabled:opacity-60 border border-red-700/40',
  };

  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-base',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: variant === 'secondary' ? 'rgb(var(--color-bg-secondary))' : undefined,
        color: variant === 'secondary' ? 'rgb(var(--color-text-primary))' : undefined,
        borderColor: variant === 'secondary' ? 'rgb(var(--color-border-light))' : undefined,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          로딩 중...
        </>
      ) : (
        children
      )}
    </button>
  );
}
