# Budledge App

This directory contains the Next.js application for Budledge.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure local environment variables in `app/.env.local`:
   Use a dedicated development database here, not the production database.

```env
DATABASE_URL="postgresql://..."
APP_BASE_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
MAIL_FROM="Budledge <noreply@mail.budledge.dev>"
CRON_SECRET="your-shared-secret"
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Daily Email Delivery

- The daily email cron endpoint is `GET /api/cron/daily-question`.
- Vercel Cron should trigger it every day at `05:00 JST` (`20:00 UTC`).
- The request must include `Authorization: Bearer <CRON_SECRET>`.
- Only users with `email_verified_at` set receive the daily question email.

For manual resend or testing:

```bash
curl -i \
  -H "Authorization: Bearer <CRON_SECRET>" \
  "https://budledge.dev/api/cron/daily-question?force_resend=true"
```

## Production Notes

- Set `APP_BASE_URL` to `https://budledge.dev` in production.
- Set a production-only `DATABASE_URL` plus `APP_BASE_URL`, `RESEND_API_KEY`, `MAIL_FROM`, and `CRON_SECRET` in Vercel.
- If `CRON_SECRET` is missing, scheduled delivery can fail before any `DailyDelivery` rows are created.

## Related Docs

- Root overview: [`../README.md`](../README.md)
- Deployment guide: [`../docs/deployment.md`](../docs/deployment.md)
