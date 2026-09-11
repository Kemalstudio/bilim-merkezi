import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Журнал действий" };

const actionLabel: Record<string, string> = {
  "course.created": "Создание курса",
  "course.updated": "Изменение курса",
  "course.deleted": "Удаление курса",
  "course.published": "Публикация курса",
  "course.unpublished": "Снятие с публикации",
  "user.role_changed": "Изменение роли",
  "payment.succeeded": "Успешная оплата",
  "payment.refunded": "Возврат оплаты",
  "database.seeded": "Инициализация базы данных",
};

export default async function AdminAuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Журнал действий</h1>
        <p className="mt-1 text-muted">История административных действий на платформе</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Пользователь</TableHead>
            <TableHead>Действие</TableHead>
            <TableHead>Объект</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted">{formatDate(log.createdAt)}</TableCell>
              <TableCell className="font-semibold text-ink">{log.actor.name ?? log.actor.email}</TableCell>
              <TableCell>{actionLabel[log.action] ?? log.action}</TableCell>
              <TableCell className="text-sm text-muted">
                {log.targetType}
                {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
