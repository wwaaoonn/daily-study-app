import { createHash, randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/app/lib/prisma";

const SESSION_COOKIE_NAME = "daily_study_session";
const SESSION_TTL_DAYS = 30;
const MAGIC_LINK_TTL_MINUTES = 15;

function addDuration(date: Date, durationMs: number) {
  return new Date(date.getTime() + durationMs);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getBaseUrl() {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export function normalizeCallbackPath(callbackPath?: string | null) {
  if (!callbackPath) {
    return "/";
  }

  const trimmedPath = callbackPath.trim();

  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    return "/";
  }

  return trimmedPath;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createMagicLink(input: {
  email: string;
  name?: string | null;
  callbackPath?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const callbackPath = normalizeCallbackPath(input.callbackPath);
  const rawToken = randomUUID();
  const now = new Date();
  const expiresAt = addDuration(now, MAGIC_LINK_TTL_MINUTES * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { email },
      update: {
        name: name ?? undefined,
      },
      create: {
        email,
        name,
      },
    });

    await tx.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    });

    await tx.verificationToken.create({
      data: {
        id: randomUUID(),
        identifier: email,
        token: hashToken(rawToken),
        expires_at: expiresAt,
      },
    });
  });

  const magicLink = new URL("/api/auth/verify", getBaseUrl());
  magicLink.searchParams.set("token", rawToken);
  magicLink.searchParams.set("next", callbackPath);

  return {
    email,
    magicLink: magicLink.toString(),
    expiresAt,
  };
}

export async function consumeMagicLink(rawToken: string) {
  const token = rawToken.trim();

  if (!token) {
    return null;
  }

  const now = new Date();
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      token: hashToken(token),
    },
  });

  if (!verificationToken || verificationToken.expires_at < now) {
    return null;
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.verificationToken.delete({
      where: {
        id: verificationToken.id,
      },
    });

    return tx.user.update({
      where: {
        email: verificationToken.identifier,
      },
      data: {
        email_verified_at: now,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  });

  return user;
}

export async function createSession(userId: string) {
  const sessionToken = randomUUID();
  const expiresAt = addDuration(new Date(), SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: randomUUID(),
      user_id: userId,
      session_token: hashToken(sessionToken),
      expires_at: expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      session_token: hashToken(sessionToken),
    },
    select: {
      id: true,
      expires_at: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  if (session.expires_at < new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function signOutCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        session_token: hashToken(sessionToken),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
