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

### Response

Same as daily question.

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
