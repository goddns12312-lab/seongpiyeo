# 배포 가이드

## 빠른 시작 (로컬)

```bash
# 1. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정

# 2. 의존성 설치
npm install

# 3. 개발 서버 시작
npm run dev
# http://localhost:3000 접속
```

## 서버 배포 (185.100.85.208)

### 1단계: 서버 준비

```bash
# SSH로 서버 접속
ssh user@185.100.85.208

# 시스템 업데이트
sudo apt update
sudo apt upgrade -y

# Node.js 설치 (이미 설치되어 있으면 스킵)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 설치
sudo npm install -g pm2

# Nginx 설치 (이미 설치되어 있으면 스킵)
sudo apt install -y nginx
```

### 2단계: 프로젝트 배포

```bash
# 프로젝트 디렉토리로 이동 (또는 새로 생성)
cd /home/user
mkdir -p pc-bang-community
cd pc-bang-community

# 저장소에서 코드 클론 (또는 로컬에서 업로드)
git clone <your-repository-url> .
# 또는 로컬 파일 업로드
# scp -r . user@185.100.85.208:/home/user/pc-bang-community

# 환경 변수 설정
cp .env.example .env.local
nano .env.local  # 또는 vi .env.local

# 아래 내용 확인:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# NEXT_PUBLIC_BASE_URL=http://185.100.85.208

# 의존성 설치
npm ci  # npm install 대신 ci 사용 권장

# 프로덕션 빌드
npm run build
```

### 3단계: PM2 설정

```bash
# PM2로 앱 시작
pm2 start ecosystem.config.js

# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs pc-bang

# 부팅 시 자동 시작 설정
pm2 startup
pm2 save

# (생성된 스크립트 실행)
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u user --hp /home/user
pm2 save
```

### 4단계: Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/pc-bang-community

# 아래 내용 추가:
```

```nginx
server {
    listen 80;
    server_name 185.100.85.208 _;

    # 최대 업로드 크기 설정 (이미지 업로드용)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 정적 파일 캐싱
    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public/ {
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

```bash
# Nginx 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/pc-bang-community /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 시작/재시작
sudo systemctl restart nginx

# Nginx 상태 확인
sudo systemctl status nginx
```

### 5단계: SSL/TLS 설정 (HTTPS, 선택사항)

```bash
# Let's Encrypt 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot certonly --nginx -d 185.100.85.208

# Nginx 설정에 SSL 추가
sudo nano /etc/nginx/sites-available/pc-bang-community

# 아래 내용으로 업데이트:
```

```nginx
server {
    listen 80;
    server_name 185.100.85.208;
    
    # HTTP를 HTTPS로 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 185.100.85.208;

    ssl_certificate /etc/letsencrypt/live/185.100.85.208/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/185.100.85.208/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public/ {
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

```bash
# Nginx 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx

# SSL 자동 갱신 설정
sudo certbot renew --dry-run
```

## 배포 후 확인

### 1. 기본 접속 확인

```bash
# 브라우저에서 접속
http://185.100.85.208

# 또는 명령줄에서
curl http://185.100.85.208
```

### 2. 서비스 상태 확인

```bash
# PM2 상태
pm2 status

# Nginx 상태
sudo systemctl status nginx

# 로그 확인
pm2 logs pc-bang
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 3. Supabase 설정 확인

1. Supabase 대시보드 접속
2. Authentication → Redirect URLs에 추가:
   - `http://185.100.85.208/**`
   - `http://185.100.85.208/auth/callback`

## 유지보수

### 앱 업데이트

```bash
cd /home/user/pc-bang-community

# 최신 코드 가져오기
git pull

# 의존성 업데이트
npm ci

# 빌드
npm run build

# PM2 재시작
pm2 restart pc-bang
```

### 로그 확인

```bash
# 실시간 로그
pm2 logs pc-bang

# 특정 수의 로그 라인 보기
pm2 logs pc-bang --lines 100
```

### 성능 모니터링

```bash
# 프로세스 모니터링
pm2 monit

# 상세 정보
pm2 show pc-bang
```

### PM2 명령어

```bash
# 앱 시작
pm2 start pc-bang

# 앱 중지
pm2 stop pc-bang

# 앱 재시작
pm2 restart pc-bang

# 앱 삭제
pm2 delete pc-bang

# 모든 앱 시작
pm2 start all

# 모든 앱 중지
pm2 stop all
```

## 문제 해결

### 포트 1000 이미 사용 중

```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3000

# 프로세스 종료 (필요시)
sudo kill -9 <PID>
```

### Nginx 에러

```bash
# 설정 문법 확인
sudo nginx -t

# 자세한 에러 로그 확인
sudo journalctl -u nginx -n 50

# Nginx 다시 시작
sudo systemctl restart nginx
```

### 메모리 부족

```bash
# 메모리 사용량 확인
free -h

# PM2 최대 메모리 설정 (ecosystem.config.js에서)
max_memory_restart: '500M'

# 설정 후 재시작
pm2 restart all
```

### Supabase 연결 오류

```bash
# .env.local 확인
cat .env.local

# 올바른 URL/Key 입력 후 재빌드
npm run build
pm2 restart pc-bang
```

## 도메인 설정 (선택사항)

### DNS 레코드 설정

도메인 관리 패널에서:

```
Type: A
Name: @ (또는 www)
Value: 185.100.85.208
TTL: 3600
```

### Nginx 설정 업데이트

```nginx
server_name example.com www.example.com;
```

## 백업

### 데이터베이스 백업

Supabase는 자동 백업을 제공합니다. 대시보드에서 확인 가능합니다.

### 수동 백업

```bash
# 환경 변수 백업
cp .env.local /backup/.env.local.backup

# 데이터베이스 덤프
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
```

## 주의사항

1. **환경 변수 보호**: `.env.local` 파일은 서버에만 있어야 하며, 절대 git에 커밋하지 마세요.
2. **정기적 업데이트**: npm 패키지 정기적으로 업데이트
3. **로그 모니터링**: 정기적으로 에러 로그 확인
4. **성능 모니터링**: PM2와 Nginx 로그를 통해 성능 모니터링
