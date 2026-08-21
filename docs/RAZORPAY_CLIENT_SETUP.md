# Razorpay setup for AKM Care

This page is for the business owner. You do **not** need to edit website code, GitHub, Vercel, or `.env` files.

The developer configures everything on the **server** (Supabase Edge Function secrets).

---

## What you need to send the developer

From the [Razorpay Dashboard](https://dashboard.razorpay.com/):

1. **API Key ID** (public — safe to share with the developer)
2. **API Secret** (private — share only with the developer, never on WhatsApp groups, never in the website)
3. **Webhook Secret** (private — same rule)

Also say clearly whether these are:

- **TEST** keys (practice payments, no real money), or
- **LIVE** keys (real customer money)

---

## TEST mode vs LIVE mode

| Mode | When to use | Money |
|------|-------------|--------|
| **TEST** | First setup and QA | Fake / test cards only |
| **LIVE** | After TEST checkout, payment, failure, and webhook all pass | Real money |

Do **not** switch to LIVE until the developer confirms TEST QA has passed.

---

## Where these values go

The developer stores them **only** as Supabase Edge Function secrets:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

They must **never** be:

- pasted into the website frontend
- added as `VITE_…` environment variables
- committed to Git / GitHub
- shown on Vercel public settings
- saved in browser localStorage

The website checkout only receives the **public Key ID** from the server at payment time. The secret stays on the server.

---

## Webhook URL (developer configures this in Razorpay)

In Razorpay Dashboard → **Webhooks**, use:

`https://tdqepnmysycxklqcvpai.supabase.co/functions/v1/razorpay-webhook`

Enable at least:

- `payment.captured`
- `payment.failed`
- `order.paid`

The webhook secret in Razorpay must match the server secret.

---

## What must NEVER be shared publicly

Never post these in chat groups, email signatures, or social media:

- API Secret
- Webhook Secret
- Supabase service-role key
- customer payment signatures / raw gateway responses

The API Key ID is public by design, but still do not publish it widely if you can avoid it.

---

## What you will see after TEST works

A customer on the site can:

1. Add products to cart  
2. Checkout  
3. Pay in the Razorpay window  
4. See a truthful receipt: **Payment received**, **Confirming your payment**, or **Payment wasn't completed**

Admin orders will show **payment status** separately from **packing / shipping status**.

---

## Current status

Ask the developer before assuming payments are live. TEST secrets must be present on the server before any real TEST payment can run.
