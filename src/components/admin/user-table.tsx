"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound } from "lucide-react";
import type { Role } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  createPasswordResetLinkAction,
  updateUserRoleAction,
} from "@/actions/admin-users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, initials } from "@/lib/utils";
import { realEmail } from "@/lib/phone";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
  enrollmentCount: number;
};

const roleLabel: Record<Role, string> = {
  STUDENT: "Студент",
  MODERATOR: "Модератор",
  ADMIN: "Администратор",
};

type ResetLink = {
  name: string;
  url: string;
  emailedTo: string | null;
  emailFailed: boolean;
  emailSimulated: boolean;
};

export function UserTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(users);
  const [isPending, startTransition] = useTransition();
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<ResetLink | null>(null);
  const [copied, setCopied] = useState(false);

  function handleResetLink(user: UserRow) {
    setResetFor(user.id);
    startTransition(async () => {
      const result = await createPasswordResetLinkAction(user.id);
      setResetFor(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setCopied(false);
      setResetLink({ name: user.name ?? user.email, ...result });
    });
  }

  async function copyLink() {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink.url);
      setCopied(true);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать — выделите ссылку вручную");
    }
  }

  function handleRoleChange(userId: string, role: Role) {
    const prevRows = rows;
    setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, role);
      if (result?.error) {
        toast.error(result.error);
        setRows(prevRows);
      } else {
        toast.success("Роль обновлена");
      }
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Пользователь</TableHead>
            <TableHead>Регистрация</TableHead>
            <TableHead>Записей</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead className="text-right">Доступ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {initials(user.name ?? user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-ink">{user.name}</p>
                    <p className="text-xs text-muted">
                      {realEmail(user.email) ?? "вход по телефону"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>{user.enrollmentCount}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) =>
                    handleRoleChange(user.id, value as Role)
                  }
                  disabled={isPending || user.id === currentUserId}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">{roleLabel.STUDENT}</SelectItem>
                    <SelectItem value="MODERATOR">
                      {roleLabel.MODERATOR}
                    </SelectItem>
                    <SelectItem value="ADMIN">{roleLabel.ADMIN}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetLink(user)}
                  disabled={isPending}
                  title="Одноразовая ссылка, по которой пользователь задаст новый пароль"
                >
                  <KeyRound className="h-4 w-4" />
                  {resetFor === user.id ? "Создаём..." : "Сбросить пароль"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={Boolean(resetLink)}
        onOpenChange={(open) => !open && setResetLink(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ссылка для нового пароля</DialogTitle>
            <DialogDescription>
              Для «{resetLink?.name}». Ссылка одноразовая и действует 24 часа;
              старый пароль продолжит работать, пока по ней не зададут новый.
              Предыдущие ссылки этого пользователя больше не действуют.
            </DialogDescription>
          </DialogHeader>
          {resetLink && (
            <div className="flex flex-col gap-4">
              <p
                className={
                  resetLink.emailedTo && !resetLink.emailFailed
                    ? "rounded-xl bg-emerald/10 px-4 py-3 text-sm font-medium text-emerald"
                    : "rounded-xl bg-amber/10 px-4 py-3 text-sm font-medium text-amber"
                }
              >
                {!resetLink.emailedTo
                  ? "У аккаунта нет email — передайте ссылку родителю сами (SMS, мессенджер)."
                  : resetLink.emailFailed
                    ? `Письмо на ${resetLink.emailedTo} не ушло — передайте ссылку сами.`
                    : resetLink.emailSimulated
                      ? `Почта не настроена: письмо на ${resetLink.emailedTo} напечатано в консоли сервера.`
                      : `Письмо со ссылкой отправлено на ${resetLink.emailedTo}.`}
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={resetLink.url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="h-11 min-w-0 flex-1 rounded-[0.9rem] border border-border bg-surface-sunken px-3 font-mono text-xs text-ink"
                  aria-label="Ссылка для сброса пароля"
                />
                <Button onClick={copyLink} size="md">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Готово" : "Копировать"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
