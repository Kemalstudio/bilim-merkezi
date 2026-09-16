import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getHeroReport } from "@/lib/site-settings";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import { HeroContent } from "@/components/marketing/hero-content";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { HeroScrollScene } from "@/components/marketing/hero-scroll-scene";

export async function Hero({
  pinned = true,
  allow3d = true,
}: {
  /** Whether HeroStage's pinned scene runs (the "heroScene" animation switch). */
  pinned?: boolean;
  /** Whether the WebGL constellation may load (the "hero3d" animation switch). */
  allow3d?: boolean;
}) {
  const [locale, report] = await Promise.all([getLocale(), getHeroReport()]);
  const dict = await getDictionary(locale);

  return (
    <section className="relative px-3 pb-16 sm:px-5 sm:pb-20">
      <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-panel shadow-[0_40px_100px_-48px_rgba(0,0,0,0.75)] sm:rounded-[2.4rem]">
        <AuroraBackground />
        <div aria-hidden className="science-grid pointer-events-none absolute inset-0" />
        <HeroScrollScene
          pinned={pinned}
          content={<HeroContent labels={dict.hero} />}
          visual={<HeroVisual labels={dict.hero.report} report={report} locale={locale} allow3d={allow3d} />}
        />
      </div>
    </section>
  );
}
