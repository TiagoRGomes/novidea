# Supabase CMS security checklist

The frontend now disables self-service registration and uses Supabase refresh tokens. That alone does **not** secure the database: row-level security (RLS) is authoritative.

## Before enabling the CMS

1. In Supabase Authentication settings, disable public sign-ups if this site is meant to have administrator-created accounts only. Hiding the registration form in React is not enough to disable the public Auth API.
2. Back up the database and inspect the existing columns/types for `profiles`, `cms_site`, `cms_blocks`, `cms_pages`, `cms_products`, `cms_categories`, `cms_media`, `cms_carousels`, `cms_carousel_items`, `cms_texts` and `cms_settings`.
3. Make sure the first administrator exists in `auth.users` and has a matching row in `public.profiles` with `role = 'admin'`. Do this from the Supabase SQL editor as a project administrator, not from the public frontend.
4. Review `supabase/security-policies.sql`. It assumes the table/column names used by this app and **replaces existing policies** on the listed CMS tables. Do not run it blindly if your schema differs or if existing policies are intentionally used by another app.
5. Review existing policies on `storage.objects` separately. The CMS uploads to bucket `cms-media`; users with `viewer` role must not be able to upload, edit or delete files.
6. Test with separate identities: anonymous visitor (can read public content only), editor (can manage content but cannot change roles/settings), administrator (can manage users/settings), and a viewer (cannot manage content).

## Important limits

- The publishable/anon key is expected to be visible in a browser. It is not a secret and must be constrained by RLS. Never add a Supabase `service_role` key to a `VITE_*` variable.
- The code filters catalog requests to `is_published = true`, but RLS must enforce that filter too; a browser filter is not an access-control boundary.
- The provided policy file has not been executed against your live database. Validate it against your schema and backup before applying it.
- If the table `profiles` is populated by a trigger, confirm that the trigger uses a trusted server-side function and does not allow users to set their own role from `user_metadata`.