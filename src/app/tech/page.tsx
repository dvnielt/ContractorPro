'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { JobStatus } from '@/data/types';

type FilterStatus = 'all' | 'assigned' | 'on_the_way' | 'in_progress';

export default function TechDashboard() {
  const { currentUser } = useAuth();
  const { getJobsByTech, getTechInventory, isLoading } = useData();

  if (isLoading) return <DashboardSkeleton />;

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const jobs = currentUser ? getJobsByTech(currentUser.id) : [];
  const inventory = currentUser ? getTechInventory(currentUser.id) : [];

  // Filter out completed jobs by default, apply status filter
  const activeJobs = jobs.filter(j => j.status !== 'complete');
  const filteredJobs = statusFilter === 'all'
    ? activeJobs
    : activeJobs.filter(j => j.status === statusFilter);

  // Sort by status priority (in_progress first, then on_the_way, then assigned)
  const statusPriority: Record<JobStatus, number> = {
    in_progress: 0,
    on_the_way: 1,
    assigned: 2,
    pending_review: 3,
    complete: 4,
  };
  const sortedJobs = [...filteredJobs].sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'all', count: activeJobs.length },
    { label: 'Assigned', value: 'assigned', count: activeJobs.filter(j => j.status === 'assigned').length },
    { label: 'On the Way', value: 'on_the_way', count: activeJobs.filter(j => j.status === 'on_the_way').length },
    { label: 'In Progress', value: 'in_progress', count: activeJobs.filter(j => j.status === 'in_progress').length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Inventory</CardTitle>
            <Link href="/tech/inventory" className="text-sm text-green-600 hover:text-green-700">
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-gray-500 text-sm">No inventory assigned</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {inventory.slice(0, 4).map((inv) => (
                <div key={inv.id} className="bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{inv.item.name}</div>
                  <div className="text-xs text-gray-500">
                    {inv.quantity} {inv.item.unit}
                  </div>
                </div>
              ))}
              {inventory.length > 4 && (
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-500">
                  +{inventory.length - 4} more
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              statusFilter === tab.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {sortedJobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {statusFilter === 'all' ? 'No active jobs assigned' : `No jobs with status "${statusFilter.replace('_', ' ')}"`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedJobs.map((job) => (
            <Link key={job.id} href={`/tech/jobs/${job.id}`}>
              <Card hoverable className="mb-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{job.clientName}</div>
                    <div className="text-sm text-gray-600 truncate">{job.address}</div>
                    {job.description && (
                      <div className="text-sm text-gray-500 truncate mt-1">{job.description}</div>
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Completed Jobs Link */}
      {jobs.filter(j => j.status === 'complete').length > 0 && (
        <div className="text-center">
          <Link href="/tech/jobs?status=complete" className="text-sm text-gray-500 hover:text-gray-700">
            View {jobs.filter(j => j.status === 'complete').length} completed job(s)
          </Link>
        </div>
      )}
    </div>
  );
}
