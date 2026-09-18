"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
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
        <DropdownMenuItem asChild className="text-rose focus:bg-rose/10">
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2 text-left cursor-pointer">
              <LogOut className="h-4 w-4" /> {labels.logout}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
