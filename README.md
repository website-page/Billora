# Billora

**Billora** is a premium full-stack invoicing and business-management SaaS starter for Nigerian SMEs.

## Phase 2 included

- Email/password registration and JWT authentication
- Revenue, outstanding, expenses and net-profit dashboard
- Animated 7-day cash-flow chart
- Professional invoice creation with multiple line items
- One-click invoice PDF generation
- One-click payment receipt PDF generation
- Invoice status tracking: paid, unpaid, overdue
- Customer workspace generated from invoice activity
- Six-month revenue vs expense analytics
- Invoice health and top-customer analytics
- Business profile/settings used by generated documents
- NGN/USD/GBP currency preference
- Light/dark mode
- Responsive mobile dashboard
- Flutterwave Pro subscription checkout + return verification flow
- Environment-based secrets; payment secrets are never stored in frontend code

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## Flutterwave

Add your Flutterwave secret key privately as `FLW_SECRET_KEY`. Never put the secret key in HTML, `public/app.js`, GitHub source, or any client-side environment variable.

Set `APP_URL` to the deployed Billora URL. The current starter uses a ₦4,500/month Pro checkout; change the amount in `server.js` when final pricing is decided.

## Deployment

The included `render.yaml` is prepared for a Node web service. Add `JWT_SECRET`, `FLW_SECRET_KEY`, and `APP_URL` as private environment variables in your hosting dashboard.

## Production database note

The current starter intentionally keeps the simple JSON data store so the project is easy to run immediately. For a real commercial launch, migrate user/business data to PostgreSQL and add backups, rate limiting, security headers, audit logging, email delivery, persistent file storage, and server-side Flutterwave webhook processing.

## Next phase

Stock/inventory management, recurring invoices, customer reminders, email delivery, team roles, tax/VAT fields, richer reports, and a dedicated marketing/landing page can be layered on top of this foundation.
