# Daily Study App

![Daily Study App screenshot](docs/images/app-top.png)

An app that helps users study something every day through a daily email challenge.

[https://daily-study-app-teal.vercel.app](https://daily-study-app-teal.vercel.app)

## Concept

Users receive a daily question by email.
They answer the question through a web interface and can challenge more questions.

## Features (MVP)

- Daily question email
- Multiple choice answers
- Explanation after answering
- Challenge more questions
- Learning progress dashboard

## Current dashboard metrics

- Total attempts
- Correct rate
- Category mix
- Current streak / longest streak
- Answer activity calendar

## Tech Stack (planned)

- Next.js
- TypeScript
- Supabase (PostgreSQL)
- Vercel
- Email API

## Environment Variables

Set these in `app/.env.local` for local development and in your hosting platform for production.

```env
DATABASE_URL="postgresql://..."
APP_BASE_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
MAIL_FROM="Budledge <noreply@mail.budledge.dev>"
```

For production, set `APP_BASE_URL` to `https://budledge.dev`.

## Authentication Behavior

- The app uses email-link authentication.
- `User.email` is treated as the unique account key.
- Signing in with the same email address resumes the same learning history and dashboard data.
- For testing a clean first-time experience, use a different email address from existing test accounts.
