import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1EFE7] p-6">
      <div className="text-center">
        <span className="font-serif italic text-[80px] leading-none text-[#C4BEB4] select-none">
          404
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[#1A1A1A]">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-[#6B6560]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333333] transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
