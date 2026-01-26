'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { resetData } = useData();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleReset = () => {
    resetData();
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">FieldFlow</h1>
            <span className="hidden sm:inline text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Demo
            </span>
          </div>

          {/* User info and actions */}
          <div className="flex items-center gap-4">
            {currentUser && (
              <>
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">{currentUser.fullName}</div>
                  <div className="text-xs text-gray-500 capitalize">{currentUser.role}</div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
                  title="Reset demo data"
                >
                  Reset
                </button>
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
