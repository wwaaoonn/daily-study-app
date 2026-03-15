import { NextResponse } from "next/server";

import { createMagicLink, isValidEmail } from "@/app/lib/auth";
import { sendMagicLinkEmail } from "@/app/lib/email";

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

    if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
      await sendMagicLinkEmail({
        to: email,
        magicLink,
        name,
      });
    } else {
      console.info(`Magic link for ${email}: ${magicLink}`);
    }

    return NextResponse.json({
      ok: true,
      magicLink:
        process.env.NODE_ENV === "production" || process.env.RESEND_API_KEY
          ? undefined
          : magicLink,
    });
  } catch (error) {
    console.error("Failed to create magic link:", error);

    return NextResponse.json(
      { error: "Failed to create magic link." },
      { status: 500 },
    );
  }
}
