1. Architectural Risks

Single Point of Failure (SPOF): Running the app and database on a single VPS means a hardware failure or disk corruption results in total downtime. While backups exist, recovery is manual and slow.

Database Lock-in (SQLite-specific): If SQLite is chosen without a persistent volume strategy or Litestream, the database will be wiped on every Docker container restart/deployment.

Metric Calculation Lag: Relying on a "background routine" for a single-developer project adds complexity (requires a scheduler like Cron or Celery). If not managed, failed background jobs could lead to stale dedication metrics without the user knowing.

2. Security Risks

Session Hijacking: While using HttpOnly cookies is planned, without SameSite: Strict and Secure flags explicitly enforced in the plan, the app is vulnerable to CSRF and sniffing.

Insecure Backups: The plan mentions a cron job to dump the DB to S3. If the S3 credentials on the VPS are compromised, the attacker has the entire user database, including hashed passwords and private planner data.

Host Security: Using a basic Ubuntu VPS places the burden of OS hardening (SSH keys, firewall, unattended upgrades) entirely on the solo developer.

3. Scaling Limitations

Vertical Ceiling: The 1k–10k user range is fine for a VPS, but if the "Monthly Dedication" query is complex and runs against the live Tasks table for every user, DB I/O will spike, causing latency for all active users.

Disk Space: 10,000 users generating daily tasks will grow the DB size quickly. A $5/mo VPS typically has limited NVMe/SSD space (20–25GB), which could be exhausted by logs and DB growth within the first year.

4. Future Pain Points

Migration Complexity: Transitioning from a single-user model to any shared/collaboration feature later will require a complete rewrite of the "Ownership Check" logic currently planned for every query.

Lack of Telemetry: With no monitoring or error tracking mentioned, the developer will only know the system is down if a user reports it or they manually check logs on the VPS.

Deployment Friction: Using "Git pull" or manual Docker commands on a VPS often leads to "configuration drift," where the server state no longer matches the local repository.

5. Alignment with ASSUMPTIONS.md

Metric Goal: The plan aligns well with "Monthly dedication metrics" by proposing a dedicated summary table for fast retrieval, preventing expensive recalculations.

Budget & Simplicity: The plan strictly respects the "Low budget" and "Solo developer" constraints by removing expensive enterprise components like API Gateways and Managed IdPs.

Data Model: The model is appropriately lean for a daily planner, sticking to essential relational links.