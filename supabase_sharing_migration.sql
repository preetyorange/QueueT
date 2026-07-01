-- Step 1: Add visibility column to boards table
alter table boards add column if not exists visibility text not null default 'restricted';

-- Step 2: Create board_members table
create table if not exists board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  user_email text not null,
  created_at timestamptz default now(),
  unique (board_id, user_email)
);

-- Enable RLS on board_members
alter table board_members enable row level security;

-- Step 3: Re-create RLS Policies on boards, board_members, columns, and cards

-- Drop existing general access policies
drop policy if exists "authenticated users can do anything on boards" on boards;
drop policy if exists "authenticated users can do anything on columns" on columns;
drop policy if exists "authenticated users can do anything on cards" on cards;

-- Drop new policies to allow clean rerunning
drop policy if exists "select_boards" on boards;
drop policy if exists "insert_boards" on boards;
drop policy if exists "update_boards" on boards;
drop policy if exists "delete_boards" on boards;
drop policy if exists "select_board_members" on board_members;
drop policy if exists "insert_board_members" on board_members;
drop policy if exists "delete_board_members" on board_members;
drop policy if exists "all_columns" on columns;
drop policy if exists "all_cards" on cards;

-- Policies for boards table
create policy "select_boards" on boards for select
  using (
    created_by = auth.email() or
    visibility = 'anyone_with_link' or
    exists (
      select 1 from board_members
      where board_members.board_id = boards.id and board_members.user_email = auth.email()
    )
  );

create policy "insert_boards" on boards for insert
  with check (auth.role() = 'authenticated');

create policy "update_boards" on boards for update
  using (created_by = auth.email())
  with check (created_by = auth.email());

create policy "delete_boards" on boards for delete
  using (created_by = auth.email());

-- Policies for board_members table
create policy "select_board_members" on board_members for select
  using (auth.role() = 'authenticated');

create policy "insert_board_members" on board_members for insert
  with check (
    exists (
      select 1 from boards
      where boards.id = board_id and boards.created_by = auth.email()
    )
  );

create policy "delete_board_members" on board_members for delete
  using (
    exists (
      select 1 from boards
      where boards.id = board_id and boards.created_by = auth.email()
    )
  );

-- Policies for columns table
create policy "all_columns" on columns for all
  using (
    exists (
      select 1 from boards
      where boards.id = board_id and (
        boards.created_by = auth.email() or
        boards.visibility = 'anyone_with_link' or
        exists (
          select 1 from board_members
          where board_members.board_id = boards.id and board_members.user_email = auth.email()
        )
      )
    )
  );

-- Policies for cards table
create policy "all_cards" on cards for all
  using (
    exists (
      select 1 from columns
      join boards on boards.id = columns.board_id
      where columns.id = column_id and (
        boards.created_by = auth.email() or
        boards.visibility = 'anyone_with_link' or
        exists (
          select 1 from board_members
          where board_members.board_id = boards.id and board_members.user_email = auth.email()
        )
      )
    )
  );
