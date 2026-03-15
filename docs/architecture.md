# System Architecture

This diagram shows the high-level architecture of the Daily Study App.

```mermaid
flowchart TD

User["User"] -->|opens email link| WebApp["Web Application (Next.js)"]

Scheduler["Daily Scheduler (Cron Job)"] -->|trigger daily question| API["Backend API"]

API -->|send email| EmailService["Email Service"]

EmailService -->|deliver email| User

WebApp -->|submit answer| API

API -->|read/write data| Database["Database (PostgreSQL)"]

