import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 bg-bg text-white">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 font-black tracking-tighter text-white/10">404</div>
        
        <h1 className="text-4xl font-black tracking-tight mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8 text-lg">
          The financial page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/" 
            className="btn btn-primary px-8 py-3.5 rounded-2xl font-bold"
          >
            Return to Dashboard
          </Link>
          <Link 
            href="/login" 
            className="btn btn-secondary px-8 py-3.5 rounded-2xl font-bold"
          >
            Go to Login
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-xs text-slate-400">
          Personal CFO • Sovereign Wealth OS
        </div>
      </div>
    </div>
  );
}
