-- 테트리스 최고 기록용 테이블 (Supabase 대시보드 SQL Editor에서 실행)
create table if not exists public.tetris_scores (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null default 'Player',
  score bigint not null,
  created_at timestamptz not null default now()
);

-- [기존 테이블만 있을 때] player_id 컬럼 추가 (새 테이블이 아니라 예전에 만든 경우 아래 한 줄만 SQL Editor에서 실행)
-- alter table public.tetris_scores add column player_id text not null default '';

-- 상위 10개 조회용 인덱스
create index if not exists tetris_scores_score_desc on public.tetris_scores (score desc);

-- RLS: 누구나 읽기, 누구나 삽입 (anon)
alter table public.tetris_scores enable row level security;

drop policy if exists "Allow read tetris_scores" on public.tetris_scores;
create policy "Allow read tetris_scores" on public.tetris_scores for select using (true);

drop policy if exists "Allow insert tetris_scores" on public.tetris_scores;
create policy "Allow insert tetris_scores" on public.tetris_scores for insert with check (true);
