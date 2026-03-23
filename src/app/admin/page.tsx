'use client';

import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { JobStatus } from '@/data/types';

export default function AdminDashboard() {
  const { getJobs, getTechs, getUserById, getInventoryItems, isLoading } = useData();

  if (isLoading) return <DashboardSkeleton />;

  const jobs = getJobs();
  const techs = getTechs();
  const inventoryItems = getInventoryItems();

  const jobsByStatus = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<JobStatus, number>);

  const activeJobs = jobs.filter(j => j.status !== 'complete');
  const pendingReview = jobs.filter(j => j.status === 'pending_review');
  const completedToday = jobs.filter(j => {
    if (!j.completedAt) return false;
    const today = new Date().toDateString();
    return new Date(j.completedAt).toDateString() === today;
  });
  const lowStockItems = inventoryItems.filter(i => i.mainQuantity <= i.lowStockThreshold);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/admin/jobs/new">
          <Button>+ New Job</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeJobs.length}</div>
            <div className="text-sm text-gray-500">Active Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{pendingReview.length}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedToday.length}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {lowStockItems.length}
            </div>
            <div className="text-sm text-gray-500">Low Stock Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Review Alert */}
      {pendingReview.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {pendingReview.length} job{pendingReview.length > 1 ? 's' : ''} awaiting your review
                  </div>
                  <div className="text-sm text-gray-500">These jobs need approval before they can be marked complete</div>
                </div>
              </div>
              <Link href="/admin/jobs?status=pending_review">
                <Button variant="secondary" size="sm">Review Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {(['assigned', 'on_the_way', 'in_progress', 'pending_review', 'complete'] as JobStatus[]).map(status => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-sm text-gray-600">{jobsByStatus[status] || 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Jobs</CardTitle>
            <Link href="/admin/jobs" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active jobs</p>
          ) : (
            <div className="space-y-3">
              {activeJobs.slice(0, 5).map((job) => {
                const tech = job.assignedTechId ? getUserById(job.assignedTechId) : null;
                return (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: job.color }}
                          />
                          <span className="font-medium text-gray-900 truncate">{job.clientName}</span>
                          <span className="text-xs text-gray-400">{job.jobNumber}</span>
                        </div>
                        <div className="text-sm text-gray-500 truncate">{job.address}</div>
                        {tech && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tech.color }}
                            />
                            <span className="text-xs text-gray-400">{tech.fullName}</span>
                          </div>
                        )}
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tech Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tech Overview</CardTitle>
            <Link href="/admin/techs" className="text-sm text-blue-600 hover:text-blue-700">
              Manage
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {techs.map((tech) => {
              const techJobs = jobs.filter(j => j.assignedTechId === tech.id && j.status !== 'complete');
              const inProgress = techJobs.filter(j => j.status === 'in_progress').length;
              return (
                <div key={tech.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: tech.color }}
                    >
                      {tech.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{tech.fullName}</div>
                      <div className="text-xs text-gray-500">{tech.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{techJobs.length} jobs</div>
                    {inProgress > 0 && (
                      <div className="text-xs text-yellow-600">{inProgress} in progress</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
