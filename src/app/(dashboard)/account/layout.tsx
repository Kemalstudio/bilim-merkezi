import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8 lg:py-14">
          <AccountSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
