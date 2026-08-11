# Trading Lab MVP

## What this version does
- Landing page
- Email signup storage in SQLite
- Tracks page views
- Tracks "Start Learning" clicks
- Tracks Exness outbound clicks
- Captures UTM/source attribution
- `/go/exness` redirect endpoint for your referral URL
- Basic stats endpoint at `/api/admin/stats`

## Run locally
1. Install Node.js 20+.
2. In this folder run: `npm install`
3. The MVP is preconfigured with your Exness referral URL. You can override it with `EXNESS_REFERRAL_URL` if needed.
4. Run: `npm start`
5. Open: `http://localhost:3000`

## Important before public launch
- Protect `/api/admin/stats` with authentication.
- Add proper privacy/consent handling for analytics and email.
- Replace the placeholder Exness URL with your actual affiliate URL.
- Add an actual email delivery/CRM service so signups receive the roadmap.
- Review broker/affiliate disclosures and applicable financial-promotion rules before advertising.
