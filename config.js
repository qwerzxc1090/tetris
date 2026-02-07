// =============================================================================
// 테트리스 프로젝트 설정 (Supabase + Google 로그인)
// =============================================================================

// --- Supabase ---
window.TETRIS_SUPABASE_URL = 'https://hnsmekxijiugrygwjmfb.supabase.co';
window.TETRIS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhuc21la3hpaml1Z3J5Z3dqbWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTYxNDUsImV4cCI6MjA4NTY3MjE0NX0.-f3hT9X1u-OzCNBealPnv2AvTe5cFGJw08RA2Ay-oDw';

// --- Google OAuth (Google Cloud Console에 입력할 값) ---
// 아래 값을 Google Cloud Console > API 및 서비스 > 사용자 인증 정보 > OAuth 2.0 클라이언트 ID
// > 해당 클라이언트 편집 화면에서 그대로 사용합니다.

// 1) 승인된 JavaScript 원본 (브라우저 요청에 사용)
//    - 로컬: 파일 직접 열기 시에는 file:// 은 사용 불가. 로컬 서버 주소를 넣으세요.
//    - 예: http://localhost:5500 (Live Server), http://127.0.0.1:5500, 또는 배포 URL (https://...)
window.TETRIS_GOOGLE_ORIGIN = 'https://tetris-five-pi.vercel.app';

// 2) 승인된 리디렉션 URI (웹 서버 요청에 사용) — Supabase 고정값, 변경하지 마세요.
//    Google 콘솔에 넣을 값 예: https://hnsmekxijiugrygwjmfb.supabase.co/auth/v1/callback
window.TETRIS_GOOGLE_REDIRECT_URI = window.TETRIS_SUPABASE_URL + '/auth/v1/callback';
