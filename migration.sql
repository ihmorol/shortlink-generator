-- Create links table if it doesn't exist
create table if not exists public.links (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  slug text not null,
  original_url text not null,
  description text,
  clicks integer default 0,
  user_id text, -- Auth user ID (from Clerk)
  is_personalized boolean default false,
  is_deleted boolean default false,
  
  -- Constraints
  constraint links_slug_key unique (slug)
);

-- Add indices for performance
create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_slug_idx on public.links(slug);
create index if not exists links_is_deleted_idx on public.links(is_deleted);

-- Update existing rows if added columns partially (idempotent checks)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'links' and column_name = 'user_id') then
    alter table public.links add column user_id text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'links' and column_name = 'is_personalized') then
    alter table public.links add column is_personalized boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'links' and column_name = 'is_deleted') then
    alter table public.links add column is_deleted boolean default false;
  end if;
end $$;
