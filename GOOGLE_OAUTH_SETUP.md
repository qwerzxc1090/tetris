# Google 로그인 설정 (Google Cloud Console)

config.js에 설정한 값을 **Google Cloud Console**의 OAuth 클라이언트 ID 설정에 넣으세요.

---

## 1. 승인된 JavaScript 원본 (Authorized JavaScript origins)

**설명:** 브라우저 요청에 사용

| 항목 | 입력할 값 |
|------|-----------|
| URI 1 | `config.js`의 **TETRIS_GOOGLE_ORIGIN** 값 |

- 예: `http://localhost:5500` (Live Server 사용 시)
- 배포 시: `https://your-domain.com` 형태로 변경 후 config.js 수정

---

## 2. 승인된 리디렉션 URI (Authorized redirect URIs)

**설명:** 웹 서버의 요청에 사용

| 항목 | 입력할 값 |
|------|-----------|
| URI 1 | `config.js`의 **TETRIS_GOOGLE_REDIRECT_URI** 값 (Supabase 콜백) |

- 현재 프로젝트 기준: `https://hnsmekxijiugrygwjmfb.supabase.co/auth/v1/callback`
- Supabase URL을 바꾼 경우 config.js의 `TETRIS_SUPABASE_URL`에 맞춰 자동으로 이 값이 정해집니다.

---

## 설정 순서

1. **config.js**에서 `TETRIS_GOOGLE_ORIGIN`을 실제 사용하는 주소로 수정 (로컬 서버 또는 배포 URL).
2. Google Cloud Console → **API 및 서비스** → **사용자 인증 정보** → 사용 중인 **OAuth 2.0 클라이언트 ID** 선택.
3. **승인된 JavaScript 원본**에 `TETRIS_GOOGLE_ORIGIN` 값 1개 추가 (예: `http://localhost:5500`).
4. **승인된 리디렉션 URI**에 `TETRIS_GOOGLE_REDIRECT_URI` 값 1개 추가 (예: `https://hnsmekxijiugrygwjmfb.supabase.co/auth/v1/callback`).
5. **저장** 후 Supabase 대시보드에서 Google Provider에 해당 클라이언트 ID/비밀 입력.

이렇게 하면 이미지에 나온 두 필드(JavaScript 원본, 리디렉션 URI)를 config 기반으로 일관되게 설정할 수 있습니다.
