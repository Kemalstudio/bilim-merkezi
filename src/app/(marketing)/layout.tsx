import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { IntroOverlay } from "@/components/marketing/intro-overlay";
import { PageTransition } from "@/components/marketing/page-transition";
import { CursorFollower } from "@/components/shared/cursor-follower";

export default function MarketingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <IntroOverlay />
      <PageTransition />
      <CursorFollower />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
