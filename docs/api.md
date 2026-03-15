# Daily Study App API

## 1. Get Daily Question

Return today's question for the user.

### Endpoint

GET /api/question/daily

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

### Get Challenge Question

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