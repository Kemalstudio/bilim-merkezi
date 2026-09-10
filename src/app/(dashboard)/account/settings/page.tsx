import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";

export const metadata: Metadata = { title: "Настройки" };

export default async function AccountSettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-bold text-ink">Настройки</h1>
      <ProfileForm defaultName={user.name ?? ""} email={user.email} />
      {user.passwordHash && <PasswordForm />}
    </div>
  );
}
