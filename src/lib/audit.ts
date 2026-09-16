import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
