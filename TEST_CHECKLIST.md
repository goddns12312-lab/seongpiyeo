# 실제 동작 검증 체크리스트

## 🔧 사전 준비 사항

- [ ] Supabase 프로젝트 생성
- [ ] schema.sql 실행 (수정된 RLS 정책)
- [ ] Storage "listings" bucket 생성
- [ ] .env.local 파일 작성 (Supabase 정보 입력)
- [ ] `npm install` 실행
- [ ] `npm run dev` 실행

## 테스트 항목

### 1. 회원가입
- [ ] 폼 입력 가능
- [ ] 유효성 검증 (필수 필드)
- [ ] 회원가입 후 메인 페이지로 리다이렉트
- [ ] Supabase auth.users에 사용자 추가됨
- [ ] profiles 테이블에 프로필 추가됨
- [ ] 중복 닉네임 에러 표시

**수정 파일:** `supabase/schema.sql` (RLS 정책)

---

### 2. 로그인
- [ ] 폼 입력 가능
- [ ] 올바른 이메일/비밀번호 입력 시 성공
- [ ] 로그인 후 메인 페이지로 리다이렉트
- [ ] 헤더에 사용자 정보 표시
- [ ] 잘못된 비밀번호 시 에러 메시지

---

### 3. 로그아웃
- [ ] "로그아웃" 버튼 클릭 가능
- [ ] 로그아웃 후 메인 페이지로 리다이렉트
- [ ] 헤더가 "로그인", "회원가입" 버튼으로 변경
- [ ] 세션 쿠키 삭제됨

---

### 4. 매물 등록
- [ ] 로그인하지 않으면 /login으로 리다이렉트
- [ ] 폼 입력 가능 (필수, 선택 필드)
- [ ] 제출 시 로딩 상태 표시
- [ ] Supabase listings 테이블에 status='pending'으로 저장
- [ ] 등록 후 매물 상세페이지로 리다이렉트

**발생 가능한 문제:** Supabase 권한, Storage 설정

---

### 5. 이미지 업로드
- [ ] "파일 선택" 클릭 시 파일 대화상자 표시
- [ ] 이미지 선택 후 즉시 업로드 시작
- [ ] 업로드 중 로딩 상태 표시
- [ ] 업로드 완료 후 그리드에 미리보기 표시
- [ ] 각 이미지에 제거(X) 버튼 표시
- [ ] 여러 이미지 선택 가능
- [ ] 매물 저장 시 이미지도 함께 저장

**설정 필요:** Supabase Storage 정책 (SUPABASE_STORAGE_SETUP.md)

---

### 6. 매물 목록 조회
- [ ] /listings 페이지 로드됨
- [ ] 모든 status='active' 매물 표시
- [ ] 지역별 필터 버튼 표시 (17개)
- [ ] 카드 형태의 그리드 레이아웃
- [ ] 각 카드에 제목, 가격, 조회수, 날짜 표시
- [ ] 모바일에서 한 열, 데스크톱에서 세 열

---

### 7. 매물 상세페이지
- [ ] URL 패턴: /listings/[id]
- [ ] 동적 메타태그 생성 (페이지 소스에서 확인)
- [ ] 매물 정보 (제목, 가격, 위치, 설명) 표시
- [ ] 이미지 표시 (있으면)
- [ ] 판매자 정보 및 전화번호 표시
- [ ] "조회수" 증가 (DB 업데이트)
- [ ] 같은 지역 매물 링크 표시

---

### 8. 게시글 작성
- [ ] 로그인하지 않으면 /login으로 리다이렉트
- [ ] 카테고리 선택 가능 (4가지)
- [ ] 제목, 내용 입력 가능
- [ ] 제출 시 posts 테이블에 status='active'로 저장
- [ ] 등록 후 게시글 상세페이지로 리다이렉트
- [ ] /community에서 즉시 표시

**수정 파일:** `src/app/community/new/page.tsx` (Metadata 제거)

---

### 9. 댓글 작성
- [ ] 게시글 상세페이지 하단에 댓글 섹션 표시
- [ ] 로그인하지 않으면 로그인 유도 메시지
- [ ] 로그인 후 댓글 입력창 표시
- [ ] 댓글 제출 시 comments 테이블에 저장
- [ ] 페이지 새로고침 없이 실시간 업데이트
- [ ] 작성자 이름, 작성 시간 표시

---

