# AKM Care

Official website for AKM Care — providing
industrial training, HR solutions, and
authentic rural e-commerce across India.

## Tech Stack
- React + Vite
- Tailwind CSS
- Supabase (Database + Auth)
- Resend (Email notifications)

## Getting Started
```bash
npm install
npm run dev
```

## Environment Variables
Create a `.env` file:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RESEND_API_KEY=
VITE_YOUTUBE_API_KEY=
```

Admin writes use the anon key + signed-in `admin_users` session + RLS.
Do **not** put a service role key in any `VITE_` variable.

For local bootstrap / catalog import scripts only:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Then run `npm run admin:bootstrap` and sign in at `/admin/login`.

## Deployment
Deploy to Vercel. Add browser env vars (`VITE_*`) in the Vercel dashboard. Keep `SUPABASE_SERVICE_ROLE_KEY` off the frontend.
