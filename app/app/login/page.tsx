import { redirect } from "next/navigation";

import { LoginForm } from "@/app/components/login-form";
import { getCurrentUser, normalizeCallbackPath } from "@/app/lib/auth";

export const metadata = {
  title: "Sign In | Daily Study App",
  description: "メールリンクでログインして学習を続けます。",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const user = await getCurrentUser();

  if (user) {
    redirect(normalizeCallbackPath(params?.next));
  }

  return (
    <main className="auth-shell">
      <LoginForm
        initialError={params?.error ?? null}
        callbackPath={normalizeCallbackPath(params?.next)}
      />
    </main>
  );
}
