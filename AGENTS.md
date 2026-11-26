# Repository Guide

## Project

Nusantara Journey Tour & Travel is an Indonesian-language static travel catalog for a Batam-based travel business. It uses plain HTML, CSS, and browser JavaScript, with Supabase for package data, admin authentication, reviews, storage, and an AI-assisted package description function.

## Important files

- `index.html`, `detail.html`, `admin.html`: public landing/catalog, package detail, and owner dashboard.
- `styles.css`: shared design system, responsive layouts, theme styles, and component styles.
- `app.js`, `detail.js`, `admin.js`: page behavior. `supabase-browser.js` wraps browser-side Supabase calls.
- `supabase-config.js`: browser-safe project URL, publishable/anon key, and optional public Turnstile site key. Never put service-role keys, CAPTCHA secrets, or AI provider keys here.
- `supabase/schema.sql` and subsequent SQL files: database schema, RLS policies, and hardening changes. `supabase/functions/`: Edge Functions.
- `vercel.json`: response security headers and Content Security Policy. Update it when adding a new external script, image, API, or font origin.
- `sw.js`, `manifest.webmanifest`, `offline.html`: progressive web app support.

## Working conventions

- Keep the site framework-free unless the project owner requests a migration. Reuse the existing HTML/CSS/JS structure and shared styles.
- Preserve Indonesian copy, accessible labels, keyboard interaction, responsive behavior, and light/dark theme support.
- Treat package prices, itineraries, business profile, testimonials, and images as draft/example content unless the owner confirms them.
- Escape untrusted text before inserting it into HTML. Keep admin authorization and validation enforced by Supabase/RLS or server-side functions; frontend checks are not security boundaries.
- Keep secrets in Supabase/Vercel server-side settings or local ignored environment files. Never print or commit secret values. The browser Turnstile site key is public; its matching secret is server-side only.
- When changing external origins, review CSP in `vercel.json`. Keep function origin checks, bounded request bodies, authentication, authorization, and quota enforcement in place.
- SQL changes for an existing deployment need an explicit migration path; do not assume editing `schema.sql` updates the live database. Edge Function changes require deployment separately.
- Do not edit generated/cache files such as `supabase/.temp/`. Check `git status` before and after edits to avoid including unrelated user changes.

## Main user flows

1. Visitors browse/search/filter packages, open package details, and contact the business through WhatsApp.
2. Visitors can submit reviews; reviews are moderated before appearing publicly.
3. Admins sign in with Supabase Auth (Turnstile CAPTCHA is configured), then manage packages/reviews and request AI-written description drafts.
4. The hero carousel advances automatically, pauses while the pointer is over the hero or keyboard focus is inside it, and supports manual previous/next controls. Respect reduced-motion preferences.

## Project-specific deployment context

The production site is `https://nusantarajourney.vercel.app/`; Supabase setup and deployment notes are in `supabase/README.md`. Do not deploy, push, apply migrations, or change remote settings unless that action is requested in the conversation.
