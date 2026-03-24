'use client';

import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { JobStatus } from '@/data/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<JobStatus, string> = {
  assigned: '#6B7280',
  on_the_way: '#2196F3',
  in_progress: '#FF9800',
  pending_review: '#009688',
  complete: '#4CAF50',
};

export default function AnalyticsPage() {
  const { getJobs, getTechs, getInventoryItems, data } = useData();

  const jobs = getJobs();
  const techs = getTechs();
  const inventoryItems = getInventoryItems();

  // Job stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'complete');
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedThisWeek = completedJobs.filter(j =>
    j.completedAt && new Date(j.completedAt) >= thisWeekStart
  ).length;

  const completedThisMonth = completedJobs.filter(j =>
    j.completedAt && new Date(j.completedAt) >= thisMonthStart
  ).length;

  // Average time to complete (assigned → complete) in hours
  const avgCompletionHours = completedJobs.length > 0
    ? completedJobs.reduce((sum, j) => {
        const start = new Date(j.createdAt).getTime();
        const end = new Date(j.completedAt ?? j.createdAt).getTime();
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0) / completedJobs.length
    : 0;

  // Jobs by status for pie chart
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, { assigned: 0, on_the_way: 0, in_progress: 0, pending_review: 0, complete: 0 } as Record<JobStatus, number>);

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    status: status as JobStatus,
  }));

  // Jobs by type
  const typeData = ['tree', 'irrigation', 'sod', 'other'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count: jobs.filter(j => j.jobType === type).length,
  }));

  // Top inventory usage (last 30 days worth of job inventory)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const inventoryUsageMap = data.jobInventory.reduce((acc: Record<string, number>, ji) => {
    acc[ji.itemId] = (acc[ji.itemId] || 0) + ji.quantityUsed;
    return acc;
  }, {});

  const topInventory = inventoryItems
    .map(item => ({
      name: item.name.length > 20 ? item.name.substring(0, 18) + '…' : item.name,
      fullName: item.name,
      used: inventoryUsageMap[item.id] || 0,
      remaining: item.mainQuantity,
      unit: item.unit,
    }))
    .filter(i => i.used > 0)
    .sort((a, b) => b.used - a.used)
    .slice(0, 5);

  // CSV export
  const handleExportCSV = () => {
    const headers = ['Job Number', 'Client', 'Address', 'Type', 'Status', 'Tech', 'Created', 'Completed'];
    const rows = jobs.map(j => {
      const assignedTech = techs.find(t => t.id === j.assignedTechId);
      return [
        j.jobNumber,
        `"${j.clientName.replace(/"/g, '""')}"`,
        `"${j.address.replace(/"/g, '""')}"`,
        j.jobType,
        j.status,
        assignedTech ? `"${assignedTech.fullName}"` : '',
        new Date(j.createdAt).toLocaleDateString(),
        j.completedAt ? new Date(j.completedAt).toLocaleDateString() : '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldflow-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tech performance
  const techPerformance = techs.map(tech => {
    const techJobs = jobs.filter(j => j.assignedTechId === tech.id);
    const completed = techJobs.filter(j => j.status === 'complete').length;
    const active = techJobs.filter(j => j.status !== 'complete').length;
    return { tech, totalJobs: techJobs.length, completed, active };
  }).sort((a, b) => b.completed - a.completed);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
        <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{completedJobs.length}</div>
            <div className="text-sm text-slate-400">Total Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{completedThisWeek}</div>
            <div className="text-sm text-slate-400">Completed This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedThisMonth}</div>
            <div className="text-sm text-slate-400">Completed This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {avgCompletionHours > 0 ? avgCompletionHours.toFixed(1) + 'h' : '—'}
            </div>
            <div className="text-sm text-slate-400">Avg Completion Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs by Status + Type */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No job data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status as JobStatus] || '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, String(name).replace('_', ' ')]} />
                  <Legend formatter={(value) => String(value).replace('_', ' ')} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Inventory Usage */}
      {topInventory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Inventory Usage (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topInventory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [value, 'Used']}
                  labelFormatter={(label) => topInventory.find(i => i.name === label)?.fullName || String(label)}
                />
                <Bar dataKey="used" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 font-medium text-slate-400">Item</th>
                  <th className="text-right py-2 font-medium text-slate-400">Used (all time)</th>
                  <th className="text-right py-2 font-medium text-slate-400">Main Stock</th>
                  <th className="text-right py-2 font-medium text-slate-400">Unit</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(item => {
                  const used = inventoryUsageMap[item.id] || 0;
                  const isLow = item.mainQuantity <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="py-2 font-medium text-slate-100">{item.name}</td>
                      <td className="py-2 text-right text-slate-400">{used}</td>
                      <td className={`py-2 text-right font-medium ${isLow ? 'text-red-600' : 'text-slate-100'}`}>
                        {item.mainQuantity}
                        {isLow && <span className="ml-1 text-xs">(low)</span>}
                      </td>
                      <td className="py-2 text-right text-slate-400">{item.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tech Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Tech Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {techPerformance.map(({ tech, totalJobs: total, completed, active }) => (
              <div key={tech.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: tech.color }}
                  >
                    {tech.fullName.split(' ').filter(Boolean).map(n => n.charAt(0)).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-slate-100">{tech.fullName}</div>
                    <div className="text-xs text-slate-400">{total} total jobs</div>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <div className="font-bold text-green-600">{completed}</div>
                    <div className="text-xs text-slate-400">Completed</div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-600">{active}</div>
                    <div className="text-xs text-slate-400">Active</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
