'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { AdminNav } from '@/components/layout/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  // Protect admin routes
  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      router.replace('/login');
    } else if (currentUser.role !== 'admin') {
      router.replace('/tech');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <AdminNav />
      <main className="md:ml-64 pt-4 pb-20 md:pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
