"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteChildAction } from "@/actions/children";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Deleting a child profile is confirmed in a dialog rather than a native
 * `confirm()`, so the warning is styled with the rest of the cabinet and stays
 * keyboard-navigable.
 */
export function DeleteChildButton({ childId, name }: { childId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteChildAction(childId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Профиль удалён");
      setOpen(false);
      router.push("/account/children");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Удалить профиль: ${name}`}>
          <Trash2 aria-hidden className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить профиль {name}?</DialogTitle>
          <DialogDescription>
            История экзаменов останется в центре, но исчезнет из вашего кабинета. Отменить это
            действие нельзя.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Удаляем..." : "Удалить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
