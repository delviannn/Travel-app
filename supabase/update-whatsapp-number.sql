-- Apply this migration to an existing Supabase project to align the stored
-- business contact with the company profile. The browser app has its own
-- WhatsApp link constants in app.js and detail.js.
update public.site_settings
set value = to_jsonb('6282389571315'::text),
    updated_at = now()
where key = 'whatsapp_number';
