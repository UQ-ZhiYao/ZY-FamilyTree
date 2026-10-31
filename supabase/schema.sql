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
--   activity      change log
--   messages      family chat: the family group room and one-to-one rooms between accounts
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

-- Chat. room = 'family' (everyone in the family) or 'dm:<user id>:<user id>' (two accounts, ids sorted).
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  room        text not null default 'family',
  sender      uuid default auth.uid() references auth.users (id) on delete set null,
  sender_name text not null default '',
  body        text not null default '' check (char_length(body) <= 4000),
  photo_path  text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists messages_room on public.messages (family_id, room, created_at desc);

-- ---------------------------------------------------------------- upgrades for older installs (safe to re-run)
-- Each surname line has its own invitation code; members remember who added them; an account remembers which line invited it.
alter table public.clans add column if not exists join_code text;
update public.clans set join_code = public.zy_code('', 8) where join_code is null;
alter table public.clans alter column join_code set default public.zy_code('', 8);
create unique index if not exists clans_join_code on public.clans (join_code);
alter table public.members add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.members alter column created_by set default auth.uid();
alter table public.family_users add column if not exists clan_id uuid references public.clans (id) on delete set null;
alter table public.messages drop constraint if exists messages_room_check;
alter table public.messages add constraint messages_room_check check (room = 'family' or room like 'dm:%' or room like 'clan:%');

-- ---------------------------------------------------------------- helpers
create or replace function public.zy_is_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_users where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.zy_is_admin(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_users where family_id = fid and user_id = auth.uid() and role = 'admin');
$$;


-- ---------------------------------------------------------------- who can see whom
-- A person's own surname line (father's side), their mother's line and their spouse's line are
-- "their" big families. In each big family you see everyone in the line, their husbands and wives,
-- and the children of the line's daughters. You do not see the other families those relatives
-- married into (for example a cousin's mother's side).
create or replace function public.zy_line_members(fid uuid, me uuid)
returns uuid[] language sql stable security definer set search_path = public as $$
  with recursive
  fm as (select id, father_id, mother_id, spouse_id from public.members where family_id = fid),
  starts as (select me as id union select mother_id from fm where id = me union select spouse_id from fm where id = me),
  up(start, id, depth) as (
    select id, id, 0 from starts where id is not null
    union all
    select up.start, fm.father_id, up.depth + 1 from up join fm on fm.id = up.id where fm.father_id is not null and up.depth < 60
  ),
  tops as (select distinct on (start) id from up order by start, depth desc),
  line(id, depth) as (
    select id, 0 from tops
    union all
    select fm.id, line.depth + 1 from fm join line on fm.father_id = line.id where line.depth < 60
  )
  select coalesce(array_agg(distinct id), '{}') from line;
$$;

create or replace function public.zy_family_view(fid uuid, me uuid, uid uuid)
returns uuid[] language sql stable security definer set search_path = public as $$
  with
  fm as (select id, father_id, mother_id, spouse_id, created_by from public.members where family_id = fid),
  lm as (select unnest(public.zy_line_members(fid, me)) as id),
  kids as (select fm.id from fm where fm.mother_id in (select id from lm) and fm.id not in (select id from lm)),
  core as (select id from lm union select id from kids)
  select coalesce(array_agg(distinct x), '{}') from (
    select id as x from core
    union select fm.id from fm where fm.spouse_id in (select id from core)
    union select fm.spouse_id from fm where fm.id in (select id from core) and fm.spouse_id is not null
    union select fm.id from fm where fm.father_id is null and fm.mother_id is null and fm.spouse_id is null
      and not exists (select 1 from fm c where c.father_id = fm.id or c.mother_id = fm.id or c.spouse_id = fm.id)
    union select me
  ) v;
$$;

-- Every person the signed-in account may see, across all its family spaces.
create or replace function public.zy_visible_members()
returns uuid[] language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; out uuid[] := '{}';
begin
  if uid is null then return out; end if;
  for r in select fu.family_id, fu.clan_id, m.id as me
           from public.family_users fu left join public.members m on m.family_id = fu.family_id and m.user_id = uid
           where fu.user_id = uid loop
    if r.me is not null then
      out := out || public.zy_family_view(r.family_id, r.me, uid);
    elsif r.clan_id is not null then
      -- invited by one surname line and not yet "this is me": that line's big family, to pick yourself from
      out := out || array(
        with base as (select id from public.members where family_id = r.family_id and clan_id = r.clan_id)
        select id from base
        union select m.id from public.members m where m.family_id = r.family_id
          and (m.spouse_id in (select id from base) or m.mother_id in (select id from base)));
    else
      out := out || array(select id from public.members where family_id = r.family_id);
    end if;
  end loop;
  return out;
end $$;

-- The surname lines (clans) the signed-in account belongs to in one family space.
create or replace function public.zy_my_clans(fid uuid)
returns uuid[] language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); me uuid; inv uuid; out uuid[];
begin
  if not public.zy_is_member(fid) then return '{}'; end if;
  select id into me from public.members where family_id = fid and user_id = uid;
  if me is null then
    select clan_id into inv from public.family_users where family_id = fid and user_id = uid;
    if inv is not null then return array[inv]; end if;
    return array(select id from public.clans where family_id = fid);
  end if;
  select array_agg(distinct m.clan_id) into out from public.members m
    where m.id = any (public.zy_line_members(fid, me)) and m.clan_id is not null;
  return coalesce(out, '{}');
end $$;

