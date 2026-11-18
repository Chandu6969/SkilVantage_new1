import Link from "next/link";

export function PrintLink() {
  return (
    <Link href="/admin/print" className="no-print inline-flex h-10 items-center rounded-full bg-[#065f46] px-4 text-sm font-medium text-white">
      Print PDF
    </Link>
  );
}
