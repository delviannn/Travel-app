-- Allow customers to submit reviews for admin moderation before publication.
alter table public.customer_reviews alter column visible set default false;

grant insert on public.customer_reviews to anon;

drop policy if exists "public can submit customer reviews" on public.customer_reviews;
create policy "public can submit customer reviews" on public.customer_reviews
  for insert to anon, authenticated with check (visible = false);

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