-- Invitation codes for "my" surname lines: e.g. NG (father's side) and SIAH (mother's side).
create or replace function public.zy_my_invites(p_family uuid)
returns table (clan_id uuid, surname text, join_code text, clan_key text, people int)
language sql stable security definer set search_path = public as $$
  select c.id, c.surname, c.join_code, c.clan_key, (select count(*)::int from public.members m where m.clan_id = c.id)
  from public.clans c where c.family_id = p_family and c.id = any (public.zy_my_clans(p_family))
  order by 5 desc;
$$;

create or replace function public.zy_new_clan_code(p_clan uuid)
returns text language plpgsql security definer set search_path = public as $$
declare fid uuid; c text;
begin
  select family_id into fid from public.clans where id = p_clan;
  if fid is null or not (p_clan = any (public.zy_my_clans(fid))) then raise exception 'Not allowed'; end if;
  update public.clans set join_code = public.zy_code('', 8) where id = p_clan returning join_code into c;
  return c;
end $$;

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
declare fid uuid; cid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  select id into fid from public.families where join_code = upper(btrim(p_code));
  if fid is null then
    select family_id, id into fid, cid from public.clans where join_code = upper(btrim(p_code));
  end if;
  if fid is null then raise exception 'JOIN_CODE_NOT_FOUND'; end if;
  insert into public.family_users (family_id, user_id, role, email, clan_id) values (fid, uid, 'member', coalesce(auth.jwt() ->> 'email', ''), cid)
    on conflict (family_id, user_id) do update set clan_id = coalesce(public.family_users.clan_id, excluded.clan_id);
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
alter table public.messages enable row level security;

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

-- People: only the big families you belong to (see zy_visible_members).
drop policy if exists members_all on public.members;
drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated using (id = any ((select public.zy_visible_members())::uuid[]));
drop policy if exists members_add on public.members;
create policy members_add on public.members for insert to authenticated with check (public.zy_is_member(family_id));
drop policy if exists members_edit on public.members;
create policy members_edit on public.members for update to authenticated using (id = any ((select public.zy_visible_members())::uuid[])) with check (public.zy_is_member(family_id));
drop policy if exists members_remove on public.members;
create policy members_remove on public.members for delete to authenticated using (id = any ((select public.zy_visible_members())::uuid[]));

-- Photos: yours, untagged ones, and ones showing someone you can see.
drop policy if exists photos_all on public.photos;
drop policy if exists photos_read on public.photos;
create policy photos_read on public.photos for select to authenticated using (public.zy_is_member(family_id)
  and (uploaded_by = auth.uid() or tags = '{}' or tags && (select public.zy_visible_members())));
drop policy if exists photos_add on public.photos;
create policy photos_add on public.photos for insert to authenticated with check (public.zy_is_member(family_id));
drop policy if exists photos_edit on public.photos;
create policy photos_edit on public.photos for update to authenticated using (public.zy_is_member(family_id)
  and (uploaded_by = auth.uid() or tags = '{}' or tags && (select public.zy_visible_members()))) with check (public.zy_is_member(family_id));
drop policy if exists photos_remove on public.photos;
create policy photos_remove on public.photos for delete to authenticated using (public.zy_is_member(family_id)
  and (uploaded_by = auth.uid() or tags = '{}' or tags && (select public.zy_visible_members())));

drop policy if exists activity_read on public.activity;
create policy activity_read on public.activity for select to authenticated using (public.zy_is_member(family_id));
drop policy if exists activity_add on public.activity;
create policy activity_add on public.activity for insert to authenticated with check (public.zy_is_member(family_id));
-- Chat rooms: 'clan:<id>' is a surname line's group (only its big family); 'dm:<a>:<b>' only those two accounts; 'family' is the older whole-space room.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using (public.zy_is_member(family_id) and (room = 'family' or (room like 'dm:%' and position(auth.uid()::text in room) > 0)
    or (room like 'clan:%' and substr(room, 6)::uuid = any (public.zy_my_clans(family_id)))));
drop policy if exists messages_add on public.messages;
create policy messages_add on public.messages for insert to authenticated
  with check (public.zy_is_member(family_id) and sender = auth.uid() and (room = 'family' or (room like 'dm:%' and position(auth.uid()::text in room) > 0)
    or (room like 'clan:%' and substr(room, 6)::uuid = any (public.zy_my_clans(family_id)))));
drop policy if exists messages_remove on public.messages;
create policy messages_remove on public.messages for delete to authenticated using (sender = auth.uid());

-- Keys and join codes cannot be edited directly (join codes change only through zy_new_join_code).
grant usage on schema public to anon, authenticated;
grant select, delete on public.families to authenticated;
grant update (name) on public.families to authenticated;
grant select, delete on public.family_users to authenticated;
revoke select on public.clans from authenticated;
grant select (id, family_id, clan_key, surname, created_at) on public.clans to authenticated;
grant insert, delete on public.clans to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, delete on public.photos to authenticated;
grant update (path, title, album, taken_on, tags) on public.photos to authenticated;
grant select, insert on public.activity to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant execute on function public.zy_my_invites(uuid), public.zy_new_clan_code(uuid), public.zy_visible_members(), public.zy_my_clans(uuid) to authenticated;
grant execute on function public.zy_create_family(text, jsonb), public.zy_join_family(text), public.zy_link_me(uuid), public.zy_new_join_code(uuid), public.zy_set_role(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------- photo storage
insert into storage.buckets (id, name, public) values ('family-media', 'family-media', false)
  on conflict (id) do nothing;

-- Files live under <family id>/photos/…, <family id>/avatars/… and <family id>/chat/…; only that family can read or write them.
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
    begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  end if;
end $$;
