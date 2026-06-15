import Link from 'next/link';
import { ReactNode } from 'react';

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className = '' }: PageShellProps) {
  return <div className={`page-shell ${className}`}>{children}</div>;
}

type BreadcrumbItem = { label: string; href?: string };

type PageHeroProps = {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
  wide?: boolean;
  children?: ReactNode;
};

export function PageHero({
  title,
  description,
  breadcrumb,
  actions,
  wide = false,
  children,
}: PageHeroProps) {
  return (
    <header className="page-hero">
      <div className={wide ? 'page-hero-inner-wide' : 'page-hero-inner'}>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="breadcrumb" aria-label="breadcrumb">
            {breadcrumb.map((item, i) => (
              <span key={item.label} className="flex items-center gap-2">
                {i > 0 && <span className="breadcrumb-sep">/</span>}
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span className="text-text-secondary">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">{title}</h1>
            {description && <p className="section-subheading max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3 shrink-0">{actions}</div>}
        </div>

        {children}
      </div>
    </header>
  );
}

type PageContainerProps = {
  children: ReactNode;
  narrow?: boolean;
  wide?: boolean;
  className?: string;
};

export function PageContainer({ children, narrow, wide, className = '' }: PageContainerProps) {
  const base = narrow ? 'page-container-narrow' : wide ? 'page-container-wide' : 'page-container';
  return <div className={`${base} ${className}`}>{children}</div>;
}

type StatCardProps = {
  label: string;
  value: string | number;
  accent?: 'gold' | 'orange' | 'red' | 'default';
};

export function StatCard({ label, value, accent = 'gold' }: StatCardProps) {
  const valueClass =
    accent === 'orange'
      ? 'text-orange-400'
      : accent === 'red'
        ? 'text-red-400'
        : accent === 'default'
          ? 'text-text-primary'
          : 'text-gold';

  return (
    <div className="stat-card">
      <p className="stat-label mb-2">{label}</p>
      <p className={`stat-value ${valueClass}`}>{value}</p>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h2 className="section-heading">{title}</h2>
        {description && <p className="section-subheading">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="text-text-primary font-semibold text-lg mb-2">{title}</p>
      {description && <p className="text-text-muted text-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

type SurfaceCardProps = {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  as?: 'div' | 'article' | 'section';
};

export function SurfaceCard({ children, hover = false, className = '', as: Tag = 'div' }: SurfaceCardProps) {
  return (
    <Tag className={`${hover ? 'surface-card-hover' : 'surface-card'} ${className}`}>{children}</Tag>
  );
}
