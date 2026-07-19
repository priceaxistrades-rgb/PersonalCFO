import Link from "next/link";

export default function ServerError() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 bg-bg text-white">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 font-black tracking-tighter text-red-500/20">500</div>
        
        <h1 className="text-4xl font-black tracking-tight mb-3">Something went wrong</h1>
        <p className="text-slate-400 mb-8 text-lg">
          We&apos;re experiencing technical difficulties. Our team has been notified.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/" 
            className="btn btn-primary px-8 py-3.5 rounded-2xl font-bold"
          >
            Return to Dashboard
          </Link>
          <a 
            href="https://github.com/priceaxistrades-rgb/PersonalCFO/issues" 
            target="_blank"
            className="btn btn-secondary px-8 py-3.5 rounded-2xl font-bold"
          >
            Report Issue
          </a>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-xs text-slate-400">
          Personal CFO • Sovereign Wealth OS
        </div>
      </div>
    </div>
  );
}
