## Trainer Guide

This intentionally insecure Node.js lab is designed for internal security testing, proof-of-concept demos, and training. It must **never** be exposed to the public internet.

### Session Ideas

- **Authentication deep-dive**
  - Walk through the login flow and highlight weak password policy, plaintext storage, lack of rate limiting, and the lab-only insecure login branch.
  - Facilitate discussion on how small code branches (like the `fastPath` example) can undermine otherwise sound auth checks.

- **Blind XSS scenario**
  - Have trainees submit tickets using `/tickets/submit` with various payloads.
  - Use the admin review page and `/bot/review-tickets` simulator to reason about when and where the payload would execute.
  - Debrief using log entries from `data/logs/app.log` and the `audit_log` table.

- **Blind SQLi-style search**
  - Explore `/search` and compare behavior with different inputs and the optional artificial delay.
  - Encourage trainees to reason about indirect indicators (row counts, delays, error behavior) without disclosing payload examples.

- **File center and sandbox**
  - Upload a variety of file types and observe how the mock processor behaves.
  - Use `/files/sandbox-preview` to discuss path traversal concepts while staying confined to `./data/sandbox`.

- **Internal notes and CSRF**
  - Demonstrate how stored XSS and missing CSRF protection in `/settings` can be discovered through code review and behavior.
  - Discuss remediation techniques such as CSRF tokens and output encoding.

- **Dependency demo**
  - Use `/dependencies` to talk through legacy libraries (moment.js), software composition analysis (SCA), and upgrade planning.

### Facilitation Tips

- Emphasize that **all dangerous behavior is simulated**:
  - “RCE” is represented by log entries like `SIMULATED_RCE_TRIGGERED`.
  - File reads are restricted to `./data/sandbox`.
  - The app refuses to start unless `LAB_MODE=true`.

- Encourage structured reporting:
  - Ask trainees to document each finding with:
    - Affected route / feature
    - Impact and likelihood (within lab)
    - Suggested remediation
  - Use `docs/remediation-guide.md` as a reference for expected remediation directions.

- Vary difficulty:
  - For beginners, focus on obvious patterns (unescaped HTML, string-concatenated SQL).
  - For advanced learners, encourage more subtle explorations (auth bypass scenarios, indirect timing signals, debug surface mapping).

### Resetting Between Exercises

- Use `reset-lab.sh` to:
  - Clear the SQLite database and reseed dummy data.
  - Clear logs and uploads.
  - Ensure that every cohort starts from a known, reproducible baseline.

### Safety Reminders

- Run the lab only on sandboxed hosts.
- Default bind address must remain `127.0.0.1` unless a trainer explicitly and knowingly overrides it with:
  - `ALLOW_REMOTE=true`
  - `I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB=yes`
- Reinforce that techniques learned here must be applied ethically and only with proper authorization.

