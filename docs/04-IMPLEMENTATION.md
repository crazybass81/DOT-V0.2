# DOT Platform V0.2 - 구현 가이드

## 🎯 구현 개요

이 가이드는 DOT Platform V0.2의 마이크로 앱 아키텍처 플랫폼 베이스를 단계별로 구현하는 상세한 방법을 제공합니다.

### 구현 범위
- ✅ **구현할 것**: 플랫폼 베이스 (셸, 레지스트리, 동적 로딩, API 인프라)
- ❌ **구현하지 않을 것**: 세부 앱 기능 (로그인 UI, 근태관리, 커뮤니티 등)

### 구현 기간 및 팀 구성
- **총 기간**: 4주 (20일)
- **팀 구성**: 풀스택 개발자 2명, DevOps 엔지니어 1명 권장
- **작업 분할**: 17개 구체적 작업으로 분해

---

## 📋 Phase 1: 프로젝트 기반 설정 (1-3일차)

### T001: Next.js 프로젝트 초기 구조 생성
**담당자**: 개발자A
**예상 시간**: 4시간
**파일 경로**: `/package.json`, `/next.config.js`, `/tsconfig.json`

**구체적 작업 단계**:

1. **Next.js 프로젝트 생성**
```bash
npx create-next-app@latest dot-platform-v2 --typescript --tailwind --eslint --app
cd dot-platform-v2
```

2. **핵심 의존성 설치**
```bash
# 필수 의존성
npm install @supabase/supabase-js @types/node zustand

# 개발 도구
npm install -D @types/react @types/react-dom prettier husky lint-staged
```

3. **프로젝트 구조 생성**
```bash
mkdir -p src/{components/{platform,layout,ui},lib/{auth,state,router},types,hooks}
mkdir -p src/app/{api,apps}
mkdir -p config docs supabase/{migrations,functions}
```

4. **설정 파일 구성**

`next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          platform: {
            name: 'platform',
            test: /[\\/]src[\\/](components|lib)[\\/]platform[\\/]/,
            priority: 10,
          }
        }
      };
    }
    return config;
  }
};

module.exports = nextConfig;
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**완료 기준**:
- [ ] `npm run dev` 정상 실행
- [ ] TypeScript 컴파일 오류 없음
- [ ] ESLint 설정 완료
- [ ] 디렉토리 구조 생성

---

### T002: Supabase 데이터베이스 스키마 구현
**담당자**: 개발자B
**예상 시간**: 6시간
**의존성**: T001 완료

**구체적 작업 단계**:

1. **Supabase 프로젝트 생성 및 연결**
```bash
npm install -g supabase
supabase login
supabase init
supabase link --project-ref your_project_ref
```

2. **플랫폼 코어 테이블 생성**

`supabase/migrations/001_platform_core_schema.sql`:
```sql
-- 플랫폼 설정 테이블
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'DOT Platform V0.2',
  version TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  max_concurrent_apps INTEGER DEFAULT 10,
  max_users_per_app INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앱 레지스트리 테이블
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name_ko TEXT,
  description TEXT,
  description_ko TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  manifest JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'installing', 'error', 'deprecated')),
  category TEXT DEFAULT 'utility',
  tags TEXT[] DEFAULT '{}',
  install_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  max_memory_mb INTEGER DEFAULT 50,
  max_storage_mb INTEGER DEFAULT 100,
  requires_network BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자-앱 관계 테이블
CREATE TABLE user_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT REFERENCES apps(app_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'installed' CHECK (status IN ('installed', 'disabled', 'uninstalling')),
  settings JSONB DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_review TEXT,
  usage_stats JSONB DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, app_id)
);

-- 사용자 프로필 확장
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **앱 데이터 테이블 생성**

`supabase/migrations/002_app_data_schema.sql`:
```sql
-- 앱별 데이터 저장
CREATE TABLE app_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id, key)
);

-- 앱별 권한 관리
CREATE TABLE app_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, app_id, permission)
);

-- 앱 세션 관리
CREATE TABLE app_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  session_data JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 앱 로그 및 감사
CREATE TABLE app_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. **Row Level Security 정책 설정**

`supabase/migrations/003_rls_policies.sql`:
```sql
-- RLS 활성화
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- 플랫폼 정보는 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Authenticated users can read platform info" ON platforms
  FOR SELECT USING (auth.role() = 'authenticated');

