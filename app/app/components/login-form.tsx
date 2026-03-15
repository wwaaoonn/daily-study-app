"use client";

import { useState } from "react";

type LoginFormProps = {
  initialError?: string | null;
  callbackPath?: string;
};

type RequestLinkResponse = {
  ok?: boolean;
  error?: string;
  magicLink?: string;
};

function getErrorMessage(error: string | null | undefined) {
  if (error === "missing-token") {
    return "ログインリンクに必要な情報がありません。もう一度メール送信をお試しください。";
  }

  if (error === "invalid-link") {
    return "ログインリンクの有効期限が切れているか、すでに使用されています。";
  }

  if (error === "verify-failed") {
    return "ログイン処理に失敗しました。時間をおいて再度お試しください。";
  }

  return null;
}

export function LoginForm({ initialError, callbackPath = "/" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(getErrorMessage(initialError));
  const [debugLink, setDebugLink] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    setDebugLink(null);

    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          callback_path: callbackPath,
        }),
      });
      const data = (await response.json()) as RequestLinkResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "ログインメールの送信に失敗しました。");
      }

      setStatus("sent");
      setDebugLink(data.magicLink ?? null);
    } catch (submitError) {
      console.error(submitError);
      setStatus("idle");
      setError("ログインメールを送信できませんでした。時間をおいて再度お試しください。");
    }
  }

  return (
    <section className="auth-card">
      <p className="auth-eyebrow">Sign In</p>
      <h1 className="auth-title">メールリンクでログイン</h1>
      <p className="auth-copy">
        メールアドレスを入力すると、ワンタップでログインできるリンクを送ります。
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>表示名</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Takato"
            autoComplete="nickname"
          />
        </label>

        <label className="auth-field">
          <span>メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <button className="auth-submit" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "送信中..." : "ログインリンクを送る"}
        </button>
      </form>

      {status === "sent" ? (
        <p className="auth-success">
          ログインリンクを発行しました。メールを確認してください。
        </p>
      ) : null}

      {debugLink ? (
        <p className="auth-debug">
          開発用リンク: <a href={debugLink}>{debugLink}</a>
        </p>
      ) : null}

      {error ? <p className="auth-error">{error}</p> : null}
    </section>
  );
}
