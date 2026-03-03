## Intentionally Insecure Node.js Training Lab

This repository contains a **sandboxed, intentionally vulnerable Node.js web application** for internal security testing, proof-of-concept (POC) demonstrations, and hands-on training.

> **Warning:** This lab is intentionally insecure. It must never be exposed to the public internet or used in production.

### Tech Stack

- **Runtime**: Node.js LTS (recommended 20.x)
- **Web framework**: Express
- **Templates**: EJS
- **Database**: SQLite (via `better-sqlite3`)
- **Sessions**: `express-session` (insecure settings in lab mode)
- **Uploads**: `multer`
- **Legacy dependency**: `moment` (intentionally included to trigger SCA and remediation discussion)

All data and logs are stored under `./data`:

- SQLite DB: `./data/app.db`
- Uploads: `./data/uploads`
- Sandbox files: `./data/sandbox`
- Logs: `./data/logs`

---

## Features & Modules

- **Authentication**
  - Login page with session-based auth
  - Weak password policy (plaintext storage) for training
  - Seeded users: `alice`, `bob`, `admin`
  - Lab-only insecure login branch for bypass training

- **Dashboard**
  - Internal-style portal with widgets:
    - Recent tickets
    - Internal messages
    - Upload summary
    - Audit log snippets

- **Ticketing / Admin Review**
  - Public support ticket submission
  - Admin review console
  - **Blind XSS** training scenario with a simulated review bot

- **Search / Reporting**
  - Customer search module
  - **Blind SQL injection-style** scenario with timing and result-based signals

- **File Center**
  - File upload and metadata browsing
  - Weak validation and predictable paths (simulated only)
  - **Sandboxed file preview** under `./data/sandbox`
  - Simulated RCE via log entries (`SIMULATED_RCE_TRIGGERED`)

- **Settings / Internal Notes**
  - Internal notes editor
  - Stored XSS example
  - Missing CSRF on one form
  - IDOR-style access to notes

- **Dependency Demo**
  - Page that renders time using `moment.js`
  - Used for dependency risk and SCA discussion

- **Debug / Training**
  - `/debug/config` route (lab-only) surfaces environment-style info and demo secrets
  - `/training` route summarizes modules and learning objectives

Every page includes:

- Current user display
- A red banner: `INTENTIONALLY INSECURE TRAINING LAB`

---

## Safety Controls

This lab is designed to be **dangerous in behavior but safe in scope**:

- The app **refuses to start** unless `LAB_MODE=true`.
- By default, it binds only to `127.0.0.1`.
- To allow remote access (e.g., over a private VPN), all of the following must be set:
  - `ALLOW_REMOTE=true`
  - `I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB=yes`
  - `HOST`/`PORT` as appropriate
- All file reads for LFI/path traversal training are restricted to `./data/sandbox`.
- Uploads are stored under `./data/uploads`; no uploaded content is ever executed.
- “RCE” is **simulated** by writing log entries such as `SIMULATED_RCE_TRIGGERED` instead of invoking the OS.
- Verbose stack traces are shown only because the lab enforces `LAB_MODE=true` at startup.

---

## Environment Variables

Create a `.env` file (or export variables) based on `.env.example`:

```bash
PORT=3000
HOST=127.0.0.1
LAB_MODE=true
ALLOW_REMOTE=false
I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB=no
SESSION_SECRET=change-me
DB_PATH=./data/app.db
```

**Important:**

- `LAB_MODE` must be `true` or the app will exit on startup.
- `ALLOW_REMOTE` should remain `false` unless you are intentionally exposing the lab on a private network.
- `I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB` must be `yes` when `ALLOW_REMOTE=true`, otherwise startup is refused.

---

## Setup on Ubuntu (Tiny VM)

Target environment:

- Ubuntu (or similar Linux)
- 1 vCPU
- 1 GB RAM
- 20 GB disk

### 1. Install Node.js LTS