-- 앱 목록은 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Authenticated users can read apps" ON apps
  FOR SELECT USING (auth.role() = 'authenticated');

-- 사용자는 자신의 앱 설치 정보만 관리 가능
CREATE POLICY "Users can manage their own apps" ON user_apps
  FOR ALL USING (auth.uid() = user_id);

-- 사용자는 자신의 프로필만 관리 가능
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 사용자는 자신의 앱 데이터만 접근 가능
CREATE POLICY "Users can access their own app data" ON app_data
  FOR ALL USING (auth.uid() = user_id);

-- 사용자는 자신의 권한만 조회 가능
CREATE POLICY "Users can view their own permissions" ON app_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 세션만 관리 가능
CREATE POLICY "Users can manage their own sessions" ON app_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view their own logs" ON app_logs
  FOR SELECT USING (auth.uid() = user_id);
```

5. **TypeScript 타입 정의**

`src/lib/database/types.ts`:
```typescript
export interface Platform {
  id: string;
  name: string;
  version: string;
  config: Record<string, any>;
  maintenance_mode: boolean;
  max_concurrent_apps: number;
  max_users_per_app: number;
  created_at: string;
  updated_at: string;
}

export interface App {
  id: string;
  app_id: string;
  name: string;
  display_name_ko?: string;
  description?: string;
  description_ko?: string;
  version: string;
  manifest: AppManifest;
  status: 'active' | 'inactive' | 'installing' | 'error' | 'deprecated';
  category: string;
  tags: string[];
  install_count: number;
  active_users_count: number;
  average_rating: number;
  total_ratings: number;
  max_memory_mb: number;
  max_storage_mb: number;
  requires_network: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppManifest {
  routes: AppRoute[];
  permissions: string[];
  dependencies: string[];
  api_endpoints?: APIEndpoint[];
}

export interface AppRoute {
  path: string;
  component: string;
  public?: boolean;
  auth?: boolean;
}

export interface UserApp {
  id: string;
  user_id: string;
  app_id: string;
  status: 'installed' | 'disabled' | 'uninstalling';
  settings: Record<string, any>;
  permissions: string[];
  user_rating?: number;
  user_review?: string;
  usage_stats: Record<string, any>;
  installed_at: string;
  last_used_at?: string;
}
```

**완료 기준**:
- [ ] Supabase 프로젝트 연결 완료
- [ ] 모든 테이블 생성 및 RLS 설정
- [ ] TypeScript 타입 정의 완료
- [ ] 마이그레이션 스크립트 실행 성공

---

### T003: [P] 환경 설정 및 개발 도구 체인 구성
**담당자**: DevOps 엔지니어
**예상 시간**: 4시간
**의존성**: T001 완료 (T002와 병렬 실행 가능)

**구체적 작업 단계**:

1. **환경 변수 설정**

`.env.example`:
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 애플리케이션 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_VERSION=1.0.0
NODE_ENV=development

# MCP 서버 설정
MCP_SERVERS_CONFIG_PATH=./config/mcp-servers.json
MCP_ENABLED=true

# JWT 토큰 설정
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 로깅 및 모니터링
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

2. **MCP 서버 설정**

`config/mcp-servers.json`:
```json
{
  "servers": [
    {
      "name": "magic",
      "display_name": "Magic UI Components",
      "url": "ws://localhost:3001",
      "capabilities": ["component_generation", "ui_enhancement"],
      "auto_connect": true,
      "config": {
        "timeout": 30000,
        "retry_attempts": 3
      }
    },
    {
      "name": "morphllm",
      "display_name": "Code Transformation",
      "url": "ws://localhost:3002",
      "capabilities": ["code_editing", "pattern_application"],
      "auto_connect": true
    },
    {
      "name": "sequential",
      "display_name": "Sequential Thinking",
      "url": "ws://localhost:3003",
      "capabilities": ["complex_analysis", "step_by_step_reasoning"],
      "auto_connect": false
    },
    {
      "name": "context7",
      "display_name": "Context7 Documentation",
      "url": "ws://localhost:3004",
      "capabilities": ["documentation_search", "api_reference"],
      "auto_connect": false
    },
    {
      "name": "playwright",
      "display_name": "Playwright Testing",
      "url": "ws://localhost:3005",
      "capabilities": ["browser_automation", "e2e_testing"],
      "auto_connect": false
    }
  ]
}
```

3. **GitHub Actions CI/CD 설정**

`.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run TypeScript check
      run: npm run type-check

