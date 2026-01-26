'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';

export default function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getJobById, getUserById, getJobPhotos, getJobInventoryUsage } = useData();

  const job = getJobById(id);

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Link href="/admin/jobs" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const tech = job.assignedTechId ? getUserById(job.assignedTechId) : null;
  const creator = getUserById(job.createdBy);
  const photos = getJobPhotos(job.id);
  const inventoryUsed = getJobInventoryUsage(job.id);

  const beforePhotos = photos.filter(p => p.photoType === 'before');
  const afterPhotos = photos.filter(p => p.photoType === 'after');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
      </div>

      {/* Job Header */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">{job.clientName}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-gray-600">{job.address}</p>
              {job.description && (
                <p className="text-gray-500 mt-2">{job.description}</p>
              )}
            </div>
            <div className="text-sm text-gray-500 sm:text-right">
              <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
              {creator && <div>By: {creator.fullName}</div>}
              {job.completedAt && (
                <div className="text-green-600 font-medium">
                  Completed: {new Date(job.completedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tech */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Tech</CardTitle>
        </CardHeader>
        <CardContent>
          {tech ? (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-medium">
                  {tech.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{tech.fullName}</div>
                <div className="text-sm text-gray-500">{tech.email}</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No tech assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {job.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{job.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Before Photos ({beforePhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {beforePhotos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No before photos</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {beforePhotos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photoUrl}
                    alt="Before"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After Photos ({afterPhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {afterPhotos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No after photos</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {afterPhotos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photoUrl}
                    alt="After"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Used */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Used ({inventoryUsed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryUsed.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inventory logged</p>
          ) : (
            <div className="space-y-2">
              {inventoryUsed.map((usage) => (
                <div key={usage.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{usage.item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">{usage.quantityUsed}</span>
                    <span className="text-gray-500 ml-1">{usage.item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
