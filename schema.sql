-- ===== কোড ক্লাস: Supabase টেবিল + Row Level Security =====
-- Supabase Dashboard > SQL Editor > New query-তে পুরোটা পেস্ট করে Run চাপুন (একবারই চালাবেন)।

-- ---------- ১) টেবিল ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 30),
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  -- বন্ধুরা এই ৬ অক্ষরের কোড দিয়ে গ্রুপে ঢোকে
  join_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- একটি মেসেজ হয় ব্যক্তিকে (recipient_id), নয়তো গ্রুপে (group_id): দুটোর একটাই থাকবে
create table public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check ((recipient_id is null) <> (group_id is null))
);
create index on public.messages (recipient_id, created_at);
create index on public.messages (group_id, created_at);
create index on public.messages (sender_id, created_at);

-- ---------- ২) সাইন-আপ করলে অটো প্রোফাইল ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare u text;
begin
  u := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1));
  if exists (select 1 from public.profiles where lower(username) = lower(u)) then
    u := u || '-' || substr(new.id::text, 1, 4);      -- একই নাম থাকলে শেষে কয়েকটা অক্ষর জুড়ে দেয়
  end if;
  insert into public.profiles (id, username) values (new.id, u);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- ৩) সাহায্যকারী ফাংশন ----------
-- "আমি কি এই গ্রুপের সদস্য?" (RLS-এ ব্যবহার হয়)
create or replace function public.is_member(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid());
$$;

-- গ্রুপ বানানো: গ্রুপ + নিজেকে সদস্য করা একসাথে
create or replace function public.create_group(gname text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare g public.groups;
begin
  if auth.uid() is null then raise exception 'আগে লগইন করুন'; end if;
  insert into public.groups (name, created_by) values (trim(gname), auth.uid()) returning * into g;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid());
  return g;
end $$;

-- কোড দিয়ে গ্রুপে ঢোকা
create or replace function public.join_group(code text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare g public.groups;
begin
  if auth.uid() is null then raise exception 'আগে লগইন করুন'; end if;
  select * into g from public.groups where join_code = upper(trim(code));
  if not found then raise exception 'কোডটি ভুল'; end if;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return g;
end $$;

-- শুধু লগইন করা ইউজার এই ফাংশন চালাতে পারবে
revoke execute on function public.is_member(uuid), public.create_group(text), public.join_group(text) from public, anon;
grant  execute on function public.is_member(uuid), public.create_group(text), public.join_group(text) to authenticated;

-- ---------- ৪) Row Level Security ----------
alter table public.profiles      enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.messages      enable row level security;

-- প্রোফাইল: লগইন করা সবাই ইউজারনেম দেখতে পারে (নইলে মেসেজ পাঠানো যাবে না), বদলাতে পারে শুধু নিজেরটা
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- গ্রুপ: শুধু সদস্যরা দেখে। বানানো/ঢোকা হয় উপরের ফাংশন দিয়ে, সরাসরি insert বন্ধ।
create policy groups_select_members on public.groups for select to authenticated using (public.is_member(id));

-- সদস্য তালিকা: নিজের সদস্যপদ এবং নিজের গ্রুপের সবার নাম দেখা যায়; শুধু নিজে গ্রুপ ছাড়তে পারে
create policy gm_select on public.group_members for select to authenticated
  using (user_id = auth.uid() or public.is_member(group_id));
create policy gm_leave on public.group_members for delete to authenticated using (user_id = auth.uid());

-- মেসেজ: নিজের পাঠানো, নিজের কাছে আসা, আর নিজের গ্রুপের মেসেজই শুধু দেখা যায়
create policy msg_select on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid() or (group_id is not null and public.is_member(group_id)));
-- পাঠানো: নিজের নামে, আর গ্রুপ হলে সদস্য হতে হবে। এডিট/ডিলিট বন্ধ।
create policy msg_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and (recipient_id is not null or public.is_member(group_id)));

-- ---------- ৫) Realtime চালু ----------
alter publication supabase_realtime add table public.messages;
