"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/marketing/nav-links";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { signOutAction } from "@/actions/auth";

type SessionUser = {
  name?: string | null;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
} | null;

type NavLabels = {
  home: string;
  courses: string;
  library: string;
  about: string;
  contact: string;
  login: string;
  register: string;
  account: string;
  admin: string;
  logout: string;
  menu: string;
  theme: string;
};

export function MobileNav({ user, labels }: { user: SessionUser; labels: NavLabels }) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  const canModerate = user?.role === "ADMIN" || user?.role === "MODERATOR";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={labels.menu}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>{labels.menu}</SheetTitle>
        <NavLinks labels={labels} className="flex-col items-start gap-1" onNavigate={() => setOpen(false)} />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{labels.theme}</span>
          <ThemeToggle />
        </div>
        <Separator />
        {user ? (
          <div className="flex flex-col gap-2">
            <Button asChild variant="subtle" onClick={() => setOpen(false)}>
              <Link href="/account">{labels.account}</Link>
            </Button>
            {canModerate && (
              <Button asChild variant="outline" onClick={() => setOpen(false)}>
                <Link href="/bilim/admin">
                  <ShieldCheck className="h-4 w-4" /> {labels.admin}
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full text-rose"
              disabled={isSigningOut}
              onClick={() => startSignOut(() => signOutAction())}
            >
              {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {labels.logout}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/login">{labels.login}</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/register">{labels.register}</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
