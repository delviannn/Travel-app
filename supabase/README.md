# Supabase setup

## 1. Create the project and database

1. Create a Supabase project.
2. Open **SQL Editor**, paste and run [`schema.sql`](schema.sql).
3. In **Authentication → Users**, create the first admin account with email and password.
4. Copy that user's UUID, then run this in SQL Editor (replace the sample UUID and name):

```sql
insert into public.admin_profiles (id, display_name)
values ('00000000-0000-0000-0000-000000000000', 'Admin Nusantara Journey');
```

Only users with an active `admin_profiles` row can modify catalog data or upload photos, and can hide or delete customer reviews. Public visitors can read visible packages and reviews, and submit reviews that remain hidden until an admin approves them. On an existing project, run [`enable-public-review-submissions.sql`](enable-public-review-submissions.sql) to apply the pending-review policy and database length limits; it preserves existing review visibility. Admins can approve, hide, or delete submitted reviews. To enable per-package videos on an existing project, run [`add-package-videos.sql`](add-package-videos.sql); it adds optional video URL/upload columns, a public video bucket, and admin-only upload policies. Existing package data stays intact. In Admin, upload an MP4 up to 30 MB or paste a direct MP4 URL.

## 2. Configure the website

Copy the Project URL and **publishable** key (or legacy anon key) from **Project Settings → API** into `supabase-config.js`. These two values are intended for browser use with the database protected by RLS. Never put a `service_role` key in this file or any frontend code.

The committed values are placeholders, so the site shows its starter catalog. Admin login and shared review moderation stay unavailable until Supabase is configured. Once configured, the site reads the catalog, customer reviews, and admin changes from Supabase.

## 3. Enable AI descriptions

The AI description button calls the `generate-package-description` Edge Function. Add the Gemini API key as a server-side Edge Function secret named `GEMINI_API_KEY` in the Supabase Dashboard. The function defaults to `gemini-3.5-flash-lite`; optionally set `GEMINI_MODEL` to another model enabled for the key.

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY GEMINI_MODEL=gemini-3.5-flash-lite
supabase functions deploy generate-package-description
```

Do not commit a real key. `.env.example` lists the values to prepare; `.gitignore` excludes local `.env` files.

## 4. Test accounts and data

Open `/admin.html` directly and sign in using the account created in Supabase Auth. The public navigation does not link to the admin page. Add or edit catalog items there; package photos are limited to JPG, PNG, or WebP and 5 MB. The example prices and itineraries in the starter site are estimates and should be reviewed before they become official offers.

To show the optional starter catalog, run [`seed-estimate-packages.sql`](seed-estimate-packages.sql) in the Supabase SQL Editor. It inserts example prices and itineraries marked as estimates; re-running it does not duplicate those packages.

## Notes

- `schema.sql` can be reapplied safely for policies and table setup; it does not create demo admin users.
- Password changes re-check the current password and then use Supabase Auth.
- Public images live in a public Storage bucket; only active admins can upload, update, or remove them.
- No online booking or payment is implemented; customers still confirm with the team over WhatsApp.
