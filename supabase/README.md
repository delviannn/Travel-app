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

Only users with an active `admin_profiles` row can modify catalog data or upload photos. Public visitors can only read visible packages.

## 2. Configure the website

Copy the Project URL and **publishable** key (or legacy anon key) from **Project Settings → API** into `supabase-config.js`. These two values are intended for browser use with the database protected by RLS. Never put a `service_role` key in this file or any frontend code.

The committed values are placeholders, so the site continues to show its local demo until you replace them. Once configured, the site reads the catalog and admin changes from Supabase.

## 3. Enable AI descriptions

The AI description button calls the `generate-package-description` Edge Function. Add the Gemini API key as a server-side Edge Function secret named `GEMINI_API_KEY` in the Supabase Dashboard. Optionally set `GEMINI_MODEL` to a model enabled for the key; the function defaults to `gemini-3.8-flash`.

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase functions deploy generate-package-description
```

Do not commit a real key. `.env.example` lists the values to prepare; `.gitignore` excludes local `.env` files.

## 4. Test accounts and data

Sign in through the site's Admin button using the account created in Supabase Auth. Add or edit catalog items there; package photos are limited to JPG, PNG, or WebP and 5 MB. The example prices and itineraries in the starter site are estimates and should be reviewed before they become official offers.

To show the optional starter catalog, run [`seed-estimate-packages.sql`](seed-estimate-packages.sql) in the Supabase SQL Editor. It inserts example prices and itineraries marked as estimates; re-running it does not duplicate those packages.

## Notes

- `schema.sql` can be reapplied safely for policies and table setup; it does not create demo admin users.
- Password changes re-check the current password and then use Supabase Auth.
- Public images live in a public Storage bucket; only active admins can upload, update, or remove them.
- No online booking or payment is implemented; customers still confirm with the team over WhatsApp.
