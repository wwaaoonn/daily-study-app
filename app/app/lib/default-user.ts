import { randomUUID } from "node:crypto";

import { prisma } from "@/app/lib/prisma";

const DEFAULT_USER_EMAIL = "guest@daily-study.local";
let defaultUserPromise: Promise<{ id: string }> | null = null;

export async function getDefaultUser() {
  if (!defaultUserPromise) {
    defaultUserPromise = (async () => {
      const existingUser = await prisma.user.findUnique({
        where: { email: DEFAULT_USER_EMAIL },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        return existingUser;
      }

      try {
        return await prisma.user.create({
          data: {
            id: randomUUID(),
            email: DEFAULT_USER_EMAIL,
          },
          select: {
            id: true,
          },
        });
      } catch {
        return prisma.user.findUniqueOrThrow({
          where: { email: DEFAULT_USER_EMAIL },
          select: {
            id: true,
          },
        });
      }
    })();
  }

  return defaultUserPromise;
}
