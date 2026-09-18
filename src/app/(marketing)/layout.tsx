import type { ReactNode } from "react";
import { getAnimations, getAssistantSettings } from "@/lib/site-settings";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { IntroOverlay } from "@/components/marketing/intro-overlay";
import { PageTransition } from "@/components/marketing/page-transition";
import { CursorFollower } from "@/components/shared/cursor-follower";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export default async function MarketingLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Each of these can be switched off in /bilim/admin/site/animations and /bilim/admin/site/assistant.
  const [animations, assistant] = await Promise.all([getAnimations(), getAssistantSettings()]);

  return (
    <>
      {animations.intro && <IntroOverlay />}
      {animations.pageTransition && <PageTransition />}
      {animations.cursor && <CursorFollower />}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {assistant.enabled && <AssistantWidget />}
    </>
  );
}
