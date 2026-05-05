-- Run this in Supabase SQL Editor AFTER schema.sql
-- These RPC functions safely increment/decrement votes (prevents going below 0)

create or replace function increment_votes(row_id uuid)
returns void language sql as $$
  update ideas set votes = votes + 1 where id = row_id;
$$;

create or replace function decrement_votes(row_id uuid)
returns void language sql as $$
  update ideas set votes = greatest(0, votes - 1) where id = row_id;
$$;
