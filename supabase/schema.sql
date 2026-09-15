-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

-- 1. Table that stores all the editable wedding content.
-- There will only ever be ONE row (id = 1). The admin dashboard edits this row.
create table if not exists wedding_settings (
  id int primary key default 1,
  couple_name_a text not null default 'Amy',
  couple_name_b text not null default 'David',
  wedding_date timestamptz not null default '2026-10-24T16:00:00+07:00',
  eyebrow_tagline text not null default 'A day to remember. A love to keep.',
  venue_name text not null default 'The Glass House',
  venue_address text not null default 'Garden Estate',
  venue_maps_query text not null default 'The Glass House Garden Estate',
  ceremony_time text not null default '04:00 PM',
  reception_time text not null default '06:30 PM',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into wedding_settings (id) values (1)
  on conflict (id) do nothing;

-- 2. Table that stores every guest's RSVP submission.
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending text not null check (attending in ('yes', 'no')),
  guests int not null default 1,
  message text,
  created_at timestamptz not null default now()
);

-- 3. Row Level Security.
alter table wedding_settings enable row level security;
alter table rsvps enable row level security;

-- Anyone (anon) can READ the wedding settings — the public site needs this.
create policy "Public can read settings"
  on wedding_settings for select
  to anon
  using (true);

-- Only a logged-in admin can UPDATE the settings.
create policy "Authenticated can update settings"
  on wedding_settings for update
  to authenticated
  using (true)
  with check (true);

-- Anyone (anon) can INSERT an rsvp — guests are not logged in.
create policy "Public can submit rsvp"
  on rsvps for insert
  to anon
  with check (true);

-- Only a logged-in admin can READ the rsvp list.
create policy "Authenticated can read rsvps"
  on rsvps for select
  to authenticated
  using (true);

-- Only a logged-in admin can delete an rsvp (e.g. remove a test entry).
create policy "Authenticated can delete rsvps"
  on rsvps for delete
  to authenticated
  using (true);
