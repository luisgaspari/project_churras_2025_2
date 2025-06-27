-- Create user_type enum
create type public.user_type as enum ('client', 'professional');

-- Create profiles table
create table public.profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  user_type public.user_type not null,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  location text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create services table
create table public.services (
  id uuid not null primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price_from numeric not null,
  price_to numeric,
  duration_hours integer not null,
  max_guests integer not null,
  location text not null,
  images text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create booking_status enum
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

-- Create bookings table
create table public.bookings (
  id uuid not null primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  event_date date not null,
  event_time time not null,
  guests_count integer not null,
  location text not null,
  status public.booking_status not null default 'pending',
  total_price numeric not null,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- Policies for services
create policy "Services are viewable by everyone." on public.services for select using (true);
create policy "Professionals can create services." on public.services for insert with check (auth.uid() = professional_id);
create policy "Professionals can update their own services." on public.services for update using (auth.uid() = professional_id);
create policy "Professionals can delete their own services." on public.services for delete using (auth.uid() = professional_id);

-- Policies for bookings
create policy "Users can view their own bookings." on public.bookings for select using (auth.uid() = client_id or auth.uid() = professional_id);
create policy "Clients can create bookings." on public.bookings for insert with check (auth.uid() = client_id);
create policy "Users can update their own bookings." on public.bookings for update using (auth.uid() = client_id or auth.uid() = professional_id);