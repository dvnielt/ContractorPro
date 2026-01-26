'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { User } from '@/data/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { getAdmins, getTechs, resetData } = useData();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'tech'>('admin');

  const admins = getAdmins();
  const techs = getTechs();
  const users = selectedRole === 'admin' ? admins : techs;

  const handleLogin = (user: User) => {
    login(user);
    router.push(user.role === 'admin' ? '/admin' : '/tech');
  };

  const handleReset = () => {
    resetData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FieldFlow</h1>
          <p className="text-gray-600 mt-2">Landscaping Field Service Demo</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Role
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRole('admin')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setSelectedRole('tech')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedRole === 'tech'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tech
            </button>
          </div>
        </div>

        {/* User Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleLogin(user)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{user.fullName}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        This is a demo. Select a role and user to continue.
      </p>
    </div>
  );
}
