'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">FieldFlow</h1>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <>
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-slate-200">{currentUser.fullName}</div>
                  <div className="text-xs text-slate-500 capitalize">{currentUser.role}</div>
                </div>
                {currentUser.color && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-slate-700 flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
