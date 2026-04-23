'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Something went wrong');
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13131b] p-4 relative">
      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors group z-50"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Home
      </Link>

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
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Forgot password?</h1>
          <p className="text-sm text-white/40 mt-1">
            {sent ? 'Check your inbox for a reset link' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl">
          <div className="p-6">
            {sent ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 text-center">
                If <strong className="font-semibold">{email}</strong> is registered, a password reset link has been sent. Check your inbox (and spam folder).
              </div>
            ) : (
              <form id="forgot-form" onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-white/70">Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  />
                </div>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-3 px-6 pb-6 pt-0">
            {!sent && (
              <button
                type="submit"
                form="forgot-form"
                className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_4px_12px_-2px_rgba(124,58,237,0.35)] transition-all duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send reset link'}
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
