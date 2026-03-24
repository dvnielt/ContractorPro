import { ReactNode } from 'react';
import { JobStatus, JobType, BidStatus } from '@/data/types';

type BadgeVariant = 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'teal' | 'orange';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray:   'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600/50',
  blue:   'bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/50',
  yellow: 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-700/50',
  green:  'bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/50',
  red:    'bg-red-900/50 text-red-300 ring-1 ring-red-700/50',
  purple: 'bg-purple-900/50 text-purple-300 ring-1 ring-purple-700/50',
  teal:   'bg-teal-900/50 text-teal-300 ring-1 ring-teal-700/50',
  orange: 'bg-orange-900/50 text-orange-300 ring-1 ring-orange-700/50',
};

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface StatusBadgeProps { status: JobStatus; className?: string }

const statusConfig: Record<JobStatus, { label: string; variant: BadgeVariant }> = {
  assigned:       { label: 'Assigned',       variant: 'gray'   },
  on_the_way:     { label: 'On the Way',     variant: 'blue'   },
  in_progress:    { label: 'In Progress',    variant: 'yellow' },
  pending_review: { label: 'Pending Review', variant: 'teal'   },
  complete:       { label: 'Complete',       variant: 'green'  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'gray' as BadgeVariant };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}

interface JobTypeBadgeProps { jobType: JobType; className?: string }

const jobTypeConfig: Record<JobType, { label: string; variant: BadgeVariant }> = {
  tree:       { label: 'Tree',       variant: 'green'  },
  irrigation: { label: 'Irrigation', variant: 'blue'   },
  sod:        { label: 'Sod',        variant: 'yellow' },
  other:      { label: 'Other',      variant: 'gray'   },
};

export function JobTypeBadge({ jobType, className = '' }: JobTypeBadgeProps) {
  const config = jobTypeConfig[jobType] ?? { label: jobType, variant: 'gray' as BadgeVariant };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}

interface BidStatusBadgeProps { bidStatus: BidStatus; className?: string }

const bidStatusConfig: Record<BidStatus, { label: string; variant: BadgeVariant }> = {
  needs_bid:        { label: 'Needs Bid',    variant: 'yellow' },
  pending_approval: { label: 'Bid Pending',  variant: 'purple' },
  approved:         { label: 'Bid Approved', variant: 'green'  },
};

export function BidStatusBadge({ bidStatus, className = '' }: BidStatusBadgeProps) {
  const config = bidStatusConfig[bidStatus] ?? { label: bidStatus, variant: 'gray' as BadgeVariant };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
