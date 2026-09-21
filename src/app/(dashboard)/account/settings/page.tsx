import type { Metadata } from "next";
import { AtSign, Database, Download, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatPhone, realEmail } from "@/lib/phone";
import { signInMethods } from "@/lib/account";
import { getLanguages } from "@/lib/site-settings";
import { getI18n } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm, SetPasswordForm } from "@/components/account/password-form";
import { SettingsSection, SettingsGroup } from "@/components/account/settings/settings-section";
import { SettingsNav } from "@/components/account/settings/settings-nav";
import { AvatarEditor } from "@/components/account/settings/avatar-editor";
import { EmailChange, PhoneChange } from "@/components/account/settings/contacts-forms";
import { ActivityList, type ActivityEntry } from "@/components/account/settings/activity-list";
import { PreferencesPanel } from "@/components/account/settings/preferences-panel";
import { DeleteAccount } from "@/components/account/settings/delete-account";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.settingsMeta };
}

/** What the activity list shows: sign-ins and the changes that matter for the account's safety. */
const ACTIVITY_ACTIONS = [
  "auth.signin",
  "auth.password_changed",
  "auth.password_set",
  "auth.email_changed",
  "auth.phone_changed",
  "profile.updated",
  "profile.avatar_changed",
  "profile.avatar_removed",
  "account.data_exported",
];

export default async function AccountSettingsPage() {
  const sessionUser = await requireUser();
  const [{ t, f, locale }, languages, user, googleLinks, logs] = await Promise.all([
    getI18n(),
    getLanguages(),
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { name: true, email: true, phone: true, image: true, role: true, passwordHash: true, createdAt: true },
    }),
    prisma.account.count({ where: { userId: sessionUser.id, provider: "google" } }),
    prisma.auditLog.findMany({
      where: { actorId: sessionUser.id, action: { in: ACTIVITY_ACTIONS } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, createdAt: true, metadata: true },
    }),
  ]);

  const email = realEmail(user.email);
  const methods = signInMethods({ phone: user.phone, passwordHash: user.passwordHash, hasGoogle: googleLinks > 0 });
  const hasPassword = Boolean(user.passwordHash);
  const displayName = user.name ?? "";

  const activity: ActivityEntry[] = logs.map((log) => {
    const meta = (log.metadata ?? {}) as { provider?: string; device?: string | null };
    return {
      id: log.id,
      action: log.action,
      createdAt: log.createdAt,
      provider: typeof meta.provider === "string" ? meta.provider : null,
      device: typeof meta.device === "string" ? meta.device : null,
    };
  });

  const navItems = [
    { id: "profile", label: t.settings.nav.profile },
    { id: "contacts", label: t.settings.nav.contacts },
    { id: "security", label: t.settings.nav.security },
    { id: "preferences", label: t.settings.nav.preferences },
    { id: "data", label: t.settings.nav.data },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">{t.settings.subtitle}</p>
      </div>

      {/* Who is signed in, at a glance. */}
      <div className="flex flex-col gap-4 rounded-[1.4rem] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar className="h-16 w-16 shrink-0 ring-4 ring-surface-sunken">
          <AvatarImage src={user.image ?? undefined} alt="" className="object-cover" />
          <AvatarFallback className="text-lg">{initials(displayName || email || "?")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold text-ink">{displayName || email || (user.phone ? formatPhone(user.phone) : "")}</p>
          <p className="text-sm text-muted">{tpl(t.settings.memberSince, { date: f.date(user.createdAt) })}</p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{t.settings.loginMethods}</span>
          <ul className="flex flex-wrap gap-1.5">
            {methods.map((method) => (
              <li key={method} className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald">
                {t.settings.methods[method]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2 xl:flex-row xl:gap-10">
        <SettingsNav items={navItems} label={t.settings.navLabel} />

        <div className="flex min-w-0 flex-1 flex-col gap-6 pt-2 xl:pt-0">
          <SettingsSection id="profile" icon={UserRound} title={t.settings.profile.title} text={t.settings.profile.text}>
            <SettingsGroup title={t.settings.profile.photo}>
              <AvatarEditor name={displayName || email || ""} image={user.image} />
            </SettingsGroup>
            <SettingsGroup>
              <ProfileForm defaultName={displayName} />
            </SettingsGroup>
          </SettingsSection>

          <SettingsSection id="contacts" icon={AtSign} title={t.settings.contacts.title} text={t.settings.contacts.text}>
            <PhoneChange phone={user.phone ? formatPhone(user.phone) : null} hasPassword={hasPassword} />
            <SettingsGroup>
              <EmailChange email={email} hasPassword={hasPassword} />
            </SettingsGroup>
          </SettingsSection>

          <SettingsSection id="security" icon={ShieldCheck} title={t.settings.security.title} text={t.settings.security.text}>
            {hasPassword ? (
              <SettingsGroup title={t.account.passwordTitle}>
                <PasswordForm />
              </SettingsGroup>
            ) : (
              <SettingsGroup title={t.settings.security.passwordSetTitle} hint={t.settings.security.passwordSetText}>
                <SetPasswordForm hasPhone={Boolean(user.phone)} />
              </SettingsGroup>
            )}
            <SettingsGroup title={t.settings.security.activityTitle} hint={t.settings.security.activityText}>
              <ActivityList entries={activity} t={t} f={f} />
            </SettingsGroup>
          </SettingsSection>

          <SettingsSection id="preferences" icon={SlidersHorizontal} title={t.settings.preferences.title} text={t.settings.preferences.text}>
            <PreferencesPanel locale={locale} languages={languages.enabled} />
          </SettingsSection>

          <SettingsSection id="data" icon={Database} title={t.settings.data.title} text={t.settings.data.text}>
            <SettingsGroup title={t.settings.data.exportTitle} hint={t.settings.data.exportText}>
              <Button asChild variant="outline" className="self-start">
                <a href="/account/settings/export" download>
                  <Download aria-hidden className="h-4 w-4" /> {t.settings.data.export}
                </a>
              </Button>
            </SettingsGroup>
            <SettingsGroup title={t.settings.data.deleteTitle} hint={t.settings.data.deleteText}>
              <DeleteAccount hasPassword={hasPassword} hasPhone={Boolean(user.phone)} isStaff={user.role !== "STUDENT"} />
            </SettingsGroup>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