### 10. 마이페이지
- [ ] URL: /mypage
- [ ] 로그인하지 않으면 /login으로 리다이렉트
- [ ] 사용자 프로필 정보 표시
- [ ] 등록한 매물 목록 (ListingCard 사용)
- [ ] 작성한 게시글 목록 (PostCard 사용)
- [ ] 통계 (매물 개수, 게시글 개수)
- [ ] 관리자 계정이면 "관리자 페이지" 링크 표시

---

### 11. 관리자 페이지 접근 제한
- [ ] 일반 사용자가 /admin 접속 시 `/`로 리다이렉트
- [ ] role='admin' 계정만 /admin 접근 가능
- [ ] /admin/listings 매물 승인/거절 가능
- [ ] /admin/posts 게시글 숨김 가능
- [ ] /admin/users 회원 목록 조회 가능
- [ ] /admin/banners 배너 추가/수정/삭제 가능

**관리자 계정 설정:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'test1@example.com';
```

---

### 12. Supabase Auth 세션 유지
- [ ] 로그인 후 페이지 새로고침 (F5) 시 세션 유지
- [ ] 브라우저 종료 후 재접속 시에도 세션 유지
- [ ] 다른 탭에서 로그인/로그아웃 시 실시간 동기화
- [ ] 헤더가 로그인/로그아웃 상태를 반영

**기술:**
- Supabase onAuthStateChange 리스너
- 쿠키 기반 세션 (SSR)

---

### 13. 모바일 반응형
- [ ] DevTools 반응형 모드 활성화

**모바일 (375px):**
- [ ] 메뉴가 햄버거 아이콘으로 표시
- [ ] 리스트가 한 열로 표시
- [ ] 버튼과 입력창이 충분히 큼 (터치 친화적)

**태블릿 (768px):**
- [ ] 리스트가 두 열로 표시
- [ ] 메뉴가 보이기 시작

**데스크톱 (1024px+):**
- [ ] 리스트가 세 열로 표시
- [ ] 메뉴가 전체 표시

---

### 14. sitemap.xml
- [ ] URL: http://localhost:3000/sitemap.xml
- [ ] 유효한 XML 형식
- [ ] 다음 URL 포함:
  - /
  - /listings
  - /community
  - /listings/region/* (모든 지역)
  - /listings/[id] (모든 활성 매물)
  - /community/[id] (모든 활성 게시글)
- [ ] 각 URL에 lastModified, changeFrequency, priority 포함

---

### 15. robots.txt
- [ ] URL: http://localhost:3000/robots.txt
- [ ] 텍스트 형식
- [ ] 다음 경로 차단:
  - /admin
  - /login
  - /register
  - /mypage
- [ ] Sitemap URL 포함: http://localhost:3000/sitemap.xml

---

## ⚠️ 주의사항

### localhost 하드코딩 확인
- ✅ 환경변수 사용 (NEXT_PUBLIC_BASE_URL)
- ✅ fallback으로만 'http://localhost:3000' 사용
- ✅ Link는 상대경로 사용
- ✅ router.push는 상대경로 사용

### Hydration Error 확인
- ✅ Header.tsx에서 loading 상태 체크
- ✅ useState/useEffect 사용하는 모든 컴포넌트에서 SSR 고려
- ✅ 'use client' 디렉티브 올바르게 사용

### Supabase 권한 확인
- ✅ RLS 정책 설정 (profiles, listings, posts, comments, banners)
- ✅ Storage 정책 설정 (listing_images)
- ✅ Auth Redirect URL 설정

---

## 🔄 재실행 명령어

```bash
# 의존성 재설치
npm install

# 캐시 삭제 후 개발 서버 재시작
rm -rf .next node_modules/.cache
npm run dev

# 프로덕션 빌드 테스트
npm run build
npm run start
```

---

## 📊 테스트 결과

테스트 날짜: _____
테스트자: _____

| 항목 | 상태 | 비고 |
|------|------|------|
| 1. 회원가입 | ✅/❌ | |
| 2. 로그인 | ✅/❌ | |
| 3. 로그아웃 | ✅/❌ | |
| 4. 매물 등록 | ✅/❌ | |
| 5. 이미지 업로드 | ✅/❌ | |
| 6. 매물 목록 | ✅/❌ | |
| 7. 매물 상세 | ✅/❌ | |
| 8. 게시글 작성 | ✅/❌ | |
| 9. 댓글 작성 | ✅/❌ | |
| 10. 마이페이지 | ✅/❌ | |
| 11. 관리자 제한 | ✅/❌ | |
| 12. 세션 유지 | ✅/❌ | |
| 13. 모바일 반응형 | ✅/❌ | |
| 14. sitemap.xml | ✅/❌ | |
| 15. robots.txt | ✅/❌ | |

**총 점수:** ___ / 15
