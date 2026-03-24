'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { StatusBadge, JobTypeBadge, BidStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { JobStatus } from '@/data/types';

export default function AdminJobsPage() {
  const { getJobs, getTechs, getUserById } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const jobs = getJobs();
  const techs = getTechs();

  let filteredJobs = jobs;
  if (statusFilter !== 'all') {
    filteredJobs = filteredJobs.filter(j => j.status === statusFilter);
  }
  if (techFilter !== 'all') {
    filteredJobs = filteredJobs.filter(j => j.assignedTechId === techFilter);
  }
  if (typeFilter !== 'all') {
    filteredJobs = filteredJobs.filter(j => j.jobType === typeFilter);
  }
  if (dateFrom) {
    const from = new Date(dateFrom).setHours(0, 0, 0, 0);
    filteredJobs = filteredJobs.filter(j => new Date(j.createdAt).getTime() >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo).setHours(23, 59, 59, 999);
    filteredJobs = filteredJobs.filter(j => new Date(j.createdAt).getTime() <= to);
  }

  filteredJobs = [...filteredJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'on_the_way', label: 'On the Way' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'complete', label: 'Complete' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'tree', label: 'Tree' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'sod', label: 'Sod' },
    { value: 'other', label: 'Other' },
  ];

  const techOptions = [
    { value: 'all', label: 'All Techs' },
    ...techs.map(t => ({ value: t.id, label: t.fullName })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Jobs</h1>
        <Link href="/admin/jobs/new">
          <Button>+ New Job</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-full sm:w-44">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={techOptions}
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="From date"
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="To date"
          />
          {(dateFrom || dateTo) && (
            <Button size="sm" variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-400">
        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 animate-fade-in">
          <svg className="w-12 h-12 mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">No jobs found</p>
          <p className="text-xs mt-1 text-slate-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const tech = job.assignedTechId ? getUserById(job.assignedTechId) : null;
            const isReviewable = job.status === 'pending_review';
            return (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}>
                <Card hoverable className={`mb-0 ${isReviewable ? 'border-l-4 border-l-teal-500' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: job.color }}
                        />
                        <span className="font-medium text-slate-100">{job.clientName}</span>
                        <span className="text-xs text-slate-500 font-mono">{job.jobNumber}</span>
                        <StatusBadge status={job.status} />
                        <JobTypeBadge jobType={job.jobType} />
                        {job.bidStatus && <BidStatusBadge bidStatus={job.bidStatus} />}
                      </div>
                      <div className="text-sm text-slate-400 truncate">{job.address}</div>
                      {job.description && (
                        <div className="text-sm text-slate-400 truncate mt-1">{job.description}</div>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 sm:text-right shrink-0">
                      {tech ? (
                        <div className="flex items-center gap-2 sm:justify-end">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: tech.color }}
                          >
                            {tech.fullName[0]}
                          </div>
                          <span className="font-medium text-slate-300">{tech.fullName}</span>
                        </div>
                      ) : (
                        <div className="text-slate-500">Unassigned</div>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
