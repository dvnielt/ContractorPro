import { ReactNode } from 'react';
import { JobStatus, JobType, BidStatus } from '@/data/types';

type BadgeVariant = 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'teal' | 'orange';

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
  teal: 'bg-teal-100 text-teal-700',
  orange: 'bg-orange-100 text-orange-700',
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

// Job Status Badge
interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, { label: string; variant: BadgeVariant }> = {
  assigned: { label: 'Assigned', variant: 'gray' },
  on_the_way: { label: 'On the Way', variant: 'blue' },
  in_progress: { label: 'In Progress', variant: 'yellow' },
  pending_review: { label: 'Pending Review', variant: 'teal' },
  complete: { label: 'Complete', variant: 'green' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'gray' as BadgeVariant };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Job Type Badge
interface JobTypeBadgeProps {
  jobType: JobType;
  className?: string;
}

const jobTypeConfig: Record<JobType, { label: string; variant: BadgeVariant }> = {
  tree: { label: 'Tree', variant: 'green' },
  irrigation: { label: 'Irrigation', variant: 'blue' },
  sod: { label: 'Sod', variant: 'yellow' },
  other: { label: 'Other', variant: 'gray' },
};

export function JobTypeBadge({ jobType, className = '' }: JobTypeBadgeProps) {
  const config = jobTypeConfig[jobType] ?? { label: jobType, variant: 'gray' as BadgeVariant };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Bid Status Badge
interface BidStatusBadgeProps {
  bidStatus: BidStatus;
  className?: string;
}

const bidStatusConfig: Record<BidStatus, { label: string; variant: BadgeVariant }> = {
  needs_bid: { label: 'Needs Bid', variant: 'yellow' },
  pending_approval: { label: 'Bid Pending', variant: 'purple' },
  approved: { label: 'Bid Approved', variant: 'green' },
};

export function BidStatusBadge({ bidStatus, className = '' }: BidStatusBadgeProps) {
  const config = bidStatusConfig[bidStatus] ?? { label: bidStatus, variant: 'gray' as BadgeVariant };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
