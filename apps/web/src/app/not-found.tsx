import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6">
      <div className="text-center">
        <span className="font-serif italic text-[80px] leading-none text-[#2A2A2A] select-none">
          404
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[#F1EFE7]">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-[#6B6560]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-[#F1EFE7] px-5 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#E5E1D8] transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
