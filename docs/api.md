# Daily Study App API

## 1. Request Magic Link

Send a sign-in email to the user.

### Endpoint

POST /api/auth/request-link

### Request

```json
{
  "email": "user@example.com",
  "name": "Bob"
}
```

### Response

```json
{
  "ok": true
}
```

## 2. Verify Magic Link

Verify the one-time token and create a session.

### Endpoint

GET /api/auth/verify?token=...

### Response

Redirect to the app top page after the session cookie is set.

If `next=/some/path` is included, the user is redirected there after sign-in.

## 3. Get Current Session

Return the current signed-in user.

### Endpoint

GET /api/auth/session

### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Bob"
  }
}
```

## 4. Sign Out

Delete the current session.

### Endpoint

POST /api/auth/signout

### Response

```json
{
  "ok": true
}
```

## 5. Get Daily Question

Return the daily question. The same date always returns the same question.

### Endpoint

GET /api/question/daily

The question is fixed per date based on the Asia/Tokyo calendar day.

### Response

```json
{
  "question_id": "uuid",
  "prompt": "What is the capital of France?",
  "choice_a": "Paris",
  "choice_b": "London",
  "choice_c": "Berlin",
  "choice_d": "Rome",
  "category": "TOEIC",
  "category_sub": "前置詞"
}
```

## 6. Submit Answer

Submit the user's answer.

### Endpoint

POST /api/answer

### Request

```json
{
  "question_id": "uuid",
  "selected_choice": "A",
  "question_mode": "daily"
}
```

`question_mode` is optional and is used for answer-source tracing (`daily` or `challenge`).

### Response

```json
{
  "correct": true,
  "correct_choice": "A",
  "explanation": "Paris is the capital of France."
}
```

### 7. Get Challenge Question

Return a random question.

### Endpoint

GET /api/question/challenge

### Query Parameters

- `exclude_question_id` (optional): Exclude the currently displayed question from the random selection.

### Response

Same as daily question.

If `exclude_question_id` is provided and another question exists, the API returns a different question.

```json
{
  "question_id": "uuid",
  "prompt": "What is the capital of France?",
  "choice_a": "Paris",
  "choice_b": "London",
  "choice_c": "Berlin",
  "choice_d": "Rome",
  "category": "TOEIC",
  "category_sub": "前置詞"
}
```

## 8. Get Dashboard Stats

Return the current user's learning dashboard summary.

### Endpoint

GET /api/dashboard

### Response

```json
{
  "totalAttempts": 42,
  "correctAttempts": 31,
  "correctRate": 73.8,
  "activeDays": 12,
  "currentStreak": 4,
  "longestStreak": 6,
  "recentAttempts": 11,
  "categoryBreakdown": [
    {
      "category": "Vocabulary",
      "attempts": 20,
      "correctAttempts": 16,
      "correctRate": 80,
      "share": 47.6
    }
  ],
  "subcategoryBreakdown": [
    {
      "category": "前置詞",
      "parentCategory": "TOEIC",
      "attempts": 12,
      "correctAttempts": 9,
      "correctRate": 75,
      "share": 28.6
    }
  ],
  "answeredDates": [
    {
      "date": "2026-03-15",
      "count": 3
    }
  ]
}
```

## 9. Trigger Daily Question Emails

Send the daily question email to all verified users.

### Endpoint

GET /api/cron/daily-question

Optional query parameters:

- `question_id`: send a specific question instead of the JST daily question
- `force_resend=true`: resend even if today's `DailyDelivery` is already marked as `sent`

### Headers

`Authorization: Bearer <CRON_SECRET>`

### Response

```json
{
  "ok": true,
  "questionId": "uuid",
  "attemptedCount": 12,
  "sentCount": 10,
  "skippedCount": 2,
  "failureCount": 0,
  "failures": []
}
```

## 10. Submit Answer From Email

Consume a single-use email answer link, create a session, save the answer, and redirect to the result page.

### Endpoint

GET /api/email-answer?token=...&choice=A

### Query Parameters

- `token`: single-use answer token embedded in the daily email
- `choice`: one of `A`, `B`, `C`, `D`

### Behavior

- On first use, the token is consumed, the answer is saved, and the user is redirected to `/?question_id=...&answer_id=...`
- If the same token is opened again later, the user is redirected with `email_answer_error=invalid-link`
