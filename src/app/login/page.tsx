"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function signInWithGoogle() {
    setLoading("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      setEmailSent(true);
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-seymour-bg">
      <div className="w-full max-w-sm px-6">
        <div className="mb-10 text-center">
          <h1 className="text-header font-semibold text-seymour-white">Seymour</h1>
          <p className="mt-2 text-body-sm text-seymour-text/60">Sign in to continue</p>
        </div>

        <div className="space-y-3">
          {/* Google */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-seymour-border bg-seymour-surface px-4 py-3 text-label-sm font-medium text-seymour-white transition-colors hover:bg-seymour-surface-2 disabled:opacity-50"
          >
            {loading === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-seymour-border" />
            <span className="text-label text-seymour-text/40">or</span>
            <div className="h-px flex-1 bg-seymour-border" />
          </div>

          {/* Email */}
          {emailSent ? (
            <div className="rounded-lg border border-seymour-border bg-seymour-surface px-4 py-4 text-center">
              <p className="text-label-sm text-seymour-text">
                Check your email — we sent a sign-in link to{" "}
                <span className="text-seymour-white">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={signInWithEmail} className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading !== null}
                className="w-full rounded-lg border border-seymour-border bg-seymour-surface px-4 py-3 text-label-sm text-seymour-white placeholder:text-seymour-text/40 focus:border-seymour-accent focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading !== null || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-seymour-border bg-seymour-surface px-4 py-3 text-label-sm font-medium text-seymour-white transition-colors hover:bg-seymour-surface-2 disabled:opacity-50"
              >
                {loading === "email" && <Loader2 className="size-4 animate-spin" />}
                Sign in with email
              </button>
            </form>
          )}

          {error && <p className="text-center text-label text-seymour-error-text">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
