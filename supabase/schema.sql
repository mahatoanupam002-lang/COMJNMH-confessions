-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- IDEAS table: stores every submission
create table if not exists ideas (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  description   text        not null,
  category      text        not null check (category in ('governance','safety','academic','infrastructure','welfare')),
  author        text        not null default 'Anonymous',
  role          text        not null default '',
  feasibility   int         not null default 50 check (feasibility between 0 and 100),
  votes         int         not null default 1 check (votes >= 0),
  -- Instagram
  instagram_posted   boolean   not null default false,
  instagram_post_id  text,
  instagram_error    text,
  created_at    timestamptz not null default now()
);

create index if not exists ideas_votes_idx       on ideas (votes desc);
create index if not exists ideas_created_idx     on ideas (created_at desc);
create index if not exists ideas_instagram_idx   on ideas (instagram_posted);

-- VOTES table: prevents the same IP from voting twice on the same idea
create table if not exists votes (
  id          uuid        primary key default gen_random_uuid(),
  idea_id     uuid        not null references ideas(id) on delete cascade,
  fingerprint text        not null,
  created_at  timestamptz not null default now(),
  unique (idea_id, fingerprint)
);

create index if not exists votes_idea_idx on votes (idea_id);

-- Disable Row Level Security (we use service_role key server-side only)
alter table ideas disable row level security;
alter table votes disable row level security;

-- ── Optional seed data (the original 7 ideas) ────────────────────────────────
insert into ideas (title, description, category, author, role, feasibility, votes) values
(
  'Outsource hostel and campus facility management to a private contractor',
  'The administration is not equipped to run facilities. Outsourcing hostel maintenance, groundskeeping, and pest control to a professional FM company (like what newer AIIMS campuses do) removes this from the medical college''s plate entirely. NMC doesn''t prohibit this. Cost can be built into hostel fees.',
  'infrastructure', 'Anonymous Resident', 'PG Resident', 78, 47
),
(
  'Mandatory HoD rotation every 3 years with performance review',
  'Several department heads have held their chairs for 8–12 years. Stale leadership = stale departments. Institute a formal rotation policy tied to CBME and research output benchmarks. AIIMS Delhi does this. We should too.',
  'governance', 'Junior Faculty', 'Junior Faculty', 45, 38
),
(
  'Emergency snake response protocol + habitat removal drive',
  'This is a physical safety issue that has persisted for years. Immediate fix: empanel a professional pest control/wildlife service. Medium term: clear overgrown vegetation in a 100m radius around hostels. This costs less than ₹2L and could be done in a week. The delay is purely administrative will.',
  'safety', '3rd Year Student', 'MBBS Student (Clinical)', 90, 31
),
(
  'Digital grievance portal with mandatory 14-day resolution SLA',
  'Current system: complain to warden → warden files report → nothing. Proposed: an online portal where complaints are timestamped, assigned to a named responsible officer, and tracked publicly. Resolution SLAs enforced via NMC e-governance mandate. No new budget needed — just implementation.',
  'governance', 'Anonymous Student', 'MBBS Student (Phase II)', 62, 24
),
(
  'Quarterly guest lecture series from AIIMS Kalyani faculty',
  'AIIMS Kalyani is 10 minutes away. A formal MoU for quarterly joint seminars and case conference sharing would cost almost nothing but dramatically update clinical exposure. Use AIIMS''s infrastructure for teaching labs we lack. This is a massive underutilized proximity advantage.',
  'academic', 'Senior Faculty', 'Senior Faculty', 70, 18
),
(
  'Decentralize minor maintenance budgets to department level',
  'Departments currently wait months for a ₹5000 repair because everything routes through central admin. Give each department a small discretionary maintenance budget (₹20–50k/year) for non-capital items. Faster turnaround, less bottleneck, more accountability at department level.',
  'infrastructure', 'Anonymous Faculty', 'Junior Faculty', 55, 12
),
(
  'Student representation on college academic committee',
  'No state college in WB has formal student reps on the academic committee. This is not required by WBUHS rules but is not prohibited either. One elected student from each batch, non-voting observer status, to surface ground realities the administration systematically fails to hear.',
  'governance', 'Anonymous', 'MBBS Student (Clinical)', 38, 8
);
