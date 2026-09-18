# DreamQueen – Supabase Sync Version

This version changes the important cross-device data flows so Supabase is the source of truth for:

- Products
- Customer authentication and profiles
- Orders
- Custom orders

## Start

From the folder containing `package.json`:

```powershell
npm install
npm run dev
```

## Supabase

You said the required SQL was already run. If starting with a fresh Supabase project, run `SUPABASE_SETUP.sql` in Supabase SQL Editor.

## Customer accounts

Sign up uses Supabase Auth with email + password. Name and phone are sent as Auth metadata and the database trigger creates the matching `profiles` row.

Login uses `supabase.auth.signInWithPassword()`.

Passwords are no longer stored in DreamQueen localStorage or the public `profiles` table.

## Orders

The Admin dashboard loads orders from `public.orders` on startup and listens for Realtime INSERT/UPDATE/DELETE events. Admin status changes are written back to Supabase.

## Important test

Use a NEW account after installing this version. Old accounts that existed only in the previous browser localStorage system are not Supabase Auth accounts.

If Supabase email confirmation is enabled, the customer must verify the email before signing in. If you want immediate sign-in for this prototype, disable email confirmation in Supabase Authentication settings.
