# Supabase URL 설정 (localhost 연결 거부 해결)

Google 로그인 후 **"localhost 연결을 거부했습니다"** 가 나오면, Supabase의 **Site URL** 이 localhost로 되어 있기 때문입니다.

---

## 수정 방법

1. **Supabase 대시보드** 접속  
   https://supabase.com/dashboard → 테트리스 프로젝트 선택

2. 왼쪽 메뉴 **Authentication** → **URL Configuration**

3. 아래처럼 설정 후 **Save** 클릭

   | 항목 | 설정할 값 |
   |------|-----------|
   | **Site URL** | `https://tetris-five-pi.vercel.app` |
   | **Redirect URLs** | 아래 목록에 추가 |

   **Redirect URLs** 에 추가할 줄:
   ```
   https://tetris-five-pi.vercel.app
   https://tetris-five-pi.vercel.app/**
   ```

4. 저장 후 **https://tetris-five-pi.vercel.app** 에서 다시 Google 로그인 시도

---

## 이유

- 로그인 성공 후 Supabase가 사용자를 **Site URL** 로 보냅니다.
- Site URL이 `http://localhost:5500` 이면 → 로컬 서버가 없을 때 **연결 거부** 발생.
- 배포 사이트로 쓰는 경우 **Site URL = 배포 URL** 로 두어야 합니다.
