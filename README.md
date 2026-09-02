# Billora

**Billora** is a premium full-stack invoicing and business-management starter for Nigerian SMEs.

## Included

- Email/password registration and login
- Secure server-side JWT authentication
- Dashboard with revenue, outstanding invoices, expenses and profit
- Invoice creation with multiple line items
- Invoice status tracking
- Expense tracking
- Customer list generated from invoice activity
- Responsive mobile-first UI with motion effects
- Flutterwave subscription checkout endpoint
- Environment-based secrets — no payment secret is stored in the frontend

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## Flutterwave setup

Add your Flutterwave secret key to the server environment as `FLW_SECRET_KEY`. Never put the secret key in `public/app.js`, HTML, GitHub source, or a client-side environment variable.

Set `APP_URL` to the deployed Billora URL so Flutterwave can return the customer to the application after checkout.

The current starter uses a ₦4,500/month Pro checkout. Change the amount in `server.js` when the final pricing is decided.

## Deployment

The included `render.yaml` is prepared for a Node web service. Add `JWT_SECRET`, `FLW_SECRET_KEY`, and `APP_URL` as private environment variables in the hosting dashboard.

## Important production upgrades

Before taking real customer payments, add a persistent database (PostgreSQL recommended), server-side Flutterwave webhook handling, transaction verification tied to the authenticated user and transaction reference, rate limiting, CSRF/security headers, audit logs, invoice PDF generation, email delivery, backups, and proper error monitoring.
