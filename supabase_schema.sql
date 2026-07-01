-- Run this once in your Supabase project's SQL Editor (Project > SQL Editor > New query)

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references columns(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium',
  due_date date,
  position int not null default 0,
  created_by text,
  created_at timestamptz default now()
);

-- Enable realtime on all three tables
alter publication supabase_realtime add table boards;
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table cards;

-- Row Level Security
alter table boards enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;

-- Simple policy: any signed-in user can read/write everything.
-- Fine for a demo/portfolio project. A production version would scope
-- rows to workspace membership instead of "any authenticated user."
create policy "authenticated users can do anything on boards"
  on boards for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated users can do anything on columns"
  on columns for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated users can do anything on cards"
  on cards for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
