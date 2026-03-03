## Remediation Guide

This document summarizes intentional weaknesses in the lab and outlines secure counterparts. It is intended as a reference for debriefs and remediation planning.

| Area | Vulnerability (Lab) | Secure Counterpart (Direction Only) |
| ---- | ------------------- | ------------------------------------ |
| Authentication | Plaintext passwords, weak policy, verbose login errors, no rate limiting, insecure `lab-insecure-login` branch | Hash passwords (e.g., bcrypt/Argon2), enforce strong password policy, implement rate limiting, use generic error messages, remove alternate auth branches and validate credentials centrally. |
| Dashboard | Aggregated data without strict access control checks beyond session presence | Add per-widget authorization checks and limit sensitive data exposure based on least privilege. |
| Ticketing / Blind XSS | Raw ticket content stored and rendered unescaped in admin view | Validate and store untrusted input safely, and always HTML-encode on output; consider rich-text sanitizers where formatting is required. |
| XSS Review Bot | Naive pattern matching for scripts and events | Use robust content security policies (CSP), output encoding, and safe templating instead of trying to detect malicious HTML post-hoc. |
| Search / Blind SQLi | Concatenated SQL with user input and optional artificial delay | Use parameterized queries, validate/whitelist query parameters, and avoid data-dependent delays. |
| Login Bypass | Alternate branch trusting username with limited or no password checks | Ensure all authentication flows share a single, audited pathway that always performs credential and context checks. |
| File Uploads | Trusting MIME type and extension, predictable filenames, weak path normalization | Use strong random filenames, strict extension and content-type allowlists, virus/malware scanning, and isolate uploads on a non-executable volume. |
| Simulated RCE | Log-only `SIMULATED_RCE_TRIGGERED` behavior | In real systems, treat such detections as high-severity alerts and ensure no user-controlled data reaches exec/spawn or template engines without strict validation. |
| LFI / Path Traversal | Weak normalization but sandbox-limited file preview | Use strict allowlists of known files/IDs, robust normalization, and library helpers that prevent traversal outside defined roots. |
| Internal Notes / Stored XSS | Unescaped note body rendered directly, including previews | Always encode user-generated content on output and store intended formatting in a safe representation (e.g., markdown parsed to safe HTML). |
| CSRF Missing | Notes form accepts state-changing POSTs with no CSRF token or origin checks | Implement CSRF tokens (synchronizer pattern or double-submit), and/or verify origin and SameSite cookie behavior. |
| IDOR (Tickets & Notes) | Access to records driven solely by ID without ownership/role checks | Enforce per-record authorization based on user identity, role, and business rules; avoid direct object references in URLs where sensitive. |
| Sessions & Cookies | `httpOnly` disabled, `secure` off, permissive settings in lab | Enable `httpOnly`, `secure`, and strict `SameSite`; rotate secrets and consider signed/encrypted session stores. |
| Debug Config | `/debug/config` route exposes environment-style info and demo secrets | Remove debug routes entirely from production; store real secrets in secure secret managers and never echo them over HTTP. |
| Hardcoded Demo Secrets | Inline demo keys and flags | Move configuration to environment or secret management layers with rotation and access controls. |
| Directory Listing | JSON listing of all uploads and metadata | Restrict listings to authorized users, minimize exposed metadata, and consider pagination and filtering to reduce information leakage. |
| Verbose Errors | Error handler returns full stack traces in the browser | Log detailed errors server-side only; show generic user-facing messages. |
| Logging | Simple JSON logs without rotation or access control | Integrate with centralized logging, apply retention and access policies, and sanitize sensitive data. |
| Legacy Dependency | moment.js kept as an outdated dependency | Replace with maintained libraries (e.g., `Intl` or modern date libraries) and keep dependencies patched and audited. |

Trainers are encouraged to extend this guide with organization-specific standards, coding patterns, and references to internal security documentation.

