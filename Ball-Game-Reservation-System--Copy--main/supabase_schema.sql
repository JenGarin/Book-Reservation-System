-- Enable UUID extension (if using older Postgres versions, otherwise gen_random_uuid() works natively)
create extension if not exists "uuid-ossp";

-- 1. Create Users Table
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text unique not null,
  name text not null,
  role text not null check (role in ('admin', 'staff', 'coach', 'player')),
  avatar text
);

-- 2. Create Courts Table
create table if not exists public.courts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  "courtNumber" text not null,
  type text not null,
  "surfaceType" text not null,
  "hourlyRate" numeric not null,
  "peakHourRate" numeric,
  status text not null default 'active',
  "operatingHours" jsonb not null default '{"start": "07:00", "end": "22:00"}'::jsonb
);

-- 3. Create Bookings Table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "courtId" uuid references public.courts(id),
  "userId" uuid references public.users(id),
  type text not null,
  date timestamp with time zone not null,
  "startTime" text not null,
  "endTime" text not null,
  duration integer not null,
  status text not null default 'confirmed',
  "paymentStatus" text not null default 'pending',
  amount numeric not null,
  "checkedIn" boolean default false,
  "checkedInAt" timestamp with time zone,
  notes text
);

-- 4. Insert Default Users
insert into public.users (email, name, role, avatar)
values
  ('admin@court.com', 'Admin User', 'admin', 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488&color=fff'),
  ('coach@court.com', 'Coach Mike', 'coach', 'https://ui-avatars.com/api/?name=Coach+Mike&background=0D9488&color=fff'),
  ('player@court.com', 'Alex Johnson', 'player', 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D9488&color=fff')
on conflict (email) do nothing;

-- 5. Insert Default Courts
insert into public.courts (name, "courtNumber", type, "surfaceType", "hourlyRate", "peakHourRate", "operatingHours")
values
  ('Center Court', '1', 'outdoor', 'hardcourt', 300, 450, '{"start": "06:00", "end": "22:00"}'),
  ('Court 2', '2', 'outdoor', 'clay', 300, 450, '{"start": "06:00", "end": "22:00"}'),
  ('Indoor Arena', '3', 'indoor', 'synthetic', 500, 700, '{"start": "08:00", "end": "23:00"}'),
  ('Training Court', '4', 'indoor', 'hardcourt', 400, 600, '{"start": "08:00", "end": "23:00"}');