    - name: Run ESLint
      run: npm run lint

    - name: Run tests
      run: npm run test

    - name: Build application
      run: npm run build

    - name: Run E2E tests
      run: npm run test:e2e

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
    - name: Deploy to Vercel Staging
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Deploy to Vercel Production
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

4. **개발 도구 설정**

`package.json` scripts 추가:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:generate-types": "supabase gen types typescript --linked > src/lib/database/types.ts",
    "db:reset": "supabase db reset --linked",
    "db:migrate": "supabase db push",
    "mcp:start": "node scripts/start-mcp-servers.js",
    "mcp:status": "node scripts/check-mcp-status.js"
  }
}
```

**완료 기준**:
- [ ] 환경 변수 템플릿 완성
- [ ] MCP 서버 설정 파일 작성
- [ ] CI/CD 파이프라인 설정 완료
- [ ] 개발 스크립트 구성

---

## 🧪 Phase 2: API 계약 테스트 작성 (4-5일차)

### T004: [P] Platform Core API 계약 테스트 작성
**담당자**: 개발자A
**예상 시간**: 3시간
**의존성**: T002 완료

**구체적 작업 단계**:

1. **테스트 환경 설정**

`jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

2. **API 테스트 작성**

`src/__tests__/api/platform.test.ts`:
```typescript
import { createMocks } from 'node-mocks-http';
import platformInfoHandler from '@/app/api/platform/info/route';
import platformInitHandler from '@/app/api/platform/initialize/route';

describe('/api/platform/info', () => {
  test('should return platform information', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test_token'
      }
    });

    const response = await platformInfoHandler.GET(req);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.name).toBe('DOT Platform V0.2');
    expect(responseData.data.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(responseData.data.status).toBe('active');
    expect(responseData.data.maintenance_mode).toBe(false);
    expect(responseData.data.supported_features).toContain('dynamic_loading');
    expect(responseData.data.supported_features).toContain('app_isolation');
  });

  test('should return 401 without authentication', async () => {
    const { req } = createMocks({
      method: 'GET'
    });

    const response = await platformInfoHandler.GET(req);
    expect(response.status).toBe(401);
  });
});

describe('/api/platform/initialize', () => {
  test('should initialize platform with admin token', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer admin_token',
        'content-type': 'application/json'
      },
      body: {
        reset_apps: false,
        reset_users: false,
        maintenance_mode: false
      }
    });

    const response = await platformInitHandler.POST(req);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.initialized).toBe(true);
    expect(responseData.data).toHaveProperty('timestamp');
  });

  test('should return 403 with non-admin token', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer user_token'
      }
    });

    const response = await platformInitHandler.POST(req);
    expect(response.status).toBe(403);
  });
});
```

