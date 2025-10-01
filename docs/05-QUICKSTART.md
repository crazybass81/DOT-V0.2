# DOT Platform V0.2 - 빠른 시작 가이드

## 🚀 개요

DOT Platform V0.2는 마이크로 앱 아키텍처 기반의 확장 가능한 플랫폼입니다. 이 가이드를 통해 **30-45분** 내에 플랫폼을 설정하고 실행할 수 있습니다.

### 이 가이드로 할 수 있는 것
- ✅ 플랫폼 셸 실행 및 확인
- ✅ 기본 API 엔드포인트 테스트
- ✅ 마이크로 앱 구조 이해
- ✅ 개발 환경 완전 설정

### 이 가이드로 할 수 없는 것 (의도적으로 제외)
- ❌ 실제 로그인/회원가입 기능
- ❌ 근태관리나 커뮤니티 등 세부 앱
- ❌ 프로덕션 배포

---

## 📋 사전 요구사항

### 개발 환경
- **Node.js**: 18.17+ (권장: 20.x)
- **npm**: 9+ 또는 **yarn**: 3.x+
- **Git**: 2.40+

### 필수 계정
- **Supabase 계정**: [supabase.com](https://supabase.com)에서 무료 계정 생성
- **GitHub 계정**: 코드 저장소 관리용

### 권장 도구
```bash
# Claude Code (AI 개발 도구)
npm install -g @anthropic/claude-code

# Supabase CLI
npm install -g supabase

# Vercel CLI (배포용, 선택사항)
npm install -g vercel
```

---

## 🛠️ 1단계: 프로젝트 초기 설정

### 저장소 클론 및 의존성 설치
```bash
# 저장소 클론 (실제 구현 후 URL 업데이트 필요)
git clone https://github.com/your-org/DOT-V0.2.git
cd DOT-V0.2

# 의존성 설치
npm install

# 환경 변수 템플릿 복사
cp .env.example .env.local
```

### 프로젝트 구조 확인
설치 후 다음과 같은 구조를 확인할 수 있습니다:
```
DOT-V0.2/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 엔드포인트
│   │   └── apps/              # 마이크로 앱 영역
│   ├── components/
│   │   ├── platform/          # 플랫폼 셸 컴포넌트
│   │   ├── layout/            # 레이아웃 컴포넌트
│   │   └── ui/                # 공통 UI 컴포넌트
│   └── lib/
│       ├── auth/              # 인증 서비스
│       ├── state/             # 상태 관리 (Zustand)
│       ├── router/            # 동적 라우팅
│       └── mcp/               # MCP 통합
├── docs/                       # 프로젝트 문서
├── config/                     # 설정 파일
└── supabase/                   # 데이터베이스 마이그레이션
    └── migrations/
```

---

## 🗄️ 2단계: Supabase 데이터베이스 설정

### Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com)에서 로그인
2. "New project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: DOT Platform V0.2
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: Asia Northeast (Seoul) 권장

### 환경 변수 설정
`.env.local` 파일을 열어 Supabase 정보 입력:

```bash
# Supabase 설정 (프로젝트 Settings > API에서 확인)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 애플리케이션 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_VERSION=1.0.0
NODE_ENV=development

# MCP 서버 설정 (개발용)
MCP_SERVERS_CONFIG_PATH=./config/mcp-servers.json
MCP_ENABLED=true

# JWT 토큰 설정 (임의의 복잡한 문자열)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# 로깅
LOG_LEVEL=info
ENABLE_ANALYTICS=false
```

### 데이터베이스 스키마 생성
```bash
# Supabase 프로젝트 연결
supabase login
supabase link --project-ref your_project_ref

# 데이터베이스 마이그레이션 실행
supabase db push

# 스키마 확인
supabase db diff --linked
```

**성공 확인**: Supabase 대시보드의 Table Editor에서 다음 테이블들이 생성되었는지 확인:
- `platforms` (플랫폼 설정)
- `apps` (앱 레지스트리)
- `user_apps` (사용자-앱 관계)
- `user_profiles` (사용자 프로필)
- `app_data` (앱 데이터)
- `app_permissions` (앱 권한)
- `app_sessions` (앱 세션)
- `app_logs` (앱 로그)

---

## 🚀 3단계: 개발 서버 실행

### 기본 실행
```bash
# 개발 서버 시작
npm run dev
```

**성공 확인**: 브라우저에서 `http://localhost:3000` 접속 시 플랫폼 셸이 표시되어야 합니다.

### 고급 실행 (MCP 서버 포함)
```bash
# MCP 서버들과 함께 실행 (권장)
npm run dev:full

# 또는 개별적으로
npm run mcp:start    # MCP 서버 시작
npm run dev          # Next.js 개발 서버 시작
```

### 실행 확인
다음 URL들에서 응답을 확인:
- **플랫폼 셸**: http://localhost:3000
- **플랫폼 정보 API**: http://localhost:3000/api/platform/info
- **앱 목록 API**: http://localhost:3000/api/apps

---

## 🎯 4단계: 플랫폼 기능 확인

### 플랫폼 셸 확인
브라우저에서 다음 요소들이 정상 렌더링되는지 확인:

1. **헤더 영역**:
   - 플랫폼 로고/이름
   - 사용자 메뉴 (로그인 상태 표시)
   - 알림 아이콘

2. **사이드바 네비게이션**:
   - 대시보드 메뉴
   - 설치된 앱 목록
   - 앱 스토어 링크

3. **메인 컨텐츠 영역**:
   - 앱 컨테이너 (현재는 환영 메시지)
   - 동적 라우팅 준비 상태

4. **하단 상태바** (선택사항):
   - 플랫폼 상태
   - MCP 서버 연결 상태

### API 엔드포인트 테스트

**1. 플랫폼 정보 조회**
```bash
curl -X GET http://localhost:3000/api/platform/info \
  -H "Content-Type: application/json"
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "name": "DOT Platform V0.2",
    "version": "1.0.0",
    "status": "active",
    "maintenance_mode": false,
    "supported_features": [
      "dynamic_loading",
      "app_isolation",
      "realtime_sync",
      "mcp_integration"
    ]
  }
}
```

**2. 앱 목록 조회**
```bash
curl -X GET http://localhost:3000/api/apps \
  -H "Content-Type: application/json"
```

**예상 응답**: 빈 배열 또는 기본 앱들의 목록

### 데이터베이스 연결 확인
Supabase 대시보드에서:
1. **SQL Editor** 탭으로 이동
2. 다음 쿼리 실행:
```sql
-- 플랫폼 정보 확인
SELECT * FROM platforms;

-- 앱 레지스트리 확인
SELECT * FROM apps;

-- RLS 정책 확인
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE rowsecurity = true;
```

---

## 🎨 5단계: 첫 번째 마이크로 앱 구조 생성

**중요**: 이 단계에서는 실제 기능을 구현하지 않고, 구조만 생성합니다.

### 앱 디렉토리 생성
```bash
# 예시 앱 구조 생성
mkdir -p src/apps/hello-world/{components,lib,types}
```

### 기본 앱 매니페스트 작성
`src/apps/hello-world/manifest.json`:
```json
{
  "app_id": "hello-world",
  "name": "Hello World App",
  "display_name_ko": "헬로 월드 앱",
  "version": "1.0.0",
  "description": "Simple hello world micro app",
  "description_ko": "간단한 헬로 월드 마이크로 앱",
  "category": "demo",
  "routes": [
    {
      "path": "/hello",
      "component": "HelloWorldPage",
      "public": true
    }
  ],
  "permissions": [],
  "dependencies": ["core"],
  "resources": {
    "max_memory_mb": 10,
    "max_storage_mb": 5
  }
}
```

### 기본 컴포넌트 생성
`src/apps/hello-world/index.tsx`:
```tsx
import React from 'react';

export default function HelloWorldApp() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hello, World! 🌟
        </h1>
        <p className="text-gray-600 mb-6">
          DOT Platform V0.2 마이크로 앱이 성공적으로 로드되었습니다.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            이 앱은 플랫폼 베이스에서 동적으로 로드된 마이크로 앱입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 앱 등록 (개발 모드)
```bash
# 개발용 앱 등록 스크립트 실행
npm run app:register -- --path=src/apps/hello-world

# 앱 목록 확인
npm run app:list
```

---

## 🧪 6단계: 동작 확인 및 테스트

### 동적 로딩 테스트
1. 브라우저에서 `http://localhost:3000/apps/hello-world` 접속
2. Hello World 앱이 플랫폼 셸 내에서 로드되는지 확인
3. 다른 페이지로 이동 후 다시 돌아와서 캐싱 확인

### 상태 관리 테스트
개발자 도구에서 다음 확인:
```javascript
// 플랫폼 전역 상태 확인
window.__PLATFORM_STATE__

// 현재 로드된 앱 목록 확인
console.log('Loaded apps:', window.__PLATFORM_STATE__.loadedApps);
```

### MCP 서버 연결 확인
```bash
# MCP 서버 상태 확인
npm run mcp:status

# 예상 출력:
# ✅ magic-server: connected
# ✅ morphllm-server: connected
# ⚠️ sequential-server: disconnected (auto_connect: false)
```

### API 통합 테스트
```bash
# 전체 API 테스트 실행
npm run test:api

# 특정 API 테스트
npm test -- --testPathPattern=api
```

---

## 🔧 7단계: 개발 워크플로우 설정

### Claude Code 통합 (권장)
```bash
# 프로젝트를 Claude Code로 열기
claude-code .

# MCP 서버 상태 확인
claude-code --mcp-status

# 자동 코드 리뷰 활성화
claude-code --review --continuous
```

### Git 워크플로우 설정
```bash
# 개발 브랜치 생성
git checkout -b feature/initial-setup

# 변경 사항 커밋
git add .
git commit -m "feat: complete initial platform setup

- Set up Next.js project with TypeScript
- Configure Supabase database with migrations
- Implement platform shell UI structure
- Add hello-world demo micro app
- Set up MCP server integration

🤖 Generated with Claude Code"

# 원격 저장소에 푸시
git push origin feature/initial-setup
```

---

## ✅ 성공 확인 체크리스트

### 기본 기능 확인
- [ ] **플랫폼 셸**: `http://localhost:3000`에서 정상 렌더링
- [ ] **API 응답**: `/api/platform/info`에서 JSON 응답
- [ ] **데이터베이스**: Supabase에서 8개 테이블 생성 확인
- [ ] **환경 변수**: `.env.local` 파일 모든 값 설정

### 고급 기능 확인
- [ ] **동적 로딩**: Hello World 앱 로드/언로드
- [ ] **상태 관리**: 플랫폼 상태 브라우저에서 확인
- [ ] **MCP 연결**: 최소 2개 서버 연결 성공
- [ ] **테스트**: API 테스트 실행 성공

### 개발 환경 확인
- [ ] **TypeScript**: 컴파일 오류 없음
- [ ] **ESLint**: 린트 규칙 통과
- [ ] **Hot Reload**: 코드 변경 시 자동 새로고침
- [ ] **Claude Code**: MCP 통합 개발 도구 연결

---

## 🚨 일반적인 문제 해결

### 1. 서버 시작 오류
```bash
# Node.js 버전 확인
node --version  # 18.17+ 필요

# 포트 충돌 확인
lsof -i :3000
kill -9 <PID>  # 필요한 경우

# 캐시 클리어
rm -rf .next
npm run dev
```

### 2. Supabase 연결 오류
```bash
# 연결 상태 확인
supabase status

# 재연결
supabase link --project-ref your_project_ref

# 환경 변수 다시 확인
echo $NEXT_PUBLIC_SUPABASE_URL
```

### 3. MCP 서버 연결 실패
```bash
# MCP 서버 개별 확인
npx @21st-ui/code-magic-server --port 3001 &
npx @morphllm/morphllm-server --port 3002 &

# 상태 확인
npm run mcp:status
```

### 4. 앱 로딩 실패
```bash
# 앱 매니페스트 검증
npm run validate:manifest -- --app=hello-world

# 앱 등록 상태 확인
npm run app:list
```

---

## 🎯 다음 단계

### 즉시 할 수 있는 것
1. **[개발자 가이드](06-DEVELOPMENT.md)** 읽고 개발 워크플로우 이해
2. **[API 레퍼런스](03-API-REFERENCE.md)** 확인하고 추가 API 테스트
3. **[시스템 아키텍처](02-ARCHITECTURE.md)** 읽고 전체 구조 이해

### 추가 개발 고려사항
- **새로운 마이크로 앱 생성**: Hello World를 참고하여 다른 앱 구조 생성
- **UI 컴포넌트 확장**: Magic MCP를 사용한 UI 컴포넌트 생성
- **테스트 확장**: 추가 API 및 통합 테스트 작성

### 프로덕션 준비
- **[배포 가이드](07-DEPLOYMENT.md)** 확인하여 Vercel 배포 준비
- 보안 설정 강화 및 환경별 설정 분리
- 성능 모니터링 및 로깅 시스템 구축

---

**축하합니다! 🎉** DOT Platform V0.2의 마이크로 앱 플랫폼 베이스가 성공적으로 설정되었습니다. 이제 실제 마이크로 앱들을 개발할 준비가 완료되었습니다.

**다음**: [개발자 가이드](06-DEVELOPMENT.md)에서 본격적인 개발 워크플로우를 확인하세요.