import { randomUUID } from "node:crypto";

import { prisma } from "@/app/lib/prisma";

const DEFAULT_USER_EMAIL = "guest@daily-study.local";

export async function getDefaultUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      id: randomUUID(),
      email: DEFAULT_USER_EMAIL,
    },
    select: {
      id: true,
    },
  });
}
