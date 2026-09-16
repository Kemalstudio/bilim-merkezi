import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollExpandCard } from "@/components/shared/scroll-expand-card";
import { SplitHeading } from "@/components/shared/split-heading";
import { GradientMeshBg } from "@/components/marketing/gradient-mesh-bg";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function CtaSection({ labels }: { labels: Dictionary["finalCta"] }) {
  return (
    <section id="enroll" className="scroll-mt-24 pb-20">
      <ScrollExpandCard className="paper-noise relative overflow-hidden bg-accent px-8 py-20 text-center text-[#0b2233] sm:px-16 lg:py-28">
        <GradientMeshBg className="opacity-15 mix-blend-multiply" />
        <p className="relative mx-auto mb-6 text-[0.7rem] font-extrabold uppercase tracking-[0.14em]">{labels.eyebrow}</p>
        <SplitHeading className="relative mx-auto max-w-4xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
          {labels.title}
        </SplitHeading>
        <p className="relative mx-auto mt-6 max-w-xl text-[#41607a]">{labels.subtitle}</p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="!border-[#0b2233] !bg-[#0b2233] !text-white hover:-translate-y-0.5 hover:!border-[#0e4a63] hover:!bg-[#0e4a63] hover:!text-white"
          >
            <Link href="/register">
              {labels.ctaPrimary} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-[#0b2233]/25 bg-transparent text-[#0b2233] hover:border-[#0b2233]/50 hover:bg-white/25 hover:text-[#0b2233]">
            <Link href="/courses">{labels.ctaSecondary}</Link>
          </Button>
        </div>
      </ScrollExpandCard>
    </section>
  );
}
