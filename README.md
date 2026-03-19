# Kudimi 🎬

SaaS that generates personalized AI-powered videos for children. Parents fill out a brief about their kid — Kudimi produces a fully custom, narrated video delivered to their inbox.

🔗 **Live:** [kudimi.vercel.app](https://kudimi.vercel.app/)

---

## Product flow

```
1. Parent completes 9-step survey (interests, age, story idea)
2. Chooses payment method → Polar (USD) or Mercado Pago (ARS)
3. Post-payment redirect activates the brief form
4. Brief is saved to DB → confirmation email sent to parent
           + order notification sent to admin
5. Video is generated and delivered
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — single ~800-line file, zero npm dependencies |
| Database | Supabase (PostgreSQL) — `waitlist` + `briefs` tables, RLS enabled |
| Backend | Supabase Edge Functions (TypeScript/Deno) |
| Email | Resend — transactional templates in Kudimi brand colors |
| Payments | Polar.sh (USD via Stripe Connect) + Mercado Pago (ARS) |
| Deploy | Vercel — auto-deploy on push to `main` |
| Infra cost | $0 fixed — commission only on transactions |

---

## Frontend

Single HTML file deployed on Vercel. No frameworks, no build step.

- Hero section with animated SVG logo and kawaii mascot drawn in pure SVG
- 9-step typeform-style survey with progress bar, per-step validation, and conditional logic (e.g. sub-question triggers if user selects "wouldn't pay")
- Waitlist form (name + email)
- Post-payment brief page — activates via `?paid=true&via=polar` or `?paid=true&via=mercadopago` URL params
- Real-time family counter pulling from Supabase on page load

---

## Backend

Two serverless Edge Functions in TypeScript running on Deno:

**`send-waitlist-email`** — triggers on survey completion. Writes to `waitlist` table, sends confirmation email to parent via Resend.

**`send-brief-email`** — triggers on brief submission post-payment. Writes to `briefs` table (including payment method), sends confirmation to parent + order notification to admin with full brief details.

---

## Database

Two tables in Supabase PostgreSQL:

**`waitlist`**: `id`, `name`, `email`, `q1`–`q8` (survey answers), `created_at`

**`briefs`**: `id`, `child_name`, `child_age`, `story_idea`, `contact`, `payment_method` (`polar` | `mercadopago`), `created_at`

Row Level Security enabled on both tables. Frontend only has access via the public anon key — inserts only, no reads.

---

## Payments

**Polar.sh** — USD payments via Stripe Connect. Success URL redirects to `?paid=true&via=polar`. Funds deposited to US bank account.

**Mercado Pago** — ARS payments for the local Argentine market. Redirect URL configured to `?paid=true&via=mercadopago`.

Payment method is persisted in the `briefs` table for every order.

---

## Local setup

### Prerequisites

- Supabase project (free tier works)
- Resend account
- Polar.sh account (optional, for USD payments)
- Mercado Pago account (optional, for ARS payments)

### Environment variables

Create a `.env.local` file:

```env
# Public — embedded in the HTML (safe to expose)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Secret — set via Supabase CLI, never embedded in the HTML
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

Set the secret variables in Supabase Edge Functions:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=...
```

### Deploy Edge Functions

```bash
supabase functions deploy send-waitlist-email
supabase functions deploy send-brief-email
```
