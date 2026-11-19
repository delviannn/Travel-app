-- Add optional per-package MP4 URLs and direct MP4 uploads. This keeps existing package data.
alter table public.tour_packages add column if not exists video_url text;
alter table public.tour_packages add column if not exists video_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('package-videos', 'package-videos', true, 31457280, array['video/mp4'])
on conflict (id) do update set public = true, file_size_limit = 31457280, allowed_mime_types = array['video/mp4'];

do $video_policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public can view package videos') then
    execute $sql$create policy "public can view package videos" on storage.objects for select to anon, authenticated using (bucket_id = 'package-videos')$sql$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'admins can upload package videos') then
    execute $sql$create policy "admins can upload package videos" on storage.objects for insert to authenticated with check (bucket_id = 'package-videos' and (select public.is_active_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text)$sql$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'admins can update package videos') then
    execute $sql$create policy "admins can update package videos" on storage.objects for update to authenticated using (bucket_id = 'package-videos' and (select public.is_active_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'package-videos' and (select public.is_active_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text)$sql$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'admins can delete package videos') then
    execute $sql$create policy "admins can delete package videos" on storage.objects for delete to authenticated using (bucket_id = 'package-videos' and (select public.is_active_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text)$sql$;
  end if;
end
$video_policies$;
