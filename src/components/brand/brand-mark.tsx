import { cn } from "@/lib/utils";

/**
 * The Bilim Merkezi mark: a single-stroke "B" on a teal-to-deep-blue tile, with an amber spark
 * of knowledge in the corner — the same spark as the constellation and the summit stars.
 *
 * Drawn inline so it stays crisp at every size and costs no request. The same artwork lives in
 * public/brand/bilim-mark.svg and src/app/icon.svg (favicon); change all three together.
 * Colours are fixed on purpose: the mark reads the same on light and dark backgrounds.
 */
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-9 w-9 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id="bilim-mark-bg" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1fb5ad" />
          <stop offset="0.5" stopColor="#0c6d8f" />
          <stop offset="1" stopColor="#073047" />
        </linearGradient>
        <linearGradient id="bilim-mark-shine" x1="24" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#bilim-mark-bg)" />
      <rect width="48" height="24" rx="14" fill="url(#bilim-mark-shine)" />
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="13.25" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
      <path
        d="M15.5 35V13h8.25a5.5 5.5 0 0 1 0 11H15.5m0 0h9.75a5.5 5.5 0 0 1 0 11H15.5"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37 6.5c.55 3.1 1.4 3.95 4.5 4.5-3.1.55-3.95 1.4-4.5 4.5-.55-3.1-1.4-3.95-4.5-4.5 3.1-.55 3.95-1.4 4.5-4.5Z"
        fill="#f4a83a"
      />
    </svg>
  );
}
