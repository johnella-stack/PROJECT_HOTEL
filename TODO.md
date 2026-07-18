## Task: Fix forgot password not functioning

### Plan implemented
- Updated `server.js` to generate the reset link using an environment variable `FRONTEND_BASE_URL` instead of a hardcoded Vercel domain.

### Next steps
1. In your hosting environment (Render), set `FRONTEND_BASE_URL` to the URL where the React app is served (e.g. `https://project-hotel-xz49.onrender.com` or your actual frontend domain).
2. Retry “Forgot Password” and confirm the email link opens the same app that handles `?resetToken=`.
3. If it still fails, check backend logs for Brevo errors and verify `BREVO_API_KEY` is present/valid.

