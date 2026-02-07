-- 테스트용 스코어 데이터 초기화 (Supabase 대시보드 SQL Editor에서 실행)
-- ⚠️ tetris_scores 테이블의 모든 행이 삭제됩니다. 실행 전 확인하세요.

TRUNCATE TABLE public.tetris_scores;

-- 실행 후: 테트리스 앱 스코어보드는 "기록 없음"으로 표시됩니다.
