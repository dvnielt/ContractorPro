'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <AuthProvider>{children}</AuthProvider>
    </DataProvider>
  );
}
