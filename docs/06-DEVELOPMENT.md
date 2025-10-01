# DOT Platform V0.2 - 개발자 가이드

## 🎯 개발자를 위한 가이드

이 가이드는 DOT Platform V0.2에서 마이크로 앱을 개발하고, 플랫폼을 확장하는 개발자를 위한 종합 가이드입니다.

---

## 🚀 개발 환경 설정

### 필수 도구 설치
```bash
# Node.js LTS (18.17+)
# https://nodejs.org/en/download/

# Supabase CLI
npm install -g supabase

# Claude Code (AI 개발 도구)
npm install -g @anthropic/claude-code

# MCP 서버들 (개발용)
npm install -g @21st-ui/code-magic-server
npm install -g @morphllm/morphllm-server
npm install -g @context7/context7-mcp
npm install -g @playwright/test
```

### IDE 설정
**Visual Studio Code 확장 (권장)**:
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "supabase.supabase-vscode",
    "esbenp.prettier-vscode"
  ]
}
```

### 개발 서버 시작
```bash
# 기본 개발 서버
npm run dev

# MCP 서버 포함 전체 개발 환경
npm run dev:full

# 개별 서버 관리
npm run mcp:start
npm run mcp:stop
npm run mcp:status
```

---

## 📁 프로젝트 구조 이해

### 디렉토리 구조
```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # 루트 레이아웃
│   ├── page.tsx               # 홈페이지
│   ├── api/                   # API 엔드포인트
│   │   ├── platform/          # 플랫폼 관리 API
│   │   ├── apps/              # 앱 관리 API
│   │   └── mcp/               # MCP 통합 API
│   └── apps/                  # 마이크로 앱들
│       └── [appId]/           # 동적 앱 라우팅
├── components/
│   ├── platform/              # 플랫폼 셸 컴포넌트
│   │   ├── PlatformShell.tsx  # 메인 셸
│   │   └── AppContainer.tsx   # 앱 컨테이너
│   ├── layout/                # 레이아웃 컴포넌트
│   │   ├── Header.tsx         # 헤더
│   │   ├── Sidebar.tsx        # 사이드바
│   │   └── Navigation.tsx     # 네비게이션
│   └── ui/                    # 공통 UI 컴포넌트
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── lib/                       # 핵심 라이브러리
│   ├── auth/                  # 인증 서비스
│   ├── state/                 # 상태 관리 (Zustand)
│   ├── router/                # 동적 라우팅
│   ├── app-registry/          # 앱 레지스트리
│   ├── dynamic-loader/        # 동적 로딩
│   ├── mcp/                   # MCP 통합
│   └── database/              # DB 클라이언트
├── types/                     # TypeScript 타입 정의
├── hooks/                     # 커스텀 훅
└── utils/                     # 유틸리티 함수
```

### 핵심 컴포넌트 역할

#### 1. Platform Shell
```typescript
// src/components/platform/PlatformShell.tsx
export default function PlatformShell({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1">
        <Header />
        <AppContainer>
          {children}
        </AppContainer>
      </main>
    </div>
  );
}
```

#### 2. App Container
```typescript
// src/components/platform/AppContainer.tsx
export default function AppContainer({ children }: PropsWithChildren) {
  const { currentApp, loading, error } = useAppLoader();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div className="app-container p-4">
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </div>
  );
}
```

---

## 🧩 마이크로 앱 개발

### 새 마이크로 앱 생성

**1. 앱 디렉토리 생성**
```bash
# 앱 스캐폴딩 명령 (개발 예정)
npm run create:microapp -- --name=my-app --type=basic

# 수동 생성
mkdir -p src/apps/my-app/{components,lib,types}
```

**2. 앱 매니페스트 작성**
`src/apps/my-app/manifest.json`:
```json
{
  "app_id": "my-app",
  "name": "My Application",
  "display_name_ko": "나의 앱",
  "version": "1.0.0",
  "description": "Description of my app",
  "description_ko": "나의 앱 설명",
  "category": "utility",
  "tags": ["productivity", "tools"],
  "routes": [
    {
      "path": "/",
      "component": "MyAppHome",
      "public": false,
      "auth": true
    },
    {
      "path": "/settings",
      "component": "MyAppSettings",
      "public": false,
      "auth": true
    }
  ],
  "permissions": [
    "app:read",
    "app:write",
    "user:profile"
  ],
  "dependencies": ["core"],
  "resources": {
    "max_memory_mb": 50,
    "max_storage_mb": 100
  }
}
```

**3. 메인 컴포넌트 작성**
`src/apps/my-app/index.tsx`:
```tsx
import React, { useState } from 'react';
import { useAppState } from '@/hooks/use-app-state';
import { usePlatformContext } from '@/lib/platform/context';

