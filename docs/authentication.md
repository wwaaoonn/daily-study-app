# Authentication Design

This document describes the proposed design for simple email-link authentication.

## Overview

- Authentication method: magic link by email
- Session storage: database-backed session table
- Token storage: one-time verification token table
- Existing learning data tables remain the same and continue to reference `User`

## Proposed Prisma Schema

```prisma
model User {
  id                String          @id @default(uuid())
  email             String          @unique
  name              String?
  email_verified_at DateTime?
  created_at        DateTime        @default(now())
  answers           Answer[]
  daily_deliveries  DailyDelivery[]
  sessions          Session[]
}

model Session {
  id            String   @id @default(uuid())
  user_id       String
  session_token String   @unique
  expires_at    DateTime
  created_at    DateTime @default(now())

  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
}

model VerificationToken {
  id         String   @id @default(uuid())
  identifier String
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())

  @@index([identifier])
}
```

## Database Changes

Yes. Supabase tables also need to be updated because Supabase is the actual PostgreSQL database used by the app.

Recommended process:

1. Update `app/app/prisma/schema.prisma`
2. Create a Prisma migration locally
3. Review the generated SQL
4. Apply the migration to Supabase
5. Replace the current guest user fallback with authenticated user lookup

Do not edit Supabase tables manually if Prisma is the source of truth.

## Implementation Order

1. Extend the Prisma schema with `Session`, `VerificationToken`, `name`, and `email_verified_at`
2. Generate and apply the migration to local DB and Supabase
3. Add auth helper functions:
   - create verification token
   - verify token
   - create session
   - get current session user
   - sign out
4. Add auth APIs:
   - `POST /api/auth/request-link`
   - `GET /api/auth/verify`
   - `GET /api/auth/session`
   - `POST /api/auth/signout`
5. Add auth UI:
   - email input page
   - sign-in confirmation message
   - sign-out action
6. Replace `getDefaultUser()` usage in answer submission and dashboard aggregation
7. Protect routes that require login
8. Update email sending so the login link and daily question flow work together

## Existing Code Impact

These files will need to stop depending on the guest account model:

- `app/app/lib/default-user.ts`
- `app/app/api/answer/route.ts`
- `app/app/lib/dashboard.ts`

## Notes

- `VerificationToken.identifier` should store the email address
- `Session.session_token` should be stored in an HTTP-only cookie
- `email_verified_at` can be set when the magic link is successfully consumed
- `email` is the unique key for `User`, so signing in with the same email reuses the same learning history
- during development and QA, use separate email addresses if you want to verify a clean dashboard state