`src/__tests__/api/apps.test.ts`:
```typescript
import { createMocks } from 'node-mocks-http';
import appsListHandler from '@/app/api/apps/route';
import appDetailHandler from '@/app/api/apps/[appId]/route';
import appInstallHandler from '@/app/api/apps/[appId]/install/route';

describe('/api/apps', () => {
  test('should return apps list', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test_token'
      },
      query: {
        category: 'core',
        limit: '10'
      }
    });

    const response = await appsListHandler.GET(req);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data.apps)).toBe(true);
    expect(responseData.data.pagination).toHaveProperty('total');
    expect(responseData.data.pagination).toHaveProperty('limit');
    expect(responseData.data.pagination).toHaveProperty('offset');
  });

  test('should filter by category', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test_token'
      },
      query: {
        category: 'core'
      }
    });

    const response = await appsListHandler.GET(req);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    responseData.data.apps.forEach((app: any) => {
      expect(app.category).toBe('core');
    });
  });
});

describe('/api/apps/{app_id}', () => {
  test('should return app details', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test_token'
      }
    });

    const response = await appDetailHandler.GET(req, { params: { appId: 'auth' } });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.app_id).toBe('auth');
    expect(responseData.data.manifest).toHaveProperty('routes');
    expect(responseData.data.manifest).toHaveProperty('permissions');
    expect(responseData.data.manifest).toHaveProperty('dependencies');
  });

  test('should return 404 for non-existent app', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test_token'
      }
    });

    const response = await appDetailHandler.GET(req, { params: { appId: 'non-existent' } });
    expect(response.status).toBe(404);
  });
});

describe('/api/apps/{app_id}/install', () => {
  test('should install app for authenticated user', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test_token',
        'content-type': 'application/json'
      },
      body: {
        settings: {
          auto_login: true,
          remember_me_duration: '7d'
        },
        permissions: [
          'auth:read',
          'auth:write',
          'user:profile'
        ]
      }
    });

    const response = await appInstallHandler.POST(req, { params: { appId: 'auth' } });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.installation.app_id).toBe('auth');
    expect(responseData.data.installation.status).toBe('installed');
    expect(responseData.data.installation).toHaveProperty('installed_at');
  });

  test('should return 409 if app already installed', async () => {
    // Mock already installed app
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test_token',
        'content-type': 'application/json'
      }
    });

    // First install should succeed, second should fail
    await appInstallHandler.POST(req, { params: { appId: 'auth' } });
    const response = await appInstallHandler.POST(req, { params: { appId: 'auth' } });

    expect(response.status).toBe(409);
  });
});
```

**완료 기준**:
- [ ] 모든 Platform API 엔드포인트 테스트 작성
- [ ] 정상 케이스 및 에러 케이스 포함
- [ ] 인증 및 권한 테스트 포함
- [ ] 테스트 실행 시 실패 (구현 전이므로 정상)

---

## 🏗️ Phase 3-5 구현 단계들

이어지는 Phase들(데이터 모델, API 구현, MCP 통합)은 동일한 상세도로 계속됩니다...

### 병렬 실행 최적화

**1단계 병렬 실행**:
```bash
# T004와 T005를 병렬로 실행 (API 테스트 작성)
git checkout -b feature/api-tests
# 개발자A: T004 작업
# 개발자B: T005 작업 (별도 브랜치에서)
```

**2단계 병렬 실행**:
```bash
# T013, T014, T015를 병렬로 실행
git checkout -b feature/mcp-integration
# 개발자A: MCP Bridge 구현
# 개발자B: Realtime Service 구현
# DevOps: 통합 테스트 작성
```

---

## 📊 구현 검증 체크리스트

### 기술적 검증
- [ ] 앱 동적 로딩 시간 < 2초
- [ ] 플랫폼 초기 로딩 시간 < 3초
- [ ] 메모리 사용량 < 200MB
- [ ] 모든 API 테스트 통과
- [ ] TypeScript 컴파일 오류 없음
- [ ] ESLint 규칙 준수

### 기능적 검증
- [ ] 플랫폼 셸 UI 정상 렌더링
- [ ] 앱 레지스트리 CRUD 작업
- [ ] 동적 모듈 로딩/언로딩
- [ ] 상태 관리 격리
- [ ] 실시간 통신 기본 동작
- [ ] MCP 서버 연결 관리

### 보안 검증
- [ ] JWT 토큰 검증 작동
- [ ] RLS 정책 적용 확인
- [ ] API Rate Limiting 동작
- [ ] 입력 데이터 검증

---

**다음**: [빠른 시작 가이드](05-QUICKSTART.md)에서 개발 환경 설정 방법을 확인하세요.