'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { ToastProvider } from '@/context/ToastContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </DataProvider>
  );
}