interface MyAppState {
  title: string;
  data: any[];
}

export default function MyApp() {
  const { user, permissions } = usePlatformContext();
  const [state, setState] = useAppState<MyAppState>('my-app', {
    title: '나의 앱',
    data: []
  });

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {state.title}
          </h1>

          <div className="mt-6">
            <p className="text-gray-600">
              안녕하세요, {user?.name || '사용자'}님!
            </p>

            {/* 앱 특정 기능들 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">기능 1</h3>
                <p className="text-sm text-gray-600 mt-1">
                  앱의 첫 번째 기능 설명
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">기능 2</h3>
                <p className="text-sm text-gray-600 mt-1">
                  앱의 두 번째 기능 설명
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**4. 앱 등록 및 테스트**
```bash
# 개발 모드에서 앱 등록
npm run app:register -- --path=src/apps/my-app

# 앱 목록 확인
npm run app:list

# 브라우저에서 테스트
# http://localhost:3000/apps/my-app
```

### 앱 상태 관리

**앱별 격리된 상태 사용**
```tsx
// src/apps/my-app/components/StateExample.tsx
import { useAppState } from '@/hooks/use-app-state';

interface AppData {
  count: number;
  items: string[];
}

export default function StateExample() {
  const [state, setState] = useAppState<AppData>('my-app', {
    count: 0,
    items: []
  });

  const increment = () => {
    setState(prev => ({
      ...prev,
      count: prev.count + 1
    }));
  };

  const addItem = (item: string) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={increment}>Increment</button>

      <ul>
        {state.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 앱 간 통신

**이벤트 기반 통신**
```tsx
// src/apps/my-app/lib/events.ts
import { useEventBus } from '@/hooks/use-event-bus';

export function useMyAppEvents() {
  const { emit, subscribe } = useEventBus();

  const sendMessage = (message: string) => {
    emit('my-app:message', { message, timestamp: Date.now() });
  };

  const subscribeToMessages = (callback: (data: any) => void) => {
    return subscribe('my-app:message', callback);
  };

  return { sendMessage, subscribeToMessages };
}

// 사용 예시
export default function MyAppComponent() {
  const { sendMessage, subscribeToMessages } = useMyAppEvents();

  useEffect(() => {
    const unsubscribe = subscribeToMessages((data) => {
      console.log('Received message:', data);
    });

    return unsubscribe;
  }, []);

  return (
    <button onClick={() => sendMessage('Hello from my app!')}>
      Send Message
    </button>
  );
}
```

---

## 🔌 플랫폼 API 활용

### 인증 및 권한

**현재 사용자 정보 조회**
```tsx
import { useAuth } from '@/hooks/use-auth';

export default function AuthExample() {
  const { user, session, permissions, checkPermission } = useAuth();

  const handleProtectedAction = async () => {
    if (await checkPermission('app:write')) {
      // 권한이 있는 경우에만 실행
      console.log('User has write permission');
    } else {
      alert('권한이 부족합니다.');
    }
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div>
      <p>환영합니다, {user.name}님!</p>
      <button onClick={handleProtectedAction}>
        보호된 작업 실행
      </button>
    </div>
  );
}
```

### 데이터 저장 및 조회

**앱 데이터 관리**
```tsx
import { useAppData } from '@/hooks/use-app-data';

export default function DataExample() {
  const { data, loading, error, saveData, loadData } = useAppData('my-app');

  useEffect(() => {
    loadData(['user_preferences', 'app_settings']);
  }, []);

  const updatePreferences = async (prefs: any) => {
    await saveData('user_preferences', prefs);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;

  return (
    <div>
      <h3>저장된 데이터</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <button onClick={() => updatePreferences({ theme: 'dark' })}>
        테마 변경
      </button>
    </div>
  );
}
```

### 실시간 통신

**WebSocket 연결 및 이벤트 처리**
```tsx
import { useRealtime } from '@/hooks/use-realtime';

export default function RealtimeExample() {
  const { connected, subscribe, unsubscribe } = useRealtime();

  useEffect(() => {
    // 앱 이벤트 구독
    const unsubscribeApp = subscribe('app-events', (event) => {
      if (event.app_id === 'my-app') {
        console.log('My app event:', event);
      }
    });

    // 플랫폼 이벤트 구독
    const unsubscribePlatform = subscribe('platform-events', (event) => {
      if (event.event === 'maintenance_mode') {
        alert('플랫폼 점검 모드로 전환됩니다.');
      }
    });

    return () => {
      unsubscribeApp();
      unsubscribePlatform();
    };
  }, []);

  return (
    <div>
      <p>실시간 연결 상태: {connected ? '연결됨' : '연결 끊김'}</p>
    </div>
  );
}
```

---

## 🎨 UI 개발 가이드

### Magic MCP를 활용한 컴포넌트 생성

**컴포넌트 자동 생성**
```bash
# Claude Code에서 Magic MCP 사용
claude-code task "Magic MCP를 사용해서 사용자 프로필 카드 컴포넌트 생성"

# 또는 직접 MCP 호출
curl -X POST http://localhost:3001/tools/create-component \
  -H "Content-Type: application/json" \
  -d '{
    "component_type": "user-profile-card",
    "props": {
      "user": "User",
      "avatar": "string",
      "name": "string",
      "email": "string",
      "role": "string"
    },
    "styling": "tailwind"
  }'
```

### 스타일링 가이드

**Tailwind CSS 클래스 사용**
```tsx
// 플랫폼 일관성을 위한 색상 팔레트
const colors = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-100 text-gray-900',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  error: 'bg-red-600 text-white'
};

export default function StyledComponent() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          컴포넌트 제목
        </h2>
        <p className="text-gray-600 mt-2">
          설명 텍스트입니다.
        </p>
        <button className={`mt-4 px-4 py-2 rounded ${colors.primary}`}>
          액션 버튼
        </button>
      </div>
    </div>
  );
}
```

### 반응형 디자인
```tsx
export default function ResponsiveComponent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">모바일 우선</h3>
        <p className="text-sm text-gray-600 mt-1 sm:text-base">
          모든 화면 크기에서 최적화된 경험을 제공합니다.
        </p>
      </div>
    </div>
  );
}
```

---

## 🧪 테스트 가이드

### 단위 테스트

**컴포넌트 테스트**
```tsx
// src/apps/my-app/__tests__/MyApp.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PlatformProvider } from '@/lib/platform/context';
import MyApp from '../index';

const MockPlatformProvider = ({ children }: any) => (
  <PlatformProvider
    value={{
      user: { id: '1', name: 'Test User' },
      permissions: ['app:read', 'app:write'],
      platform: { name: 'DOT Platform V0.2', version: '1.0.0' }
    }}
  >
    {children}
  </PlatformProvider>
);

describe('MyApp', () => {
  test('renders app title', () => {
    render(
      <MockPlatformProvider>
        <MyApp />
      </MockPlatformProvider>
    );

    expect(screen.getByText('나의 앱')).toBeInTheDocument();
  });

  test('displays user greeting', () => {
    render(
      <MockPlatformProvider>
        <MyApp />
      </MockPlatformProvider>
    );

    expect(screen.getByText('안녕하세요, Test User님!')).toBeInTheDocument();
  });
});
```

**서비스 테스트**
```typescript
// src/apps/my-app/__tests__/services.test.ts
import { MyAppService } from '../lib/services';

describe('MyAppService', () => {
  let service: MyAppService;

  beforeEach(() => {
    service = new MyAppService();
  });

  test('should initialize with default state', () => {
    expect(service.getState()).toEqual({
      title: '나의 앱',
      data: []
    });
  });

  test('should update state correctly', () => {
    service.updateTitle('새 제목');
    expect(service.getState().title).toBe('새 제목');
  });
});
```

### 통합 테스트

**API 통합 테스트**
```typescript
// src/apps/my-app/__tests__/integration.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/apps/my-app/data/route';

describe('/api/apps/my-app/data', () => {
  test('should save app data', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test_token',
        'content-type': 'application/json'
      },
      body: {
        key: 'preferences',
        value: { theme: 'dark' }
      }
    });

    const response = await handler.POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### E2E 테스트 (Playwright)

**사용자 시나리오 테스트**
```typescript
// tests/my-app.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 (실제 구현 후 업데이트)
    await page.goto('/');
    // await page.click('[data-testid="login-button"]');
    // 임시로 직접 앱 페이지로 이동
    await page.goto('/apps/my-app');
  });

  test('should load app in platform shell', async ({ page }) => {
    // 플랫폼 셸이 로드되었는지 확인
    await expect(page.locator('[data-testid="platform-shell"]')).toBeVisible();

    // 앱 컨테이너가 로드되었는지 확인
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();

    // 앱 제목이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('나의 앱');
  });

  test('should interact with app features', async ({ page }) => {
    // 기능 1 카드 클릭
    await page.click('text=기능 1');

    // 상태 변경 확인
    await expect(page.locator('[data-testid="feature-status"]')).toContainText('활성');
  });

  test('should maintain state across navigation', async ({ page }) => {
    // 앱에서 상태 변경
    await page.fill('[data-testid="title-input"]', '새로운 제목');

    // 다른 페이지로 이동
    await page.goto('/');

    // 앱으로 다시 돌아오기
    await page.goto('/apps/my-app');

    // 상태가 유지되었는지 확인
    await expect(page.locator('h1')).toContainText('새로운 제목');
  });
});
```

---

## 🚀 성능 최적화

### 코드 분할
```tsx
// 지연 로딩을 위한 동적 임포트
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export default function MyApp() {
  return (
    <div>
      <h1>나의 앱</h1>
      <Suspense fallback={<div>컴포넌트 로딩 중...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}
```

### 메모리 관리
```tsx
import { useEffect, useCallback } from 'react';

export default function MyApp() {
  const handleResize = useCallback(() => {
    // 윈도우 리사이즈 처리
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // 앱 언로드 시 정리 작업
  useEffect(() => {
    return () => {
      // 앱별 리소스 정리
      console.log('My app is being unloaded');
    };
  }, []);

  return <div>앱 컨텐츠</div>;
}
```

### 번들 크기 최적화
```javascript
// webpack.config.js (Next.js 설정에서)
const nextConfig = {
  webpack: (config, { buildId, dev, isServer }) => {
    // 앱별 번들 분리
    if (!dev) {
      config.optimization.splitChunks.cacheGroups.myApp = {
        name: 'my-app',
        test: /[\\/]src[\\/]apps[\\/]my-app[\\/]/,
        priority: 10,
      };
    }

    return config;
  }
};
```

---

## 🔧 디버깅 및 개발 도구

### 개발자 도구 활용

**플랫폼 상태 확인**
```javascript
// 브라우저 콘솔에서
window.__PLATFORM_DEBUG__ = {
  getCurrentApp: () => window.__PLATFORM_STATE__.currentApp,
  getLoadedApps: () => window.__PLATFORM_STATE__.loadedApps,
  getAppState: (appId) => window.__APP_STATES__[appId],
  reloadApp: (appId) => window.__PLATFORM_ACTIONS__.reloadApp(appId)
};
```

**로깅 시스템**
```typescript
// src/apps/my-app/lib/logger.ts
import { createLogger } from '@/lib/logger';

const logger = createLogger('my-app');

export default function MyAppComponent() {
  const handleAction = () => {
    logger.info('User performed action', {
      action: 'button_click',
      timestamp: Date.now()
    });
  };

  return (
    <button onClick={handleAction}>
      액션 실행
    </button>
  );
}
```

### Claude Code 통합 개발

**AI 기반 코드 생성**
```bash
# 컴포넌트 생성
claude-code task "Magic MCP로 사용자 대시보드 컴포넌트 생성"

# 코드 리팩토링
claude-code task "Morphllm MCP로 함수형 컴포넌트로 변환"

# 테스트 생성
claude-code task "현재 컴포넌트에 대한 포괄적인 테스트 케이스 생성"
```

**자동 코드 리뷰**
```bash
# 실시간 코드 리뷰 활성화
claude-code --review --continuous

# 특정 파일 리뷰
claude-code review src/apps/my-app/index.tsx
```

---

## 📦 배포 및 배포 준비

### 앱 빌드
```bash
# 개발 빌드
npm run build

# 앱별 번들 분석
npm run analyze

# 특정 앱만 빌드 (개발 예정)
npm run build:app -- my-app
```

### 앱 테스트 자동화
```bash
# 모든 테스트 실행
npm run test

# 앱별 테스트
npm run test -- src/apps/my-app

# 커버리지 확인
npm run test:coverage
```

### 프로덕션 최적화
```typescript
// src/apps/my-app/config/production.ts
export const productionConfig = {
  enableLogging: false,
  apiTimeout: 10000,
  maxRetries: 3,
  cacheTimeout: 300000, // 5분
  features: {
    analytics: true,
    errorTracking: true,
    performanceMonitoring: true
  }
};
```

---

## 🎯 베스트 프랙티스

### 코드 품질
1. **TypeScript 엄격 모드** 사용
2. **ESLint 규칙** 준수
3. **단위 테스트** 90% 이상 커버리지
4. **코드 리뷰** 필수

### 성능
1. **지연 로딩** 적극 활용
2. **메모이제이션** 적절히 사용
3. **번들 크기** 최소화
4. **메모리 누수** 방지

### 보안
1. **입력 데이터** 검증
2. **XSS 방지** 처리
3. **권한 확인** 필수
4. **민감 데이터** 로깅 금지

### 사용자 경험
1. **로딩 상태** 표시
2. **에러 처리** 친화적
3. **접근성** 고려
4. **반응형** 디자인

---

**다음**: [배포 가이드](07-DEPLOYMENT.md)에서 프로덕션 환경 설정을 확인하세요.