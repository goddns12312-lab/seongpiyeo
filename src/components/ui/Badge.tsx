interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'info' | 'success' | 'danger';
  className?: string;
}

const variantClasses = {
  primary: 'bg-gold/15 text-gold border border-gold/25',
  secondary: 'bg-bg-tertiary/80 text-text-secondary border border-border-light',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20',
};

export function Badge({ children, variant = 'secondary', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
