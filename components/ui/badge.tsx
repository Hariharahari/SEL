'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyle =
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 bg-transparent text-gray-700',
  };

  return <span className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</span>;
}
