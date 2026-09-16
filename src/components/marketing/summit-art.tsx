/**
 * The summit scene for SummitSection: a dusk landscape in the site palette. Groups carry
 * data-layer so the section can move them at different depths; the route (low + high part)
 * and the flag are drawn in by the scroll.
 */

// Deterministic "random" stars (integer LCG), so server and client render identical markup.
let seed = 7;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const stars = Array.from({ length: 70 }, () => ({
  x: Math.round(random() * 16000) / 10,
  y: Math.round(random() * 3800) / 10,
  r: Math.round((0.8 + random() * 1.6) * 10) / 10,
  delay: Math.round(random() * 40) / 10,
}));

/** A three-tier pine silhouette standing on `base`. */
function pine(x: number, base: number, height: number) {
  const w = height * 0.36;
  const tier = (t: number) => base - height * t;
  return [
    `M${x} ${base - height}`,
    `L${x + w * 0.5} ${tier(0.62)} L${x + w * 0.28} ${tier(0.62)}`,
    `L${x + w * 0.78} ${tier(0.28)} L${x + w * 0.45} ${tier(0.28)}`,
    `L${x + w} ${base} L${x - w} ${base}`,
    `L${x - w * 0.45} ${tier(0.28)} L${x - w * 0.78} ${tier(0.28)}`,
    `L${x - w * 0.28} ${tier(0.62)} L${x - w * 0.5} ${tier(0.62)} Z`,
  ].join(" ");
}

const trees = [
  [70, 880, 230],
  [150, 870, 170],
  [225, 885, 120],
  [1380, 885, 150],
  [1455, 872, 210],
  [1540, 880, 250],
] as const;

const FAR_RIDGE =
  "M0 600 L90 540 L170 575 L260 500 L350 560 L430 520 L520 585 L600 540 L680 575 L760 530 L840 580 L930 520 L1010 560 L1100 505 L1180 565 L1270 525 L1350 570 L1440 515 L1520 560 L1600 530 V900 H0 Z";
const MID_RIDGE =
  "M0 720 L140 600 L260 470 L350 540 L430 500 L560 440 L680 370 L800 300 L900 380 L990 430 L1080 520 L1170 480 L1260 450 L1380 540 L1480 600 L1600 650 V900 H0 Z";
const NEAR_CREST = "M0 760 C160 700 300 740 420 722 S640 690 760 714 S980 762 1100 724 S1380 682 1600 742";
const FRONT_BAND = "M0 850 C200 820 420 870 640 860 S1020 830 1200 858 S1480 876 1600 840 V900 H0 Z";
// The route: up the near hills, then switchbacks on the mountain face to the summit.
const ROUTE_LOW = "M740 900 C620 862 900 822 842 782 C804 756 760 742 800 716";
const ROUTE_HIGH = "M800 716 C700 692 702 652 780 630 S900 590 842 560 S702 520 760 482 S878 432 822 392 S792 332 800 306";

function RoutePath({ d, part }: { d: string; part: "low" | "high" }) {
  return (
    <>
      <path d={d} fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="4" strokeDasharray="3 12" strokeLinecap="round" />
      <path data-summit-route={part} d={d} fill="none" stroke="#f4a83a" strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

export function SummitArt() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden className="h-full w-full">
      <defs>
        <linearGradient id="summit-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#041620" />
          <stop offset="0.32" stopColor="#0a3145" />
          <stop offset="0.5" stopColor="#105572" />
          <stop offset="0.6" stopColor="#7fc98f" />
          <stop offset="0.7" stopColor="#f0b968" />
        </linearGradient>
        <radialGradient id="summit-glow">
          <stop offset="0" stopColor="#ffd08a" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#f4a83a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#f4a83a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#summit-sky)" />

      <g data-layer="stars">
        {stars.map((star, i) => (
          <circle
            key={i}
            className="summit-star"
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#ffffff"
            style={{ animationDelay: `${star.delay}s` }}
          />
        ))}
      </g>

      <g data-layer="sun">
        <circle cx="800" cy="560" r="380" fill="url(#summit-glow)" />
        <circle cx="800" cy="560" r="128" fill="#ffd08a" />
      </g>

      <g data-cloud fill="#ffffff">
        <g opacity="0.1">
          <rect x="180" y="200" width="300" height="42" rx="21" />
          <rect x="250" y="176" width="150" height="48" rx="24" />
        </g>
        <g opacity="0.08">
          <rect x="1050" y="140" width="360" height="46" rx="23" />
          <rect x="1130" y="112" width="170" height="54" rx="27" />
        </g>
        <rect x="640" y="300" width="220" height="30" rx="15" opacity="0.07" />
      </g>

      <g data-layer="far">
        <path d={FAR_RIDGE} fill="#1a7a92" />
      </g>

      <g data-layer="mid">
        <path d={MID_RIDGE} fill="#0f4d67" />
        {/* Lit faces and the snow cap give the ridge its volume. */}
        <path d="M800 300 L560 440 L690 468 L760 560 Z" fill="#14657f" />
        <path d="M260 470 L140 600 L235 588 L290 640 Z" fill="#14657f" />
        <path d="M1260 450 L1170 480 L1215 545 L1262 515 Z" fill="#14657f" />
        <path d="M800 300 L762 346 L784 338 L800 356 L818 340 L840 350 Z" fill="#e2ebf2" />
        <RoutePath d={ROUTE_HIGH} part="high" />
        <g data-summit-flag>
          <line x1="800" y1="304" x2="800" y2="232" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <path d="M802 234 L858 250 L802 267 Z" fill="#e2604f" />
        </g>
      </g>

      <g data-layer="near">
        <path d={`${NEAR_CREST} V900 H0 Z`} fill="#0b374d" />
        <path d={NEAR_CREST} fill="none" stroke="#12607f" strokeWidth="3" />
        <RoutePath d={ROUTE_LOW} part="low" />
      </g>

      <g data-layer="front" fill="#072839">
        <path d={FRONT_BAND} />
        {trees.map(([x, base, height]) => (
          <path key={x} d={pine(x, base, height)} />
        ))}
      </g>
    </svg>
  );
}
