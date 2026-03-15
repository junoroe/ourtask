# OurTask Security Audit — 2026-03-15

## 🔴 HIGH — Must Fix

### 1. Port 3001 bound to all interfaces (*)
Next.js is listening on `*:3001`, meaning anyone can bypass nginx rate limiting
and security headers by hitting `http://5.161.199.106:3001` directly.
**Fix:** Bind to 127.0.0.1 only, or block port 3001 in ufw.

### 2. Upload path traversal not explicitly prevented
While crypto.randomBytes filename prevents practical exploitation, the upload
handler doesn't validate that the final path stays within UPLOAD_DIR.
Should add a path containment check.

### 3. No login brute-force tracking
Rate limiting at nginx (5r/s) helps, but there's no account lockout or
failed-attempt tracking. An attacker could try 5 passwords per second
indefinitely against a known email.
**Fix:** Add login_attempts table, lock after 10 failures for 15 minutes.

## 🟡 MEDIUM — Should Fix

### 4. Complete endpoint accepts arbitrary photo_after_url
`/api/tasks/[slug]/complete` accepts any URL as `photo_after_url` without
validating it's a local upload path. An attacker could set it to any URL
(XSS via javascript: URI, external tracking pixel, etc.)
**Fix:** Validate it starts with `/uploads/` and matches expected pattern.

### 5. Cron digest endpoint discoverable
While protected by CRON_SECRET, the endpoint path `/api/cron/digest` is
discoverable. Not a real risk since the secret is required, but could
add IP restriction (localhost only).

### 6. No CSRF protection on state-changing endpoints
CORS origin check in middleware helps, but isn't true CSRF protection.
A same-site cookie would be more robust. Lower risk since auth is
Bearer token (not cookie-based), but worth noting.

### 7. sanitizeText double-encodes on display
`sanitizeText()` HTML-encodes on input. If React also escapes on render,
users see `&lt;` literally. Should store raw and escape on output, or
at minimum ensure consistent handling.

## Deep Dive — Round 2 (10 additional issues found & fixed)

### 🔴 HIGH
8. **User enumeration via timing** — Login with unknown email skipped bcrypt (fast) vs known email (slow). Fix: dummy bcrypt.compare on unknown emails.
9. **Upload accepts fake MIME types** — No magic byte validation. Could upload HTML with `Content-Type: image/jpeg`. Fix: validate JPEG/PNG/WebP magic bytes before writing.
10. **Org detail endpoint leaks contact info** — `SELECT o.*` returned contact_email, contact_phone to any visitor. Fix: explicit column list.

### 🟡 MEDIUM  
11. **Sponsor creation open to all users** — Any logged-in user could POST /api/sponsors. Fix: admin-only (is_admin flag).
12. **User IDs exposed in public APIs** — creator_id in task listings, user.id in leaderboard. Fix: stripped from list/leaderboard, kept only in task detail (needed for ownership check).
13. **No photo_url validation on task creation** — Accepted any URL (XSS, tracking). Fix: validate `/uploads/` pattern.
14. **volunteers_needed unbounded** — Could set to 999999. Fix: capped at 1-500.
15. **Org contact_email not validated** — Accepted any string. Fix: isValidEmail() check + description/website length limits.
16. **Nginx server version disclosed** — `Server: nginx/1.24.0 (Ubuntu)`. Fix: `server_tokens off`.
17. **No cleanup for login_attempts/token_blacklist** — Tables grow unbounded. Fix: daily cron cleanup at 3am/4am UTC.

## 🟢 What's Good
- JWT with lazy secret validation ✅
- Token blacklist on logout ✅
- bcrypt with cost 12 ✅
- Parameterized queries everywhere (no SQL injection) ✅
- CORS origin checking ✅
- Rate limiting at nginx (auth 5r/s, API 20r/s, upload 2r/s) ✅
- systemd hardening (NoNewPrivileges, ProtectSystem, PrivateTmp) ✅
- .env 600 permissions, owned by ourtask user ✅
- Upload: type + size validation, crypto filenames ✅
- HSTS, X-Content-Type-Options, X-Frame-Options ✅
- Firewall: SSH via Tailscale only, ports 80/443 only ✅
- DB on localhost only ✅
- Anti-enumeration on signup ✅
- Password policy (8+ chars, upper/lower/number, max 128) ✅
- Content moderation on task creation ✅
