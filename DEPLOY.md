# 테트리스 배포 가이드 (GitHub + Vercel)

## 1. GitHub 저장소에 올리기

- **저장소**: `https://github.com/qwerzxc1090/tetris`
- 최신 코드는 이미 `main` 브랜치에 푸시된 상태입니다.
- 로컬에서 추가 수정 후 푸시:
  ```bash
  cd c:\cursor2\tetris
  git add -A
  git commit -m "메시지"
  git push origin main
  ```

---

## 2. Vercel 연동 및 배포

### Vercel 웹에서 GitHub 연동 (권장)

1. **[vercel.com](https://vercel.com)** 접속 후 로그인 (GitHub 계정으로 로그인 가능)
2. **Add New** → **Project** 클릭
3. **Import Git Repository**에서 **qwerzxc1090/tetris** 선택 (또는 저장소 검색)
4. **Import** 클릭
5. 설정 확인:
   - **Framework Preset**: Other (또는 그대로)
   - **Root Directory**: 비워 두기 (프로젝트 루트가 저장소 루트)
   - **Build and Output Settings**: 수정 없이 사용 (정적 파일만 있음)
6. **Deploy** 클릭
7. 배포가 끝나면 **Visit** 또는 표시된 URL(예: `https://tetris-xxx.vercel.app`)로 접속

이후 GitHub에 푸시할 때마다 Vercel이 자동으로 재배포합니다.

### Vercel CLI로 배포 (선택)

```bash
npm i -g vercel
cd c:\cursor2\tetris
vercel login
vercel
```

프롬프트에서 설정은 기본값으로 두고 엔터. 프로덕션 배포: `vercel --prod`

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
