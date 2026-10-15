-- NOVIDEA CMS security policies for Supabase.
-- REVIEW BEFORE RUNNING: this script assumes the tables and column names used by
-- src/lib/supabaseClient.ts and src/lib/cmsApi.ts already exist.
-- It replaces existing RLS policies on the listed public CMS tables. Back up the
-- database and review existing policies first. It does not change/delete table data.
-- Do not run this until you have confirmed an intended administrator exists in
-- public.profiles with role = 'admin'.

begin;

create or replace function public.novidea_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = any (allowed_roles)
  );
$$;

revoke all on function public.novidea_has_role(text[]) from public;
grant execute on function public.novidea_has_role(text[]) to authenticated;

-- Remove policies on these CMS tables so older permissive policies cannot be
-- combined with the stricter rules below (Postgres combines permissive policies with OR).
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles', 'cms_site', 'cms_blocks', 'cms_pages', 'cms_products',
        'cms_categories', 'cms_media', 'cms_carousels', 'cms_carousel_items',
        'cms_texts', 'cms_settings'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', existing_policy.policyname, existing_policy.schemaname, existing_policy.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.cms_site enable row level security;
alter table public.cms_blocks enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_products enable row level security;
alter table public.cms_categories enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_carousels enable row level security;
alter table public.cms_carousel_items enable row level security;
alter table public.cms_texts enable row level security;
alter table public.cms_settings enable row level security;

-- Profiles: users may read their own profile; administrators manage all profiles.
create policy novidea_profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.novidea_has_role(array['admin']));
create policy novidea_profiles_insert on public.profiles
  for insert to authenticated
  with check (public.novidea_has_role(array['admin']));
create policy novidea_profiles_update on public.profiles
  for update to authenticated
  using (public.novidea_has_role(array['admin']))
  with check (public.novidea_has_role(array['admin']));
create policy novidea_profiles_delete on public.profiles
  for delete to authenticated
  using (public.novidea_has_role(array['admin']));

-- Homepage settings contain the public-facing site's content, not secrets.
create policy novidea_cms_site_public_read on public.cms_site
  for select to anon, authenticated using (true);
create policy novidea_cms_site_staff_write on public.cms_site
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

-- Blocks and catalog entities expose only records explicitly marked public.
create policy novidea_cms_blocks_public_read on public.cms_blocks
  for select to anon, authenticated using (is_visible = true);
create policy novidea_cms_blocks_staff_all on public.cms_blocks
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

create policy novidea_cms_pages_public_read on public.cms_pages
  for select to anon, authenticated using (status::text = 'published');
create policy novidea_cms_pages_staff_all on public.cms_pages
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

create policy novidea_cms_products_public_read on public.cms_products
  for select to anon, authenticated using (is_published = true);
create policy novidea_cms_products_staff_all on public.cms_products
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

create policy novidea_cms_categories_public_read on public.cms_categories
  for select to anon, authenticated using (is_active = true);
create policy novidea_cms_categories_staff_all on public.cms_categories
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

create policy novidea_cms_media_staff_all on public.cms_media
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

create policy novidea_cms_carousels_public_read on public.cms_carousels
  for select to anon, authenticated using (is_active = true);
create policy novidea_cms_carousels_staff_all on public.cms_carousels
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

create policy novidea_cms_carousel_items_public_read on public.cms_carousel_items
  for select to anon, authenticated using (is_active = true);
create policy novidea_cms_carousel_items_staff_all on public.cms_carousel_items
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));

-- Texts and settings are admin data and are not exposed to anonymous visitors.
create policy novidea_cms_texts_staff_all on public.cms_texts
  for all to authenticated
  using (public.novidea_has_role(array['admin', 'editor']))
  with check (public.novidea_has_role(array['admin', 'editor']));
create policy novidea_cms_settings_admin_all on public.cms_settings
  for all to authenticated
  using (public.novidea_has_role(array['admin']))
  with check (public.novidea_has_role(array['admin']));

commit;

-- Storage policies are not rewritten here because storage.objects may contain
-- unrelated buckets. In Supabase, inspect Storage > Policies and ensure only
-- admins/editors can upload/update/delete objects in bucket `cms-media`. If the
-- bucket's objects are rendered publicly, verify that this is intentional.
