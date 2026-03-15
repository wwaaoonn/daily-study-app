import { Resend } from "resend";

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

function buildEmailHtml(input: { magicLink: string; name?: string | null }) {
  const greeting = input.name?.trim() ? `${input.name}さん` : "こんにちは";

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
            href="${input.magicLink}"
            style="display:inline-block;background:#252525;border-radius:999px;color:#ffffff;font-size:16px;font-weight:700;padding:14px 22px;text-decoration:none;"
          >
            Budledge にログイン
          </a>
        </p>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#7d7d78;">
          ボタンが開けない場合は、次のURLをブラウザに貼り付けてください。
        </p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.8;word-break:break-all;">
          <a href="${input.magicLink}" style="color:#44a800;">${input.magicLink}</a>
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
