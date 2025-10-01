# DOT Platform V0.2 - 시스템 아키텍처

## 🏗️ 전체 시스템 아키텍처

### 아키텍처 개요
DOT Platform V0.2는 **마이크로 앱 아키텍처**를 채택하여, 독립적인 앱들이 하나의 통합된 플랫폼에서 실행되는 구조입니다.

```
┌─────────────────────────────────────────────────────────┐
│                    DOT Platform V0.2                    │
├─────────────────────────────────────────────────────────┤
│                   Platform Shell                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Header     │ │ Navigation  │ │ App Container│      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│                   Core Services                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │App Registry │ │State Manager│ │Auth Service │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Router Svc   │ │Dynamic Load │ │MCP Bridge   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│                   Data Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Supabase    │ │  Realtime   │ │   Storage   │      │
│  │PostgreSQL   │ │ WebSocket   │ │   & CDN     │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 핵심 구성 요소

### 1. Platform Shell (플랫폼 셸)

**역할**: 모든 마이크로 앱을 실행하는 기반 UI 환경

```typescript
// Platform Shell 구조
interface PlatformShell {
  header: HeaderComponent;      // 상단 네비게이션 및 사용자 정보
  sidebar: SidebarComponent;    // 앱 네비게이션 메뉴
  container: AppContainer;      // 실제 앱이 렌더링되는 영역
  footer?: FooterComponent;     // 하단 상태 정보 (선택사항)
}
```

**주요 기능**:
- **레이아웃 관리**: 반응형 디자인 및 앱 영역 분할
- **네비게이션**: 앱 간 전환 및 라우팅 관리
- **공통 UI**: 헤더, 사이드바, 알림 시스템
- **에러 처리**: 앱 오류 시 플랫폼 안정성 보장

### 2. App Registry (앱 레지스트리)

**역할**: 설치된 앱들의 메타데이터 및 생명주기 관리

```typescript
interface AppManifest {
  app_id: string;           // 고유 식별자
  name: string;             // 앱 이름
  version: string;          // 버전 정보
  routes: AppRoute[];       // 앱 내부 라우트
  permissions: string[];    // 필요한 권한
  dependencies: string[];   // 의존성 앱
  resources: {              // 리소스 제한
    max_memory_mb: number;
    max_storage_mb: number;
  };
}
```

**주요 기능**:
- **앱 등록/해제**: 매니페스트 기반 앱 관리
- **의존성 해결**: 앱 간 의존성 체크 및 순서 관리
- **버전 관리**: 앱 업데이트 및 롤백 지원
- **권한 관리**: 앱별 권한 검증 및 제어

### 3. Dynamic Loading System (동적 로딩 시스템)

**역할**: 런타임에 앱을 동적으로 로드/언로드

```typescript
class DynamicAppLoader {
  private loadedApps = new Map<string, React.ComponentType>();

  // React.lazy()를 활용한 동적 로딩
  async loadApp(appId: string): Promise<React.ComponentType> {
    if (this.loadedApps.has(appId)) {
      return this.loadedApps.get(appId)!;
    }

    const appModule = await import(`@/apps/${appId}/index`);
    this.loadedApps.set(appId, appModule.default);
    return appModule.default;
  }
}
```

**주요 기능**:
- **지연 로딩**: 필요한 시점에만 앱 로드
- **메모리 관리**: 사용하지 않는 앱 언로드
- **캐싱**: 로드된 앱 재사용으로 성능 최적화
- **에러 복구**: 로딩 실패 시 폴백 처리

### 4. State Management (상태 관리)

**역할**: 플랫폼 전역 상태 및 앱별 격리된 상태 관리

```typescript
// 플랫폼 전역 상태 (Zustand)
interface PlatformState {
  currentApp: string | null;
  loadedApps: string[];
  platformConfig: Record<string, any>;
  user: User | null;
}

// 앱별 격리 상태
class AppStateManager {
  private appStores = new Map<string, any>();

  createAppStore<T>(appId: string, initialState: T): Store<T> {
    // 앱 전용 Zustand 스토어 생성
  }
}
```

**주요 기능**:
- **전역 상태**: 플랫폼 설정, 사용자 정보, 현재 앱
- **앱별 상태**: 각 앱의 독립적인 상태 공간
- **상태 격리**: 앱 간 상태 간섭 방지
- **지속성**: 중요한 상태의 로컬 저장

---

## 🔧 코어 서비스 레이어

### 1. Authentication Service

```typescript
class AuthService {
  // Supabase Auth 래퍼
  async getCurrentUser(): Promise<User | null> {
    // JWT 토큰 검증 및 사용자 정보 반환
  }

  async checkPermission(permission: string): Promise<boolean> {
    // 권한 기반 접근 제어 (RBAC)
  }
}
```

**기능**:
- JWT 토큰 검증
- 세션 관리
- 권한 확인
- **주의**: 실제 로그인 UI는 구현하지 않음

### 2. Router Service

```typescript
class RouterService {
  // 동적 라우팅 관리
  registerAppRoute(appId: string, route: string, component: React.ComponentType): void {
    // 앱 라우트 동적 등록
  }

  navigateToApp(appId: string, route?: string): void {
    // 앱 간 네비게이션
  }
}
```

**기능**:
- 동적 라우트 생성/제거
- 앱 간 네비게이션
- 라우트 가드 및 권한 확인
- 딥링크 지원

### 3. MCP Bridge

```typescript
class MCPBridge {
  private connectedServers = new Map<string, WebSocket>();

  async connectServer(config: MCPServerConfig): Promise<boolean> {
    // MCP 서버 연결 관리
  }

