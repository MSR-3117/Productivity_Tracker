# Assumptions & Constraints

Project Name: Daily Planner & Dedication Tracker
Created On: 2026-01-08
Last Reviewed: 2026-01-08

## Product Scope
- Product type: Personal productivity web application
- Primary users: Individual users tracking daily tasks, habits, and consistency
- Expected user count (12 months): 1,000 – 10,000 users

## Core Problem Being Solved
- Users want to:
  - Plan daily tasks
  - Mark completion via checkboxes
  - Track consistency over days and months
  - Understand how dedicated they are over time (effort score)

## Data Sensitivity
- Data classification: Medium
- Personal data stored: Yes (name, email, usage data)
- Financial data stored: No

## Compliance & Legal
- Required compliance: GDPR (basic compliance assumed)
- Data residency requirements: No strict regional requirement

## Availability & Performance
- Target availability: 99.0%
- Acceptable latency (p95): < 300ms for core interactions
- Acceptable downtime per month: < 7 hours

## Functional Assumptions (Core Features)
- Users can:
  - Create daily tasks
  - Mark tasks as completed using checkboxes
  - Edit or delete tasks
  - View daily, weekly, and monthly summaries
- Each task completion contributes to an “effort score”
- Effort score is aggregated:
  - Daily
  - Weekly
  - Monthly
- Users can see:
  - Total tasks planned vs completed
  - Percentage consistency per month
  - Streaks (consecutive days of completion)

## Dedication Measurement Assumptions
- Dedication is measured by:
  - Number of tasks completed
  - Consistency over time
  - Missed vs planned tasks
- Dedication score is:
  - Informational only
  - Not used for ranking users against each other
- Scores reset or decay monthly to encourage fresh consistency

## Data Storage Assumptions
- A database is required to store:
  - Users
  - Tasks
  - Task completion status
  - Daily effort metrics
  - Monthly summaries
- Data must persist across sessions and devices
- Soft deletes preferred over hard deletes for tasks

## Technical Constraints
- Cloud provider preference: None (cloud-agnostic)
- Budget constraints: Low (cost-efficient infrastructure preferred)
- Must use existing systems: None

## Security Assumptions
- Authentication required (email/password or equivalent)
- Each user can only access their own data
- No social or shared task features in initial version

## Non-Goals (Explicitly Out of Scope)
- No team collaboration
- No social feeds or public profiles
- No AI-generated task suggestions (initial version)
- No financial or payment features
- No mobile app (web-first approach)

## Future-Friendly Assumptions (Not Immediate Requirements)
- The system should allow:
  - Adding reminders later
  - Exporting data (CSV / PDF)
  - Basic analytics improvements