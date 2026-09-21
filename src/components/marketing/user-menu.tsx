"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LayoutDashboard, Loader2, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOutAction } from "@/actions/auth";
import { initials } from "@/lib/utils";
import { realEmail } from "@/lib/phone";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
};

type MenuLabels = { account: string; myCourses: string; admin: string; logout: string };

export function UserMenu({ user, labels }: { user: SessionUser; labels: MenuLabels }) {
  const canModerate = user.role === "ADMIN" || user.role === "MODERATOR";
  const email = realEmail(user.email);
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={labels.account} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-start cursor-pointer">
        <Avatar>
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
          <AvatarFallback>{initials(user.name ?? email ?? "?")}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">{user.name}</span>
          {email && <span className="truncate text-xs font-normal text-muted">{email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserIcon className="h-4 w-4" /> {labels.account}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/enrollments">
            <LayoutDashboard className="h-4 w-4" /> {labels.myCourses}
          </Link>
        </DropdownMenuItem>
        {canModerate && (
          <DropdownMenuItem asChild>
            <Link href="/bilim/admin">
              <ShieldCheck className="h-4 w-4" /> {labels.admin}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {/*
          Not a <form> inside the item: selecting an item closes the menu and unmounts its
          content before the form could submit, so the click silently did nothing. The menu
          stays open (preventDefault) to show progress until the redirect lands.
        */}
        <DropdownMenuItem
          className="cursor-pointer text-rose focus:bg-rose/10 focus:text-rose"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            startSignOut(() => signOutAction());
          }}
        >
          {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {labels.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
