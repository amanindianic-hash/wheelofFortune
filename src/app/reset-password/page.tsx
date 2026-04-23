'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#13131b] p-4">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[120px]" />
        </div>
        <div className="relative w-full max-w-sm">
          <div className="rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-2xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-1">Invalid link</h2>
            <p className="text-sm text-white/40 mb-4">This reset link is missing or invalid.</p>
            <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Reset failed');
        return;
      }
      setDone(true);
      toast.success('Password reset! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13131b] p-4 relative">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-[0_0_0_1px_rgba(124,58,237,0.3),0_8px_24px_-4px_rgba(124,58,237,0.5)] mb-5 hover:scale-105 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v10l4 4" />
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            </svg>
          </Link>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Set new password</h1>
          <p className="text-sm text-white/40 mt-1">Choose a strong password for your account</p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl">
          <div className="p-6">
            {done ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 text-center">
                Password reset successfully! Redirecting to login…
              </div>
            ) : (
              <form id="reset-form" onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-white/70">New password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 pr-10 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-xs font-medium text-white/70">Confirm password</label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 pr-10 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-3 px-6 pb-6 pt-0">
            {!done && (
              <button
                type="submit"
                form="reset-form"
                className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_4px_12px_-2px_rgba(124,58,237,0.35)] transition-all duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Reset Password'}
              </button>
            )}
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
