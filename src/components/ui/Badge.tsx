interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'info' | 'success' | 'danger';
  className?: string;
}

const variantClasses = {
  primary: 'bg-gold text-bg-primary',
  secondary: 'bg-bg-secondary text-text-primary border border-border-light',
  info: 'bg-blue-900 text-blue-100',
  success: 'bg-green-900 text-green-100',
  danger: 'bg-red-900 text-red-100',
};

export function Badge({ children, variant = 'secondary', className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
