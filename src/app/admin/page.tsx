'use client';

import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobStatus } from '@/data/types';

export default function AdminDashboard() {
  const { getJobs, getTechs, getUserById } = useData();

  const jobs = getJobs();
  const techs = getTechs();

  // Job stats
  const jobsByStatus = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<JobStatus, number>);

  const activeJobs = jobs.filter(j => j.status !== 'complete');
  const completedToday = jobs.filter(j => {
    if (!j.completedAt) return false;
    const today = new Date().toDateString();
    return new Date(j.completedAt).toDateString() === today;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/admin/jobs/new">
          <Button>Create Job</Button>
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
            <div className="text-3xl font-bold text-green-600">{completedToday.length}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{techs.length}</div>
            <div className="text-sm text-gray-500">Active Techs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{jobsByStatus.in_progress || 0}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <StatusBadge status="assigned" />
              <span className="text-sm text-gray-600">{jobsByStatus.assigned || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="on_the_way" />
              <span className="text-sm text-gray-600">{jobsByStatus.on_the_way || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="in_progress" />
              <span className="text-sm text-gray-600">{jobsByStatus.in_progress || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="complete" />
              <span className="text-sm text-gray-600">{jobsByStatus.complete || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
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
                        <div className="font-medium text-gray-900 truncate">{job.clientName}</div>
                        <div className="text-sm text-gray-500 truncate">{job.address}</div>
                        {tech && (
                          <div className="text-xs text-gray-400 mt-1">Assigned to: {tech.fullName}</div>
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
                  <div>
                    <div className="font-medium text-gray-900">{tech.fullName}</div>
                    <div className="text-xs text-gray-500">{tech.email}</div>
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
