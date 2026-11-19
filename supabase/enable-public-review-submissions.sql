-- Allow customers to submit public reviews. Admins can still hide or delete them.
grant insert on public.customer_reviews to anon;

do $review_policy$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_reviews' and policyname = 'public can submit customer reviews') then
    execute $sql$create policy "public can submit customer reviews" on public.customer_reviews for insert to anon, authenticated with check (visible = true)$sql$;
  end if;
end
$review_policy$;