  getServerStatus(name: string): 'connected' | 'disconnected' | 'error' {
    // 연결 상태 모니터링
  }
}
```

**기능**:
- MCP 서버 연결 관리
- 개발 도구 통합
- **주의**: 실제 도구 실행은 구현하지 않음

---

## 🗄️ 데이터 아키텍처

### 데이터베이스 스키마 (Supabase PostgreSQL)

```sql
-- 플랫폼 코어 테이블
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'DOT Platform V0.2',
  version TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  manifest JSONB NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'installing', 'error')),
  install_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT REFERENCES apps(app_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'installed',
  settings JSONB DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- 앱 데이터 테이블
CREATE TABLE app_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id, key)
);
```

### Row Level Security (RLS) 정책

```sql
-- 사용자별 데이터 격리
ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own apps" ON user_apps
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own app data" ON app_data
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🌐 API 아키텍처

### API 레이어 구조

```
/api/
├── platform/
│   ├── info          # GET - 플랫폼 정보
│   └── initialize    # POST - 플랫폼 초기화 (관리자)
├── apps/
│   ├── [index]       # GET - 앱 목록 조회
│   ├── [app_id]/
│   │   ├── [index]   # GET - 앱 상세 정보
│   │   ├── install   # POST - 앱 설치
│   │   ├── update    # PATCH - 앱 업데이트
│   │   └── state     # GET/POST/DELETE - 앱 상태 관리
│   └── user/         # GET/PATCH - 사용자 앱 관리
├── mcp/
│   ├── servers       # GET/POST - MCP 서버 관리
│   ├── execute       # POST - MCP 도구 실행
│   └── events        # WebSocket - 실시간 이벤트
└── auth/
    └── verify        # POST - 토큰 검증
```

### API 응답 형식

```typescript
// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    message_ko: string;
    details?: any;
  };
  timestamp: string;
}
```

---

## 🔒 보안 아키텍처

### 1. 인증 및 권한

```typescript
// JWT 토큰 구조
interface JWTPayload {
  sub: string;              // 사용자 ID
  email: string;            // 이메일
  role: 'user' | 'admin';   // 역할
  platform_permissions: string[];  // 플랫폼 권한
  app_permissions: {        // 앱별 권한
    [appId: string]: string[];
  };
  exp: number;              // 만료 시간
  iat: number;              // 발급 시간
}
```

### 2. 데이터 격리

- **Row Level Security**: 사용자별 데이터 접근 제한
- **앱별 격리**: 앱 간 데이터 접근 차단
- **권한 기반**: 최소 권한 원칙 적용

### 3. API 보안

- **Rate Limiting**: 요청 빈도 제한
- **Input Validation**: 입력 데이터 검증
- **CORS 설정**: 도메인 기반 접근 제어

---

## ⚡ 성능 아키텍처

### 1. 번들 최적화

```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks = {
        cacheGroups: {
          platform: {
            name: 'platform',
            test: /[\\/]src[\\/](components|lib)[\\/]platform[\\/]/,
            priority: 10,
          },
          apps: {
            name: 'apps',
            test: /[\\/]src[\\/]apps[\\/]/,
            priority: 5,
          }
        }
      };
    }
    return config;
  }
};
```

### 2. 로딩 최적화

- **지연 로딩**: React.lazy() 활용
- **프리로딩**: 예상 앱 미리 로드
- **캐싱**: 로드된 컴포넌트 메모리 캐시
- **CDN**: 정적 자원 빠른 배포

### 3. 메모리 관리

- **앱 언로딩**: 사용하지 않는 앱 메모리 해제
- **상태 정리**: 불필요한 상태 데이터 제거
- **가비지 컬렉션**: 메모리 누수 방지

---

## 🚀 배포 아키텍처

### 배포 환경

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ • 로컬 환경      │    │ • Vercel Preview │    │ • Vercel Pro    │
│ • 개발 DB       │ →  │ • 테스트 DB      │ →  │ • 프로덕션 DB    │
│ • Hot Reload    │    │ • E2E 테스트     │    │ • 모니터링       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### CI/CD 파이프라인

```yaml
# GitHub Actions
name: Deploy Pipeline
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run Tests
        run: |
          npm ci
          npm run test
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod
```

---

## 📊 모니터링 아키텍처

### 성능 모니터링

```typescript
class PerformanceMonitor {
  static measureAppLoadTime(appId: string): void {
    performance.mark(`app-load-start-${appId}`);
  }

  static finishAppLoadMeasurement(appId: string): number {
    performance.mark(`app-load-end-${appId}`);
    return performance.measure(`app-load-${appId}`).duration;
  }
}
```

### 실시간 모니터링

- **Vercel Analytics**: 성능 메트릭
- **Sentry**: 에러 트래킹
- **Custom Metrics**: 앱별 사용량 통계

---

## 🔄 확장성 고려사항

### 1. 수평적 확장
- **앱 수 확장**: 새로운 마이크로 앱 쉽게 추가
- **사용자 확장**: 멀티 테넌트 지원 (RLS)
- **기능 확장**: 플러그인 아키텍처 지원

### 2. 수직적 확장
- **성능 확장**: 코드 분할 및 최적화
- **저장소 확장**: Supabase 스케일링
- **서버 확장**: Vercel Edge Functions

### 3. 미래 확장 계획
- **모바일 앱**: React Native 플랫폼 추가
- **데스크톱 앱**: Electron 래퍼
- **API 플랫폼**: 외부 연동 API 제공

---

**다음**: [API 레퍼런스](03-API-REFERENCE.md)에서 상세한 API 명세를 확인하세요.