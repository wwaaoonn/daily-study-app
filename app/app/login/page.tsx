import { redirect } from "next/navigation";

import { LoginForm } from "@/app/components/login-form";
import { getCurrentUser } from "@/app/lib/auth";

export const metadata = {
  title: "Sign In | Daily Study App",
  description: "メールリンクでログインして学習を続けます。",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="auth-shell">
      <LoginForm initialError={params?.error ?? null} />
    </main>
  );
}