On Ubuntu (example using NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify:

```bash
node -v   # should show an LTS version (e.g., v20.x)
npm -v
```

### 2. Clone / copy the lab

```bash
cd /opt
git clone <your-internal-repo-url> vulnerable-nodejs-web
cd vulnerable-nodejs-web
```

Or copy the project files into `/opt/vulnerable-nodejs-web`.

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
```

Adjust `.env` as needed, but keep:

- `LAB_MODE=true`
- `HOST=127.0.0.1` (default)

### 5. Seed the database

```bash
npm run seed
```

This will create:

- `./data/app.db` (SQLite database)
- `./data/sandbox` with sample files:
  - `config/dev-note.txt`
  - `exports/finance.csv` plus additional fake finance files
  - `logs/old-app.log`
  - `secrets/demo-config.txt`

### 6. Start the lab

Using npm:

```bash
npm start
```

Or using the helper script:

```bash
chmod +x start-lab.sh
./start-lab.sh
```

The lab will start on `http://127.0.0.1:3000` by default.

To access it from your workstation via SSH port forwarding:

```bash
ssh -L 3000:127.0.0.1:3000 user@your-vm
```

Then open `http://127.0.0.1:3000` in your local browser.

---

## Resetting the Lab

Use the reset script to return to a clean state:

```bash
chmod +x reset-lab.sh
./reset-lab.sh
```

This will:

- Remove `./data/app.db` and recreate it via the seed script.
- Clear `./data/logs` and `./data/uploads`.
- Reseed:
  - 25 customer records
  - 12 support tickets
  - 10 internal notes
  - 8 upload records
  - 20 audit log entries
  - Sandbox files under `./data/sandbox`

---

## Default Users

Seeded in the database (plaintext passwords for training):

- `alice` / `password1`
- `bob` / `Password123`
- `admin` / `admin123`

These credentials are **not** safe and must never be used outside this lab.

---

## Logging

Application logs live at:

- `./data/logs/app.log`

This log records:

- Login attempts and logouts
- Ticket creation and admin review actions
- Upload processing and simulated exploitation (`SIMULATED_RCE_TRIGGERED`)
- Search activity and bot review runs
- Reset actions (via the seed/reset flow)

Additional audit events are stored in the `audit_log` table inside `./data/app.db`.

---

## Running with systemd (optional)

A sample `lab.service` unit is provided. Adjust `WorkingDirectory` and paths as needed:

```bash
sudo cp lab.service /etc/systemd/system/lab.service
sudo systemctl daemon-reload
sudo systemctl enable lab
sudo systemctl start lab
```

This unit binds the app to `127.0.0.1` and enforces `LAB_MODE=true`.

---

## Simulated vs. Real Risk

This lab is designed so that **dangerous outcomes are simulated**:

- **RCE**: The upload processor never runs shell commands. Instead, it logs entries like `SIMULATED_RCE_TRIGGERED` and shows a banner in the UI.
- **LFI / Path Traversal**: File preview is restricted to `./data/sandbox` and blocked from traversing outside that directory.
- **Credentials / Secrets**: All secrets are fake and clearly marked as demo values.
- **Stack Traces**: Verbose error pages are enabled only because `LAB_MODE=true` is required; they must never be used in production.

However, within the confines of the lab:

- Many patterns mirror real-world vulnerabilities.
- Exploitation can change lab data (tickets, notes, uploads), which is expected and part of training.

---

## Documentation for Trainers & Remediation

- **Trainer guide**: `docs/trainer-guide.md`
  - Suggested scenarios, discussion prompts, and reset guidance.
- **Remediation guide**: `docs/remediation-guide.md`
  - Summary of intentional flaws, secure counterparts, and remediation directions.

These documents avoid listing exact exploit strings, focusing instead on patterns and defenses.

---

## Do Not Expose Publicly

- Run this lab only on **sandboxed hosts** and **internal networks**.
- Keep the default bind of `127.0.0.1` unless you are explicitly using a secure tunnel (VPN, SSH port forwarding, etc.).
- Never point this application directly at the public internet or production data sources.

By using this lab, you acknowledge that it is **intentionally insecure** and agree to operate it only in controlled, authorized environments.

