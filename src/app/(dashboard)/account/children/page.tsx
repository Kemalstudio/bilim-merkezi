import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { getChildrenForParent } from "@/lib/children-data";
import { getI18n } from "@/lib/i18n/server";
import { ChildCard } from "@/components/account/child-card";
import { ChildFormDialog } from "@/components/account/child-form-dialog";
import { LottieIcon } from "@/components/shared/lottie-icon";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.childrenMeta };
}

export default async function ChildrenPage() {
  const user = await requireUser();
  const [children, { t }] = await Promise.all([getChildrenForParent(user.id), getI18n()]);
  const a = t.account;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{a.childrenTitle}</h1>
          <p className="mt-1 text-muted">{a.childrenText}</p>
        </div>
        {children.length > 0 && <ChildFormDialog />}
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-10 text-center">
          {/* The face is drawn in navy, so it sits on a light disc in dark mode. */}
          <LottieIcon src="/lottie/kids-empty.json" className="h-24 w-24 rounded-full dark:bg-[#dbe6ee] dark:p-2" />
          <div>
            <p className="font-display text-lg font-semibold text-ink">{a.noProfiles}</p>
            <p className="mt-1 max-w-md text-sm text-muted">{a.noProfilesText}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ChildFormDialog />
            <Button asChild variant="outline">
              <Link href="/courses">{a.seeCourses}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}
