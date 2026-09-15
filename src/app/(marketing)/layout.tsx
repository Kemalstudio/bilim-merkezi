import type { ReactNode } from "react";
import { getAnimations } from "@/lib/site-settings";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { IntroOverlay } from "@/components/marketing/intro-overlay";
import { PageTransition } from "@/components/marketing/page-transition";
import { CursorFollower } from "@/components/shared/cursor-follower";

export default async function MarketingLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Each of these can be switched off in /bilim/admin/site/animations.
  const animations = await getAnimations();

  return (
    <>
      {animations.intro && <IntroOverlay />}
      {animations.pageTransition && <PageTransition />}
      {animations.cursor && <CursorFollower />}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
