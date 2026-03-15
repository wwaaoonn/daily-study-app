import { NextResponse } from "next/server";

import { createMagicLink, isValidEmail } from "@/app/lib/auth";

type RequestLinkBody = {
  email?: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestLinkBody;
    const email = body.email?.trim() ?? "";
    const name = body.name?.trim() || undefined;

    if (!email) {
      return NextResponse.json(
        { error: "email is required." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "email format is invalid." },
        { status: 400 },
      );
    }

    const { magicLink } = await createMagicLink({ email, name });

    console.info(`Magic link for ${email}: ${magicLink}`);

    return NextResponse.json({
      ok: true,
      magicLink: process.env.NODE_ENV === "production" ? undefined : magicLink,
    });
  } catch (error) {
    console.error("Failed to create magic link:", error);

    return NextResponse.json(
      { error: "Failed to create magic link." },
      { status: 500 },
    );
  }
}
