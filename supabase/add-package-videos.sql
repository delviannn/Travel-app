-- Add optional per-package MP4 video URLs without changing existing package data.
alter table public.tour_packages add column if not exists video_url text;
