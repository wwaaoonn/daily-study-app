# System Architecture

```mermaid
flowchart TD

User --> Email

Email --> WebApp

WebApp --> API

API --> Database

Scheduler --> Email
