import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/15 border border-red-500/25 mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-[18px] font-bold text-[#f2f2f4] mb-2">Authentication Error</h2>
        <p className="text-[13px] text-[#6b6b7a] mb-6">
          Something went wrong during authentication. The link may have expired or already been used.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
