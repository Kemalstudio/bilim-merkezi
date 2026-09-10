import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { getChildrenForParent } from "@/lib/children-data";
import { ChildCard } from "@/components/account/child-card";
import { ChildFormDialog } from "@/components/account/child-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Мои дети" };

export default async function ChildrenPage() {
  const user = await requireUser();
  const children = await getChildrenForParent(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Мои дети</h1>
          <p className="mt-1 text-muted">
            Профили, по которым вы записываете детей и следите за их результатами.
          </p>
        </div>
        {children.length > 0 && <ChildFormDialog />}
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken">
            <Users aria-hidden className="h-6 w-6 text-brand-ink" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">Пока ни одного профиля</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Добавьте ребёнка — и записывать его на курсы можно будет в два шага, а баллы за
              экзамены появятся в кабинете автоматически.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ChildFormDialog />
            <Button asChild variant="outline">
              <Link href="/courses">Посмотреть курсы</Link>
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
