# Daily Study App API

## 1. Get Daily Question

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
  "choice_d": "Rome"
}
```

## 2. Submit Answer

Submit the user's answer.

### Endpoint

POST /api/answer

### Request

```json
{
  "question_id": "uuid",
  "selected_choice": "A"
}
```

### Response

```json
{
  "correct": true,
  "correct_choice": "A",
  "explanation": "Paris is the capital of France."
}
```

### 3. Get Challenge Question

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
  "choice_d": "Rome"
}
```

## 4. Get Dashboard Stats

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
  "answeredDates": [
    {
      "date": "2026-03-15",
      "count": 3
    }
  ]
}
```
