# 테트리스 배포 가이드 (Vercel)

## 1. 사전 준비

- **Supabase**: 이미 설정됨 (`config.js`의 URL/키)
- **Google 로그인**: 배포 URL을 Google Cloud Console **승인된 JavaScript 원본**에 추가해야 합니다.
  - 예: `https://your-project.vercel.app`

---

## 2. Vercel로 배포

### 방법 A: Vercel 웹 (Git 연동)

1. [vercel.com](https://vercel.com) 로그인
2. **Add New** → **Project**
3. GitHub/GitLab/Bitbucket에서 이 저장소 **Import**
4. **Root Directory**: 그대로 두고 **Deploy** 클릭
5. 배포 완료 후 나온 URL(예: `https://tetris-xxx.vercel.app`) 복사

### 방법 B: Vercel CLI

```bash
# CLI 설치 (한 번만)
npm i -g vercel

# 프로젝트 폴더에서
cd c:\cursor2\tetris
vercel login
vercel
```

프롬프트에서 설정은 기본값으로 두고 엔터.  
프로덕션 배포: `vercel --prod`

---

## 3. Google OAuth 설정 (배포 후 필수)

1. [Google Cloud Console](https://console.cloud.google.com) → **API 및 서비스** → **사용자 인증 정보**
2. 사용 중인 OAuth 2.0 클라이언트 ID 선택 → **편집**
3. **승인된 JavaScript 원본**에 배포 URL 추가  
   예: `https://tetris-xxx.vercel.app`
4. **config.js**의 `window.TETRIS_GOOGLE_ORIGIN`을 위 URL로 수정 후 다시 배포

---

## 4. 배포 URL 확인

- `config.js`의 `TETRIS_GOOGLE_ORIGIN`이 실제 배포 URL과 같아야 Google 로그인이 동작합니다.
- 현재 예시: `https://tetris-five-pi.vercel.app`  
  새로 배포한 도메인이 다르면 해당 줄만 바꾼 뒤 커밋/재배포하면 됩니다.
