# 🚀 빠른 시작 가이드 (5분)

## Step 1: Supabase 설정 (2분)

### 1.1 프로젝트 생성
```
1. https://supabase.com 접속
2. "New Project" 클릭
3. Organization: Create new
4. Project name: pc-bang-community
5. Password: [생성 및 저장]
6. Region: 가까운 지역 선택
7. "Create new project" 클릭
```

### 1.2 데이터베이스 초기화
```
1. Supabase 대시보드 접속
2. SQL Editor → "New query" 클릭
3. 아래 SQL 전체 복사:
   - c:\Users\B\Desktop\aass\supabase\schema.sql
4. 붙여넣기 후 "Run" 클릭 (초록 버튼)
5. 완료 대기 (약 30초)
```

### 1.3 Storage 설정
```
1. Storage 메뉴 클릭
2. "Create new bucket" 클릭
3. Name: listings
4. Public: ON (체크박스)
5. "Create bucket" 클릭
```

### 1.4 Auth 설정
```
1. Settings → Auth → URL Configuration
2. Site URL: http://localhost:3000
3. Redirect URLs 추가:
   - http://localhost:3000/**
   - http://localhost:3000/auth/callback
4. "Save" 클릭
```

### 1.5 API 키 복사
```
Settings → API 클릭

다음 정보 복사:
- Project URL (https://xxx.supabase.co)
- Anon public key
- Service role secret key
```

---

## Step 2: 로컬 환경 설정 (2분)

### 2.1 환경변수 작성
```bash
cd c:\Users\B\Desktop\aass

# .env.local 파일 생성 (이미 생성됨)
# 다음 내용 수정:
```

`.env.local` 파일 편집:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2.2 의존성 설치 및 서버 시작
```bash
# 터미널에서
npm install

# 개발 서버 시작 (3000 포트)
npm run dev
```

---

## Step 3: 테스트 (1분)

### 3.1 브라우저 열기
```
http://localhost:3000 접속
```

### 3.2 회원가입 테스트
```
1. "회원가입" 클릭
2. 이메일: test@example.com
3. 닉네임: testuser
4. 비밀번호: Password123!
5. "회원가입" 클릭
```

### 3.3 로그인 테스트
```
1. "로그인" 클릭
2. 방금 가입한 계정으로 로그인
3. 헤더에 "마이페이지", "로그아웃" 표시 확인
```

### 3.4 매물 등록 테스트
```
1. "매물 등록" 클릭
2. 폼 작성
3. "매물 등록" 버튼 클릭
4. 매물 상세페이지로 리다이렉트 확인
```

---

## 🎯 문제 해결

### "RLS policy error"
→ Supabase의 schema.sql이 제대로 실행되었는지 확인
→ 수정된 schema.sql 사용 (profiles RLS 정책 변경됨)

### "Cannot find module '@supabase'"
→ npm install 다시 실행

### "이미지 업로드 실패"
→ Storage bucket이 Public으로 설정되었는지 확인
→ SUPABASE_STORAGE_SETUP.md 참고

### "localhost:3000 에서만 작동"
→ 정상 동작입니다 (NEXT_PUBLIC_BASE_URL 참고)
→ 서버 배포 시 IP로 변경됩니다

---

## ✅ 완료 확인 사항

- [ ] `npm run dev` 실행 시 에러 없음
- [ ] http://localhost:3000 접속 가능
- [ ] 회원가입 성공
- [ ] 로그인 성공
- [ ] 매물 등록 성공
- [ ] Supabase 데이터 저장 확인

---

## 🔗 다음 단계

1. **전체 테스트**: TEST_CHECKLIST.md 참고
2. **배포**: DEPLOYMENT.md 참고
3. **커스터마이징**: README.md 참고

---

## 📞 자주 묻는 질문

**Q: npm install에서 에러 발생**
A: Node.js 버전 확인 (18.0 이상 필요)
```bash
node --version
npm --version
```

**Q: Supabase 프로젝트가 느림**
A: 프로젝트 생성 후 1-2분 대기

**Q: 로그인 후 헤더가 변하지 않음**
A: 페이지 새로고침 (F5)

**Q: 이미지 업로드 안 됨**
A: Storage bucket이 Public인지 확인
```
Supabase → Storage → listings → 설정 → Public 활성화
```

**Q: 포트 3000이 이미 사용 중**
A: 다른 포트 사용
```bash
npm run dev -- -p 3001
```

---

## 💡 팁

- Supabase 데이터 실시간 확인: Supabase 대시보드 → Table Editor
- 로그 확인: 브라우저 DevTools → Console 탭
- SQL 오류 확인: Supabase SQL Editor → 실행 결과
