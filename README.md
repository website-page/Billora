# Billora

**Billora** is a premium full-stack invoicing and business-management SaaS starter for Nigerian SMEs.

## Phase 3 included

- PostgreSQL persistence when `DATABASE_URL` is configured, with JSON fallback for simple local demos
- Professional invoice and receipt PDFs using PDFKit
- VAT/tax rate on invoices and VAT line on generated PDFs
- Recurring invoice templates: weekly, monthly and quarterly
- Customer payment reminders through configured email SMTP
- WhatsApp reminder link generation for fast manual sharing
- Team workspace invitation flow with staff/manager roles
- Six-month revenue vs expense analytics and invoice health
- Business profile/settings and NGN/USD/GBP preferences
- Flutterwave Pro checkout and server-side transaction verification
- Flutterwave webhook endpoint with signature validation and idempotent event storage
- Secure server-side secrets and deployment environment configuration
- Responsive animated dashboard

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## PostgreSQL

For production, create a PostgreSQL database and set `DATABASE_URL`. Billora creates its required tables automatically at startup. If `DATABASE_URL` is empty, the app uses the local JSON store for development/demo purposes.

## Flutterwave

Set `FLW_SECRET_KEY` privately on the server. Never put it in HTML, `public/app.js`, GitHub source, or a client-side environment variable. Set `FLW_SECRET_HASH` to the webhook secret configured in your Flutterwave dashboard. Billora validates incoming webhook signatures before processing payment events. Flutterwave recommends webhook signature verification and transaction verification before granting value. citeturn0search0turn0search3

Set `APP_URL` to the deployed Billora URL. The default Pro checkout amount is ₦4,500/month and can be changed with `BILLORA_PRO_AMOUNT`.

## Email reminders

To enable invoice reminder emails and team invitation emails, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.

## Deployment

The included `render.yaml` is prepared for a Node web service. Add the environment variables shown in `.env.example` through your hosting provider's secret/environment settings.

## Production checklist

Before serving real businesses at scale, add rate limiting, security headers, stronger account recovery/2FA, audit logs, automated recurring-invoice generation workers, background email jobs, database backups, monitoring, and a full role/permission matrix. Keep payment credentials and database credentials server-side.

## Roadmap

The next major product module is **StockPilot** — inventory, purchasing, low-stock alerts, sales and product analytics — which can share Billora's authentication and business-account foundation.
