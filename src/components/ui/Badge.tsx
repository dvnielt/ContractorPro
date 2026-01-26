import { ReactNode } from 'react';
import { JobStatus } from '@/data/types';

type BadgeVariant = 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Status-specific badge component
interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, { label: string; variant: BadgeVariant }> = {
  assigned: { label: 'Assigned', variant: 'gray' },
  on_the_way: { label: 'On the Way', variant: 'blue' },
  in_progress: { label: 'In Progress', variant: 'yellow' },
  pending_approval: { label: 'Pending Approval', variant: 'purple' },
  complete: { label: 'Complete', variant: 'green' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
