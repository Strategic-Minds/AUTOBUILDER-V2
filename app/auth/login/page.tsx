"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30 mb-4">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight text-balance text-center">
            Welcome back to XPS Intelligence
          </h1>
          <p className="text-[13px] text-white/60 mt-1 text-center">
            Sign in to your autonomous operating system
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl shadow-black/60">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/7 border border-white/10 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-white" htmlFor="password">
                  Password
                </label>
                <Link href="/auth/forgot" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-white/7 border border-white/10 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign in to XPS Intelligence
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/10 text-center text-[12px] text-white/50">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create free account
            </Link>
          </div>
        </div>

        {/* AI hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/40">
          <Sparkles className="w-3 h-3 text-indigo-400/60" />
          <span>Powered by 7 AI agents &amp; 34 active workflows</span>
        </div>
      </div>
    </div>
  );
}
