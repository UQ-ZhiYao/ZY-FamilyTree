-- =====================================================================
-- Zenith Yield (枝叶 · ZY FamilyTree) — Supabase database
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again (everything is "create if not exists" / "or replace").
--
-- Data model
--   families      one row per family space.     family_key  e.g. ZYF-7K3Q9M  (unique)
--   family_users  which sign-in accounts belong to which family (admin / member)
--   clans         one row per surname line in a family.   clan_key   e.g. ZYC-R8TW2D (unique)
--   members       every person in the tree.               member_key e.g. ZYM-4HXN8Q2P (unique)
--   photos        photo metadata; the files are in Storage bucket "family-media"
--   activity      change log shown on the Family members page
-- Every table is protected by Row Level Security: you only ever see families you belong to.
-- =====================================================================

create extension if not exists pgcrypto;

-- Short, readable, unique codes (no 0/O/1/I to avoid mix-ups).
create or replace function public.zy_code(prefix text, len int default 8)
returns text language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  b bytea := gen_random_bytes(len);
  out text := '';
  i int;
begin
  for i in 0 .. len - 1 loop
    out := out || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return prefix || out;
end $$;

-- ---------------------------------------------------------------- tables
create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  family_key  text not null unique default public.zy_code('ZYF-', 6),
  name        text not null default '',
  join_code   text not null unique default public.zy_code('', 8),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.family_users (
  family_id   uuid not null references public.families (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'member' check (role in ('admin', 'member')),
  email       text not null default '',
  joined_at   timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.clans (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  clan_key    text not null unique default public.zy_code('ZYC-', 6),
  surname     text not null,
  created_at  timestamptz not null default now(),
  unique (family_id, surname)
);

create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  member_key  text not null unique default public.zy_code('ZYM-', 8),
  clan_id     uuid references public.clans (id) on delete set null,
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null default '',
  name_en     text not null default '',
  surname     text not null default '',
  sex         text not null default 'm' check (sex in ('m', 'f')),
  birth       text not null default '',
  death       text not null default '',
  nationality text not null default '',
  hometown    text not null default '',
  city        text not null default '',
  job         text not null default '',
  phone       text not null default '',
  email       text not null default '',
  bio         text not null default '',
  privacy     text not null default 'all' check (privacy in ('all', 'direct', 'self')),
  father_id   uuid references public.members (id) on delete set null,
  mother_id   uuid references public.members (id) on delete set null,
  spouse_id   uuid references public.members (id) on delete set null,
  avatar_path text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  check (father_id is distinct from id and mother_id is distinct from id and spouse_id is distinct from id)
);
create unique index if not exists members_one_account_per_family on public.members (family_id, user_id) where user_id is not null;
create index if not exists members_family on public.members (family_id);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  photo_key   text not null unique default public.zy_code('ZYP-', 8),
  path        text not null default '',
  title       text not null default '',
  album       text not null default '',
  taken_on    text not null default '',
  tags        uuid[] not null default '{}',
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists photos_family on public.photos (family_id);

create table if not exists public.activity (
  id          bigint generated always as identity primary key,
  family_id   uuid not null references public.families (id) on delete cascade,
  at          timestamptz not null default now(),
  by_user     uuid references auth.users (id) on delete set null,
  by_name     text not null default '',
  what        text not null default ''
);
create index if not exists activity_family on public.activity (family_id, at desc);

-- ---------------------------------------------------------------- helpers
create or replace function public.zy_is_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_users where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.zy_is_admin(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_users where family_id = fid and user_id = auth.uid() and role = 'admin');
$$;

-- Every surname line gets its own clan row (and clan_key) the first time it is used.
create or replace function public.zy_member_before()
returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  new.surname := btrim(coalesce(new.surname, ''));
  if new.surname = '' then
    new.clan_id := null;
  else
    insert into public.clans (family_id, surname) values (new.family_id, new.surname)
      on conflict (family_id, surname) do nothing;
    select id into cid from public.clans where family_id = new.family_id and surname = new.surname;
    new.clan_id := cid;
  end if;
  -- parents and spouse must be in the same family
  if new.father_id is not null and not exists (select 1 from public.members where id = new.father_id and family_id = new.family_id) then new.father_id := null; end if;
  if new.mother_id is not null and not exists (select 1 from public.members where id = new.mother_id and family_id = new.family_id) then new.mother_id := null; end if;
  if new.spouse_id is not null and not exists (select 1 from public.members where id = new.spouse_id and family_id = new.family_id) then new.spouse_id := null; end if;
  if tg_op = 'INSERT' then
    new.member_key := public.zy_code('ZYM-', 8);
  end if;
  if tg_op = 'UPDATE' then
    new.member_key := old.member_key;   -- keys never change
    new.family_id := old.family_id;
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

-- Spouse links are kept two-way.
create or replace function public.zy_member_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() > 1 then return null; end if;
  if tg_op = 'UPDATE' and old.spouse_id is not null and old.spouse_id is distinct from new.spouse_id then
    update public.members set spouse_id = null where id = old.spouse_id and spouse_id = new.id;
  end if;
  if new.spouse_id is not null then
    update public.members set spouse_id = null where spouse_id = new.spouse_id and id <> new.id and id <> new.spouse_id;
    update public.members set spouse_id = new.id where id = new.spouse_id and spouse_id is distinct from new.id;
  end if;
  return null;
end $$;

-- Removing a person also removes them from photo tags.
create or replace function public.zy_member_deleted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.photos set tags = array_remove(tags, old.id) where family_id = old.family_id and old.id = any (tags);
  return null;
end $$;

drop trigger if exists zy_member_before on public.members;
create trigger zy_member_before before insert or update on public.members for each row execute function public.zy_member_before();
drop trigger if exists zy_member_after on public.members;
create trigger zy_member_after after insert or update of spouse_id on public.members for each row execute function public.zy_member_after();
drop trigger if exists zy_member_deleted on public.members;
create trigger zy_member_deleted after delete on public.members for each row execute function public.zy_member_deleted();

-- ---------------------------------------------------------------- actions (called from the site)
-- Start a family: creates the family, makes you its admin, and adds you as the first person.
create or replace function public.zy_create_family(p_name text, p_me jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  insert into public.families (name, created_by) values (coalesce(p_name, ''), uid) returning id into fid;
  insert into public.family_users (family_id, user_id, role, email) values (fid, uid, 'admin', coalesce(auth.jwt() ->> 'email', ''));
  insert into public.members (family_id, user_id, name, name_en, surname, sex)
    values (fid, uid, coalesce(p_me ->> 'name', ''), coalesce(p_me ->> 'nameEn', ''), coalesce(p_me ->> 'surname', ''), case when p_me ->> 'sex' = 'f' then 'f' else 'm' end);
  insert into public.activity (family_id, by_user, by_name, what) values (fid, uid, coalesce(p_me ->> 'name', ''), 'Create family space');
  return fid;
end $$;

-- Join a family with the 8-character code an admin shared.
create or replace function public.zy_join_family(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  select id into fid from public.families where join_code = upper(btrim(p_code));
  if fid is null then raise exception 'JOIN_CODE_NOT_FOUND'; end if;
  insert into public.family_users (family_id, user_id, role, email) values (fid, uid, 'member', coalesce(auth.jwt() ->> 'email', ''))
    on conflict (family_id, user_id) do nothing;
  return fid;
end $$;

-- "This is me": links your account to one person in the family (and unlinks any other).
create or replace function public.zy_link_me(p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
declare fid uuid; uid uuid := auth.uid();
begin
  select family_id into fid from public.members where id = p_member;
  if fid is null or not public.zy_is_member(fid) then raise exception 'Not allowed'; end if;
  update public.members set user_id = null where family_id = fid and user_id = uid and id <> p_member;
  update public.members set user_id = uid where id = p_member and (user_id is null or user_id = uid);
  if not found then raise exception 'This person is already linked to another account'; end if;
end $$;

create or replace function public.zy_new_join_code(p_family uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.zy_is_admin(p_family) then raise exception 'Only an admin can do this'; end if;
  update public.families set join_code = public.zy_code('', 8) where id = p_family returning join_code into c;
  return c;
end $$;

create or replace function public.zy_set_role(p_family uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.zy_is_admin(p_family) then raise exception 'Only an admin can do this'; end if;
  if p_role not in ('admin', 'member') then raise exception 'Unknown role'; end if;
  update public.family_users set role = p_role where family_id = p_family and user_id = p_user;
end $$;

-- ---------------------------------------------------------------- row level security
alter table public.families enable row level security;
alter table public.family_users enable row level security;
alter table public.clans enable row level security;
alter table public.members enable row level security;
alter table public.photos enable row level security;
alter table public.activity enable row level security;

drop policy if exists families_read on public.families;
create policy families_read on public.families for select to authenticated using (public.zy_is_member(id));
drop policy if exists families_edit on public.families;
create policy families_edit on public.families for update to authenticated using (public.zy_is_member(id)) with check (public.zy_is_member(id));
drop policy if exists families_delete on public.families;
create policy families_delete on public.families for delete to authenticated using (public.zy_is_admin(id));

drop policy if exists fu_read on public.family_users;
create policy fu_read on public.family_users for select to authenticated using (public.zy_is_member(family_id));
drop policy if exists fu_leave on public.family_users;
create policy fu_leave on public.family_users for delete to authenticated using (user_id = auth.uid() or public.zy_is_admin(family_id));

drop policy if exists clans_all on public.clans;
create policy clans_all on public.clans for all to authenticated using (public.zy_is_member(family_id)) with check (public.zy_is_member(family_id));

drop policy if exists members_all on public.members;
create policy members_all on public.members for all to authenticated using (public.zy_is_member(family_id)) with check (public.zy_is_member(family_id));

drop policy if exists photos_all on public.photos;
create policy photos_all on public.photos for all to authenticated using (public.zy_is_member(family_id)) with check (public.zy_is_member(family_id));

drop policy if exists activity_read on public.activity;
create policy activity_read on public.activity for select to authenticated using (public.zy_is_member(family_id));
drop policy if exists activity_add on public.activity;
create policy activity_add on public.activity for insert to authenticated with check (public.zy_is_member(family_id));

-- Keys and join codes cannot be edited directly (join codes change only through zy_new_join_code).
grant usage on schema public to anon, authenticated;
grant select, delete on public.families to authenticated;
grant update (name) on public.families to authenticated;
grant select, delete on public.family_users to authenticated;
grant select, insert, delete on public.clans to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, delete on public.photos to authenticated;
grant update (path, title, album, taken_on, tags) on public.photos to authenticated;
grant select, insert on public.activity to authenticated;
grant execute on function public.zy_create_family(text, jsonb), public.zy_join_family(text), public.zy_link_me(uuid), public.zy_new_join_code(uuid), public.zy_set_role(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------- photo storage
insert into storage.buckets (id, name, public) values ('family-media', 'family-media', false)
  on conflict (id) do nothing;

-- Files live under <family id>/photos/… and <family id>/avatars/…; only that family can read or write them.
drop policy if exists zy_media_read on storage.objects;
create policy zy_media_read on storage.objects for select to authenticated
  using (bucket_id = 'family-media' and public.zy_is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists zy_media_add on storage.objects;
create policy zy_media_add on storage.objects for insert to authenticated
  with check (bucket_id = 'family-media' and public.zy_is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists zy_media_change on storage.objects;
create policy zy_media_change on storage.objects for update to authenticated
  using (bucket_id = 'family-media' and public.zy_is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists zy_media_remove on storage.objects;
create policy zy_media_remove on storage.objects for delete to authenticated
  using (bucket_id = 'family-media' and public.zy_is_member(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------- live updates
-- Other family members' changes appear without reloading the page.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.members; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.photos; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.families; exception when duplicate_object then null; end;
  end if;
end $$;
