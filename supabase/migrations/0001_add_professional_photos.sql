-- Create professional_photos table
create table public.professional_photos (
  id uuid not null primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table public.professional_photos enable row level security;

-- Policies for professional_photos
create policy "Professional photos are viewable by everyone." on public.professional_photos for select using (true);
create policy "Professionals can insert their own photos." on public.professional_photos for insert with check (auth.uid() = professional_id);
create policy "Professionals can delete their own photos." on public.professional_photos for delete using (auth.uid() = professional_id);

-- Create storage bucket for photos
insert into storage.buckets (id, name, public)
values ('professional_photos', 'professional_photos', true);

-- Create policy for storage bucket
create policy "Professional photos are accessible to everyone"
on storage.objects for select
using ( bucket_id = 'professional_photos' );

create policy "Professionals can upload photos"
on storage.objects for insert
with check ( bucket_id = 'professional_photos' and auth.uid() = (storage.foldername(name))[1]::uuid );

create policy "Professionals can delete their own photos"
on storage.objects for delete
using ( bucket_id = 'professional_photos' and auth.uid() = (storage.foldername(name))[1]::uuid );