# Implementation Decisions Log

## 2026-01-08: Technology Choices Confirmed

The following decisions were made to resolve ambiguities in PLAN.md:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | **SQLite** | Simpler for single-VPS deployment, low user count |
| Backend Runtime | **Node.js** | Will use express-session for sessions |
| Frontend | **React** | SPA approach, placed in /src/web |
| Metric Calculation | **SQL View** | No external scheduler needed, simpler than cron |
| SMTP/Email | **Skipped** | Not implementing password reset for v1 |

### Risk Acknowledgment (SQLite + Docker)

Per PLAN_RISKS.md, SQLite in Docker containers can lose data on restart. Mitigation:
- Use a **persistent volume** mount for the SQLite file
- Ensure Docker Compose maps `/data` to a host directory
