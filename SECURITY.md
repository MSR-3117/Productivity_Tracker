1. Authentication & Session Management
To prevent session hijacking and unauthorized access, the following controls must be implemented at the application level:

Session Mechanism: Utilize server-side sessions stored in-memory or a local store, rather than client-side JWTs, to ensure immediate revocation capability.

Secure Cookie Attributes: Session cookies must be configured with HttpOnly (preventing XSS access), Secure (ensuring HTTPS-only transmission), and SameSite: Strict (mitigating CSRF attacks).

Session Expiry: Implement absolute timeouts (e.g., 30 days) and idle timeouts to limit the window of opportunity for stolen session tokens.

2. Authorization Rules
The system follows a strict "Single-User Privacy" model:

Ownership Enforcement: Every database query must include a mandatory WHERE user_id = current_session_user_id clause to prevent Insecure Direct Object Reference (IDOR) vulnerabilities.

No Multi-Tenancy Logic: Since there are no team or social features, any request lacking a valid user_id context should default to a 403 Forbidden response.

3. Password Handling
Given the "Medium" data sensitivity and the presence of personal data (email):

Hashing Algorithm: Passwords must never be stored in plain text. They must be hashed using Argon2id (preferred) or bcrypt with a minimum work factor (cost) of 10.

Validation: Implement basic password strength requirements (minimum 8 characters) to prevent trivial brute-force attacks.

Rate Limiting: Protect the /auth/login endpoint with simple IP-based rate limiting to thwart automated credential stuffing.

4. Data Protection (At Rest & In Transit)
In Transit: All traffic must be encrypted via TLS 1.2+. This is handled by the Nginx/Caddy reverse proxy using automated Let's Encrypt certificates.

At Rest: While full disk encryption on a budget VPS is often out of the developer's control, database backups must be encrypted before being uploaded to off-site S3-compatible storage.

Database Access: The database should be configured to listen only on localhost (127.0.0.1) or be restricted via a firewall (UFW) to prevent external connections.

5. OWASP Top 10 Risks Relevant to This App
A01:2021-Broken Access Control: Highest risk. Mitigated by strict user-level data isolation in SQL queries.

A03:2021-Injection: Mitigated by using an ORM or parameterized queries for all database interactions (no string concatenation in SQL).

A07:2021-Identification and Authentication Failures: Mitigated by secure session management and Argon2 password hashing.

6. Backup & Recovery Considerations
Encryption: Database dumps must be encrypted (e.g., using GPG or a similar tool) before transit to S3.

Access Control: Use "Write-Only" or "Object Lock" S3 buckets if possible. Use a dedicated IAM user with the least privilege (only s3:PutObject permissions) for the cron job.

Recovery Testing: Once per quarter, the developer should perform a manual restore of a backup to a local environment to ensure the backup is not corrupted.

7. Operational Security
Environment Variables: Secrets (DB credentials, SMTP keys, Session secrets) must be stored in a .env file that is excluded from Git version control.

Logging: Avoid logging sensitive information, such as plain-text passwords or session IDs. Application logs should be rotated to prevent disk exhaustion on the $5 VPS.

Host Hardening: * Disable SSH password authentication; use SSH keys only.

Enable a basic firewall (UFW) allowing only ports 80 and 443.

Enable "Unattended Upgrades" for critical security patches on the Ubuntu host.