"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { updateUserRoleAction } from "@/actions/admin-users";
import { formatDate, initials } from "@/lib/utils";

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

export function UserTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [rows, setRows] = useState(users);
  const [isPending, startTransition] = useTransition();

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Пользователь</TableHead>
          <TableHead>Регистрация</TableHead>
          <TableHead>Записей</TableHead>
          <TableHead>Роль</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials(user.name ?? user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-ink">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>{user.enrollmentCount}</TableCell>
            <TableCell>
              <Select
                value={user.role}
                onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                disabled={isPending || user.id === currentUserId}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">{roleLabel.STUDENT}</SelectItem>
                  <SelectItem value="MODERATOR">{roleLabel.MODERATOR}</SelectItem>
                  <SelectItem value="ADMIN">{roleLabel.ADMIN}</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
