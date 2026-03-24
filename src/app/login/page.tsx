'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError('');

    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setIsLoading(false);
      return;
    }

    // Let the root page handle role-based redirect
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-slate-100 tracking-tight">FieldFlow</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-slate-100">Sign in</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors min-h-[44px]"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center mb-3">Demo credentials (password: Fieldflow2026)</p>
          <div className="space-y-1.5">
            {[
              { label: 'Admin', email: 'danielthomasdev11@gmail.com' },
              { label: 'Tech 1', email: 'tech1@test.com' },
              { label: 'Tech 2', email: 'tech2@test.com' },
              { label: 'Tech 3', email: 'tech3@test.com' },
            ].map(({ label, email: demoEmail }) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => { setEmail(demoEmail); setPassword('Fieldflow2026'); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                <span className="text-xs font-medium text-slate-400">{label}</span>
                <span className="text-xs text-slate-600 ml-2">{demoEmail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
