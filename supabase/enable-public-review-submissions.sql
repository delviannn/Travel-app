-- Route public review submissions through the submit-public-review Edge Function.
-- Rate limit: three submissions per client IP per hour.

create schema if not exists nj_private;
revoke all on schema nj_private from public, anon, authenticated;

create table if not exists nj_private.public_review_rate_limits (
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count between 0 and 4)
);
create index if not exists public_review_rate_limits_window_idx
  on nj_private.public_review_rate_limits (window_started_at);
revoke all on table nj_private.public_review_rate_limits from public, anon, authenticated;

create or replace function public.consume_public_review_quota(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  count_in_window integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  if random() < 0.01 then
    delete from nj_private.public_review_rate_limits
    where window_started_at < now() - interval '24 hours';
  end if;

  insert into nj_private.public_review_rate_limits as rate_state (ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update set
    window_started_at = case
      when rate_state.window_started_at <= now() - interval '1 hour' then now()
      else rate_state.window_started_at
    end,
    request_count = case
      when rate_state.window_started_at <= now() - interval '1 hour' then 1
      else least(rate_state.request_count + 1, 4)
    end
  returning request_count into count_in_window;

  return count_in_window <= 3;
end;
$$;

revoke all on function public.consume_public_review_quota(text) from public, anon, authenticated;
grant execute on function public.consume_public_review_quota(text) to service_role;

alter table public.customer_reviews alter column visible set default false;
drop policy if exists "public can submit customer reviews" on public.customer_reviews;
revoke insert on public.customer_reviews from anon, authenticated;

do $review_constraints$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_reviews'::regclass and conname = 'customer_reviews_author_length_check') then
    alter table public.customer_reviews add constraint customer_reviews_author_length_check
      check (length(trim(author)) between 1 and 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_reviews'::regclass and conname = 'customer_reviews_package_name_length_check') then
    alter table public.customer_reviews add constraint customer_reviews_package_name_length_check
      check (length(package_name) <= 120) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.customer_reviews'::regclass and conname = 'customer_reviews_quote_length_check') then
    alter table public.customer_reviews add constraint customer_reviews_quote_length_check
      check (length(trim(quote)) between 1 and 1200) not valid;
  end if;
end
$review_constraints$;
