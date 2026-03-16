import { Resend } from "resend";

import { getBaseUrl } from "@/app/lib/auth";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  return new Resend(apiKey);
}

function getMailFrom() {
  const mailFrom = process.env.MAIL_FROM;

  if (!mailFrom) {
    throw new Error("MAIL_FROM is not set.");
  }

  return mailFrom;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailHtml(input: { magicLink: string; name?: string | null }) {
  const greeting = escapeHtml(
    input.name?.trim() ? `${input.name}さん` : "こんにちは",
  );
  const magicLink = escapeHtml(input.magicLink);

  return `
    <div style="background:#f7f9ef;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',Meiryo,sans-serif;color:#252525;">
      <div style="max-width:560px;margin:0 auto;background:#fffdf7;border:1px solid rgba(87,212,0,0.12);border-radius:24px;padding:32px;">
        <p style="margin:0;color:#44a800;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Budledge</p>
        <h1 style="margin:16px 0 0;font-size:28px;line-height:1.2;">ログインリンクをお送りします</h1>
        <p style="margin:20px 0 0;font-size:16px;line-height:1.8;">${greeting}</p>
        <p style="margin:12px 0 0;font-size:16px;line-height:1.8;">
          下のボタンからログインしてください。リンクの有効期限は15分です。
        </p>
        <p style="margin:28px 0 0;">
          <a
            href="${magicLink}"
            style="display:inline-block;background:#252525;border-radius:999px;color:#ffffff;font-size:16px;font-weight:700;padding:14px 22px;text-decoration:none;"
          >
            Budledge にログイン
          </a>
        </p>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#7d7d78;">
          ボタンが開けない場合は、次のURLをブラウザに貼り付けてください。
        </p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.8;word-break:break-all;">
          <a href="${magicLink}" style="color:#44a800;">${magicLink}</a>
        </p>
      </div>
    </div>
  `;
}

function buildEmailText(input: { magicLink: string; name?: string | null }) {
  const greeting = input.name?.trim() ? `${input.name}さん` : "こんにちは";

  return `${greeting}

Budledge へのログインリンクをお送りします。
以下のURLを開いてログインしてください。

${input.magicLink}

このリンクの有効期限は15分です。`;
}

function buildDailyQuestionEmailHtml(input: {
  questionLink: string;
  questionPrompt: string;
  category: string;
  categorySub?: string | null;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  answerLinkA: string;
  answerLinkB: string;
  answerLinkC: string;
  answerLinkD: string;
  name?: string | null;
}) {
  const greeting = escapeHtml(
    input.name?.trim() ? `${input.name}さん` : "こんにちは",
  );
  const dashboardLink = escapeHtml(new URL("/dashboard", getBaseUrl()).toString());
  const questionLink = escapeHtml(input.questionLink);
  const questionPrompt = escapeHtml(input.questionPrompt);
  const category = escapeHtml(input.category);
  const categorySub = input.categorySub?.trim() ? escapeHtml(input.categorySub) : null;
  const choiceA = escapeHtml(input.choiceA);
  const choiceB = escapeHtml(input.choiceB);
  const choiceC = escapeHtml(input.choiceC);
  const choiceD = escapeHtml(input.choiceD);
  const answerLinkA = escapeHtml(input.answerLinkA);
  const answerLinkB = escapeHtml(input.answerLinkB);
  const answerLinkC = escapeHtml(input.answerLinkC);
  const answerLinkD = escapeHtml(input.answerLinkD);

  return `
    <div style="background:#f7f9ef;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',Meiryo,sans-serif;color:#252525;">
      <div style="max-width:560px;margin:0 auto;background:#fffdf7;border:1px solid rgba(87,212,0,0.12);border-radius:24px;padding:32px;">
        <p style="margin:0;color:#44a800;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Budledge Daily Question</p>
        <h1 style="margin:16px 0 0;font-size:28px;line-height:1.2;">今日の1問を届けました</h1>
        <p style="margin:20px 0 0;font-size:16px;line-height:1.8;">${greeting}</p>
        <p style="margin:12px 0 0;font-size:16px;line-height:1.8;">
          今日の問題に挑戦して、学習のリズムをつくりましょう。
        </p>
        <div style="margin:24px 0 0;padding:20px 22px;background:#f1f7db;border-radius:20px;">
          <p style="margin:0 0 10px;color:#5d6b2f;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Today's Question</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;">
            <span style="display:inline-flex;background:#ffffff;border:1px solid rgba(87,212,0,0.2);border-radius:999px;color:#44a800;font-size:12px;font-weight:700;letter-spacing:0.02em;padding:6px 10px;">${category}</span>
            ${categorySub ? `<span style="display:inline-flex;background:rgba(37,37,37,0.04);border:1px solid rgba(37,37,37,0.08);border-radius:999px;color:#252525;font-size:12px;font-weight:700;letter-spacing:0.02em;padding:6px 10px;">${categorySub}</span>` : ""}
          </div>
          <p style="margin:0;font-size:18px;line-height:1.7;font-weight:700;">${questionPrompt}</p>
        </div>
        <div style="margin:24px 0 0;">
          <p style="margin:0 0 14px;color:#5d6b2f;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Choose Your Answer</p>
          <div style="display:grid;gap:12px;">
            <a href="${answerLinkA}" style="display:block;background:#ffffff;border:1px solid #d9e6a5;border-radius:18px;color:#252525;font-size:16px;font-weight:700;line-height:1.6;padding:16px 18px;text-decoration:none;">A. ${choiceA}</a>
            <a href="${answerLinkB}" style="display:block;background:#ffffff;border:1px solid #d9e6a5;border-radius:18px;color:#252525;font-size:16px;font-weight:700;line-height:1.6;padding:16px 18px;text-decoration:none;">B. ${choiceB}</a>
            <a href="${answerLinkC}" style="display:block;background:#ffffff;border:1px solid #d9e6a5;border-radius:18px;color:#252525;font-size:16px;font-weight:700;line-height:1.6;padding:16px 18px;text-decoration:none;">C. ${choiceC}</a>
            <a href="${answerLinkD}" style="display:block;background:#ffffff;border:1px solid #d9e6a5;border-radius:18px;color:#252525;font-size:16px;font-weight:700;line-height:1.6;padding:16px 18px;text-decoration:none;">D. ${choiceD}</a>
          </div>
        </div>
        <p style="margin:28px 0 0;">
          <a
            href="${questionLink}"
            style="display:inline-block;background:#252525;border-radius:999px;color:#ffffff;font-size:16px;font-weight:700;padding:14px 22px;text-decoration:none;"
          >
            問題ページを開く
          </a>
        </p>
        <p style="margin:16px 0 0;font-size:14px;line-height:1.8;color:#7d7d78;">
          学習履歴を見たいときは、ダッシュボードも確認できます。
          <a href="${dashboardLink}" style="color:#44a800;"> ダッシュボードを見る</a>
        </p>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#7d7d78;">
          ボタンが開けない場合は、次のURLをブラウザに貼り付けてください。
        </p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.8;word-break:break-all;">
          <a href="${questionLink}" style="color:#44a800;">${questionLink}</a>
        </p>
      </div>
    </div>
  `;
}

function buildDailyQuestionEmailText(input: {
  questionLink: string;
  questionPrompt: string;
  category: string;
  categorySub?: string | null;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  answerLinkA: string;
  answerLinkB: string;
  answerLinkC: string;
  answerLinkD: string;
  name?: string | null;
}) {
  const greeting = input.name?.trim() ? `${input.name}さん` : "こんにちは";

  return `${greeting}

今日の1問をお届けします。

カテゴリ: ${input.category}${input.categorySub?.trim() ? ` / ${input.categorySub.trim()}` : ""}

問題:
${input.questionPrompt}

A. ${input.choiceA}
${input.answerLinkA}

B. ${input.choiceB}
${input.answerLinkB}

C. ${input.choiceC}
${input.answerLinkC}

D. ${input.choiceD}
${input.answerLinkD}

回答はこちら:
${input.questionLink}`;
}

export async function sendMagicLinkEmail(input: {
  to: string;
  magicLink: string;
  name?: string | null;
}) {
  const resend = getResendClient();
  const from = getMailFrom();

  const { error } = await resend.emails.send({
    from,
    to: [input.to],
    subject: "Budledge ログインリンク",
    html: buildEmailHtml(input),
    text: buildEmailText(input),
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}

export async function sendDailyQuestionEmail(input: {
  to: string;
  questionLink: string;
  questionPrompt: string;
  category: string;
  categorySub?: string | null;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  answerLinkA: string;
  answerLinkB: string;
  answerLinkC: string;
  answerLinkD: string;
  name?: string | null;
}) {
  const resend = getResendClient();
  const from = getMailFrom();

  const { error } = await resend.emails.send({
    from,
    to: [input.to],
    subject: "Budledge 今日の1問",
    html: buildDailyQuestionEmailHtml(input),
    text: buildDailyQuestionEmailText(input),
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
