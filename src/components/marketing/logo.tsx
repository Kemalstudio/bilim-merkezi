import Link from "next/link";
import { Atom } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-accent text-[#0b2233] shadow-glow-sm transition-transform duration-300 group-hover:rotate-6">
        <Atom className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-extrabold tracking-[-0.04em] text-ink">BILIM</span>
        <span className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.22em] text-muted">merkezi</span>
      </span>
    </Link>
  );
}
