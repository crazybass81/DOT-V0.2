# DOT Platform V0.2 - 빠른 시작 가이드

## 개요

DOT Platform V0.2는 마이크로 앱 아키텍처 기반의 확장 가능한 플랫폼입니다. 이 가이드는 개발자가 최단 시간 내에 플랫폼을 설정하고 첫 번째 마이크로 앱을 실행할 수 있도록 안내합니다.

## 사전 요구사항

### 개발 환경
- **Node.js**: 18.17+ (권장: 20.x)
- **npm**: 9+ 또는 **yarn**: 3.x+
- **Git**: 2.40+
- **Docker**: 24+ (선택사항, 로컬 서비스용)

### 계정 준비
- **Supabase 계정**: [supabase.com](https://supabase.com)
- **Vercel 계정**: [vercel.com](https://vercel.com)
- **GitHub 계정**: 저장소 관리용

### 필수 도구
```bash
# Claude Code 설치 (권장)
npm install -g @anthropic/claude-code

# MCP 서버 도구들 (개발용)
npm install -g @21st-ui/code-magic-server
npm install -g @morphllm/morphllm-server
npm install -g @context7/context7-mcp
```

## 1. 프로젝트 설정

### 저장소 클론 및 설치
```bash
# 저장소 클론
git clone https://github.com/your-org/DOT-V0.2.git
cd DOT-V0.2

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 환경 변수 설정
`.env.local` 파일을 편집하여 다음 값들을 설정:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 애플리케이션 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_VERSION=1.0.0

# MCP 서버 설정 (개발용)
MCP_SERVERS_CONFIG_PATH=./config/mcp-servers.json
MCP_ENABLED=true

# JWT 토큰 설정
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 로깅 및 모니터링
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

## 2. 데이터베이스 초기화

### Supabase 프로젝트 설정
```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase login
supabase link --project-ref your_project_ref

# 데이터베이스 마이그레이션 실행
supabase db push

# RLS 정책 적용
supabase db reset --linked
```

### 초기 데이터 삽입
```bash
# 플랫폼 초기 설정 데이터 삽입
npm run db:seed

# 개발용 더미 데이터 생성 (선택사항)
npm run db:seed:dev
```

## 3. 개발 서버 실행

### 기본 실행
```bash
# 개발 서버 시작
npm run dev

# 또는 yarn 사용시
yarn dev
```

서버가 성공적으로 시작되면 `http://localhost:3000`에서 접근 가능합니다.

### MCP 서버와 함께 실행 (권장)
```bash
# MCP 서버들과 함께 개발 환경 시작
npm run dev:full

# 개별 MCP 서버 상태 확인
npm run mcp:status
```

## 4. 플랫폼 초기 설정

### 관리자 계정 생성
1. 브라우저에서 `http://localhost:3000/admin/setup` 접속
2. 관리자 계정 정보 입력:
   ```
   이메일: admin@your-domain.com
   비밀번호: [안전한 비밀번호]
   플랫폼 이름: DOT Platform V0.2
   ```
3. "플랫폼 초기화" 버튼 클릭

### 플랫폼 상태 확인
```bash
# API를 통한 플랫폼 상태 확인
curl -X GET http://localhost:3000/api/platform/info \
  -H "Authorization: Bearer your_admin_token"

# 응답 예시:
{
  "success": true,
  "data": {
    "name": "DOT Platform V0.2",
    "version": "1.0.0",
    "status": "active",
    "maintenance_mode": false
  }
}
```

## 5. 첫 번째 마이크로 앱 생성

### 앱 개발 환경 설정
```bash
# 앱 개발 템플릿 생성
npm run create:microapp -- --name=hello-world --type=basic

# 생성된 구조:
# apps/hello-world/
# ├── manifest.json          # 앱 메타데이터
# ├── src/
# │   ├── pages/
# │   │   └── index.tsx      # 메인 페이지
# │   ├── components/        # 앱 전용 컴포넌트
# │   └── lib/              # 앱 전용 유틸리티
# └── package.json          # 앱 의존성
```

### 앱 매니페스트 설정
`apps/hello-world/manifest.json` 편집:
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
  "dependencies": ["core"]
}
```

### 기본 컴포넌트 작성
`apps/hello-world/src/pages/index.tsx`:
```tsx
import React from 'react';
import { usePlatformContext } from '@dot-platform/core';

export default function HelloWorldPage() {
  const { user, platform } = usePlatformContext();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hello, {user?.name || 'World'}!
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to {platform.name}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            이 앱은 DOT Platform V0.2에서 실행 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
```

## 6. 앱 등록 및 테스트

### 앱 등록
```bash
# 개발 모드에서 앱 등록
npm run app:register -- --path=apps/hello-world

# 등록 확인
npm run app:list
```

### 브라우저에서 테스트
1. `http://localhost:3000/apps/hello-world` 접속
2. 앱이 정상적으로 로드되는지 확인
3. 플랫폼 셸에서 앱 전환 테스트

### API 테스트
```bash
# 앱 목록 조회
curl -X GET http://localhost:3000/api/apps \
  -H "Authorization: Bearer your_user_token"

# 특정 앱 정보 조회
curl -X GET http://localhost:3000/api/apps/hello-world \
  -H "Authorization: Bearer your_user_token"
```

## 7. 개발 워크플로우

### 일반적인 개발 사이클
```bash
# 1. 새 기능 브랜치 생성
git checkout -b feature/new-microapp

# 2. 마이크로 앱 개발
npm run create:microapp -- --name=new-app
# ... 개발 작업 ...

# 3. 로컬 테스트
npm run test:microapp -- --app=new-app
npm run test:integration

# 4. 빌드 및 검증
npm run build
npm run validate:apps

# 5. 커밋 및 푸시
git add .
git commit -m "feat: add new-app microapp"
git push origin feature/new-microapp
```

### Claude Code와 함께 개발
```bash
# Claude Code로 프로젝트 열기
claude-code .

# MCP 서버 상태 확인
claude-code --mcp-status

# 자동 코드 리뷰 및 개선
claude-code --review --improve
```

## 8. 배포 준비

### Vercel 배포 설정
```bash
# Vercel CLI 설치 및 로그인
npm install -g vercel
vercel login

# 프로젝트 연결
vercel link

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 배포
vercel --prod
```

### 프로덕션 검증
```bash
# 프로덕션 빌드 로컬 테스트
npm run build
npm run start

# 성능 및 보안 검사
npm run audit:security
npm run test:performance
```

## 9. 문제해결

### 일반적인 문제들

#### 1. Supabase 연결 오류
```bash
# 연결 상태 확인
supabase status

# 문제 해결
supabase db reset --linked
npm run db:seed
```

#### 2. MCP 서버 연결 실패
```bash
# MCP 서버 상태 확인
npm run mcp:status

# 재시작
npm run mcp:restart
```

#### 3. 앱 로딩 실패
```bash
# 앱 매니페스트 검증
npm run validate:manifest -- --app=app-name

# 의존성 확인
npm run check:dependencies -- --app=app-name
```

### 로그 확인
```bash
# 플랫폼 로그 확인
npm run logs:platform

# 특정 앱 로그 확인
npm run logs:app -- --name=app-name

# 에러 로그만 필터링
npm run logs:errors
```

### 성능 모니터링
```bash
# 성능 메트릭 확인
npm run metrics:performance

# 메모리 사용량 체크
npm run metrics:memory

# 앱별 리소스 사용량
npm run metrics:apps
```

## 10. 다음 단계

### 추가 학습 자료
- **아키텍처 가이드**: `/docs/ARCHITECTURE.md`
- **API 문서**: `/docs/api/`
- **컴포넌트 라이브러리**: `/docs/components/`
- **배포 가이드**: `/docs/DEPLOYMENT.md`

### 고급 기능 탐색
1. **사용자 인증 앱** 개발
2. **실시간 알림 시스템** 구축
3. **데이터 분석 대시보드** 생성
4. **모바일 반응형** 최적화

### 커뮤니티 참여
- **GitHub 이슈**: 버그 리포트 및 기능 요청
- **토론 포럼**: 개발자 커뮤니티 참여
- **기여 가이드**: `/CONTRIBUTING.md` 참조

---

**문서 정보**
- 버전: 1.0.0
- 작성일: 2025년 9월 26일
- 대상: 초급-중급 개발자
- 예상 완료 시간: 30-45분

**지원 및 문의**
- 기술 지원: support@dot-platform.com
- 문서 개선: docs@dot-platform.com
- 버그 리포트: [GitHub Issues](https://github.com/your-org/DOT-V0.2/issues)