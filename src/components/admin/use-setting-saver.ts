"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SiteActionState } from "@/actions/admin-site";

/** Runs a site-settings action with a pending state, a toast either way and a refresh on success. */
export function useSettingSaver() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<SiteActionState>, successMessage: string, onSuccess?: () => void) {
    startTransition(async () => {
      try {
        const result = await task();
        if (result.error) {
          toast.error(result.error);
          return;
        }
        onSuccess?.();
        toast.success(successMessage);
        router.refresh();
      } catch {
        toast.error("Не удалось сохранить. Проверьте соединение и попробуйте ещё раз.");
      }
    });
  }

  return { pending, run };
}
