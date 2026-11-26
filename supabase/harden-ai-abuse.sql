-- Apply to existing projects to protect the paid AI generation endpoint.
create schema if not exists nj_private;
revoke all on schema nj_private from public, anon, authenticated;

create table if not exists nj_private.admin_ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);
revoke all on table nj_private.admin_ai_rate_limits from public, anon, authenticated;

create or replace function public.consume_admin_ai_generation_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  count_in_window integer;
begin
  if caller_id is null or not exists (
    select 1 from public.admin_profiles p
    where p.id = caller_id and p.is_active = true
  ) then
    return false;
  end if;

  insert into nj_private.admin_ai_rate_limits as rate_state (user_id, window_started_at, request_count)
  values (caller_id, now(), 1)
  on conflict (user_id) do update set
    window_started_at = case
      when rate_state.window_started_at <= now() - interval '1 minute' then now()
      else rate_state.window_started_at
    end,
    request_count = case
      when rate_state.window_started_at <= now() - interval '1 minute' then 1
      else least(rate_state.request_count + 1, 6)
    end
  returning request_count into count_in_window;

  return count_in_window <= 5;
end;
$$;

revoke all on function public.consume_admin_ai_generation_quota() from public, anon;
grant execute on function public.consume_admin_ai_generation_quota() to authenticated;
