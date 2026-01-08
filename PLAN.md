
## 1. High-Level Overview

The system is a **Classic Three-Tier Monolith**. It consists of a single server-side application (Client + API in one deployment unit) communicating with a relational database. To keep costs low and deployment simple, the application is designed to run on a single Virtual Private Server (VPS) using a reverse proxy for SSL.

## 2. Core User Flows

* **Onboarding & Auth:** User registers/logs in via traditional email/password -> Session cookie established via server-side session management.
* **Daily Planning:** User creates, updates, or completes tasks -> Synchronous DB update -> Immediate UI refresh.
* **Dedication Tracking:** Background routine or scheduled query calculates monthly metrics (e.g., completion rates) -> Stored in a summary table for fast retrieval.

## 3. System Architecture (Components + Responsibilities)

| Component | Responsibility |
| --- | --- |
| **Reverse Proxy (Nginx/Caddy)** | SSL termination (Let's Encrypt), static file serving, and request forwarding. |
| **Monolithic App Server** | Handles routing, business logic, server-side rendering (or API), and authentication logic. |
| **Relational Database** | Persistent storage for users, tasks, and monthly metrics. |
| **Local Filesystem** | Storage for application logs and simple file-based backups. |

## 4. Folder Structure

A unified structure within a single repository to minimize context switching.

```text
/root
  /src
    /common          - Shared types and utility functions
    /server          - API routes, controllers, and business logic
    /web             - Frontend assets (React/Vue/Svelte) or Templates
    /db              - Migrations and seed data
  /scripts           - Deployment and backup scripts
  /tests             - Integration and unit tests
  docker-compose.yml - Local development and production orchestration

```

## 5. Data Models (Conceptual)

* **User:** ID, Email, Password Hash, Created_At.
* **Task:** ID, User_ID (FK), Title, Status (Todo/Done), Due_Date, Completed_At.
* **DedicationMetric:** ID, User_ID (FK), Month_Year, Completion_Rate, Total_Tasks, Streak_Days.

## 6. API Contracts (Conceptual)

Designed as simple RESTful endpoints.

* **Auth:** `POST /auth/login` (Session-based).
* **Tasks:** * `GET /tasks?date=YYYY-MM-DD` - Retrieve day's plan.
* `POST /tasks` - Add new task.
* `PUT /tasks/:id` - Toggle completion status.


* **Metrics:** `GET /metrics/monthly` - Retrieve dedication stats.

> **Ref:** [Standard HTTP Status Codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## 7. Authentication & Authorization Approach

* **Authentication:** **Server-Side Sessions.** Use a proven library (e.g., `express-session` for Node or `Flask-Login` for Python) with a secure, HTTP-only cookie.
* **Password Security:** Passwords hashed using **Argon2** or **bcrypt** before storage.
* **Authorization:** Simple ownership check. Every DB query includes a `WHERE user_id = current_session_user_id` clause.

## 8. External Integrations

* **Database:** **PostgreSQL** or **SQLite** (if using a persistent volume).
* **Email (Optional):** Simple SMTP relay for password resets (e.g., Mailgun or Postmark).
* **Backups:** Daily cron job to dump the database and upload it to an S3-compatible bucket (e.g., Cloudflare R2 or Backblaze B2) for low-cost durability.

## 9. Step-by-Step Execution Plan

1. **Local Development:** Build the Monolith with a local Docker-Compose setup (App + DB).
2. **Database Schema:** Initialize migrations for Users and Tasks; implement "Monthly Dedication" logic as a SQL View or a simple scheduled function.
3. **Auth Implementation:** Build the login/signup flow using session cookies.
4. **Core Feature Build:** Implement CRUD for daily tasks and the metrics dashboard.
5. **VPS Deployment:** * Provision a $5–$10/mo VPS (Ubuntu).
* Set up **Nginx/Caddy** for SSL.
* Deploy the app via Git or a simple Docker image.


6. **Automated Backups:** Configure a daily cron job to back up the database to off-site storage.

