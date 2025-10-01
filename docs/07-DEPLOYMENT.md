# DOT Platform V0.2 - 배포 및 운영 가이드

## 🚀 배포 아키텍처 개요

### 배포 환경 계층

```
┌─────────────────────────────────────────────────────────┐
│                   Production Layer                      │
│  ┌─────────────────┐ ┌─────────────────┐              │
│  │   Vercel Pro    │ │ Supabase Cloud  │              │
│  │  • Edge CDN     │ │  • PostgreSQL   │              │
│  │  • Functions    │ │  • Auth         │              │
│  │  • Analytics    │ │  • Realtime     │              │
│  └─────────────────┘ └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│                    Staging Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐              │
│  │ Vercel Preview  │ │ Staging DB      │              │
│  │  • PR Previews  │ │  • Test Data    │              │
│  │  • E2E Tests    │ │  • Migration    │              │
│  └─────────────────┘ └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│                 Development Layer                      │
│  ┌─────────────────┐ ┌─────────────────┐              │
│  │  Local Dev      │ │   Local DB      │              │
│  │  • Hot Reload   │ │  • Docker       │              │
│  │  • Debug Mode   │ │  • Seed Data    │              │
│  └─────────────────┘ └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ 환경별 배포 설정

### 개발 환경 (Development)

**목적**: 로컬 개발 및 디버깅

```bash
# 환경 설정
NODE_ENV=development
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Supabase 로컬 설정
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# 개발 도구
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_MCP_ENABLED=true
```

**로컬 실행**:
```bash
# 의존성 설치
npm ci

# Supabase 로컬 시작
npx supabase start

# 개발 서버 시작
npm run dev

# 병렬 실행 (개발 + 타입체크)
npm run dev & npm run type-check:watch
```

### 스테이징 환경 (Staging)

**목적**: 통합 테스트 및 검증

```bash
# Vercel 환경변수 설정
NODE_ENV=staging
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_API_URL=https://dot-platform-staging.vercel.app/api

# Supabase 스테이징
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# 스테이징 전용
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_MCP_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

**스테이징 배포 과정**:
```bash
# 1. PR 생성시 자동 배포
git push origin feature/new-feature

# 2. Preview URL 생성
# → https://dot-platform-git-feature-new-feature-team.vercel.app

# 3. E2E 테스트 실행
npm run test:e2e:staging

# 4. 성능 테스트
npm run test:lighthouse:staging
```

### 프로덕션 환경 (Production)

**목적**: 실제 서비스 제공

```bash
# 프로덕션 설정
NODE_ENV=production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_API_URL=https://dot-platform.vercel.app/api

# Supabase 프로덕션
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# 프로덕션 최적화
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_MCP_ENABLED=false
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_MONITORING_ENABLED=true

# 보안 설정
NEXTAUTH_SECRET=super-secret-key-for-production
NEXTAUTH_URL=https://dot-platform.vercel.app
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions 워크플로우

**.github/workflows/deploy.yml**:
```yaml
name: Deploy Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run ESLint
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build project
        run: npm run build
        env:
          NODE_ENV: production

  deploy-staging:
    needs: quality-check
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "preview_url=$url" >> $GITHUB_OUTPUT

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed: ${{ steps.deploy.outputs.preview_url }}'
            })

  deploy-production:
    needs: quality-check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  e2e-tests:
    needs: deploy-staging
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: ${{ needs.deploy-staging.outputs.preview_url }}

      - name: Upload E2E test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 배포 단계별 검증

**1. 품질 검증 단계**:
```bash
# 타입 검사
npm run type-check

# 린팅
npm run lint

# 유닛 테스트
npm run test

# 빌드 검증
npm run build
```

**2. 스테이징 배포**:
```bash
# Preview 배포
vercel deploy

# E2E 테스트
npm run test:e2e

# 성능 테스트
npm run lighthouse
```

**3. 프로덕션 배포**:
```bash
# 프로덕션 배포
vercel deploy --prod

# 배포 후 검증
npm run test:production

# 모니터링 활성화
npm run monitoring:enable
```

---

## ⚙️ Next.js 배포 최적화

### next.config.js 프로덕션 설정

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 성능 최적화
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    ppr: false, // Partial Pre-rendering (실험적)
  },

  // 번들 최적화
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // 프로덕션 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // 플랫폼 코어
          platform: {
            name: 'platform',
            test: /[\\/]src[\\/](components|lib)[\\/]platform[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          // 마이크로 앱들
          apps: {
            name: 'apps',
            test: /[\\/]src[\\/]apps[\\/]/,
            priority: 8,
            reuseExistingChunk: true,
          },
          // 공통 라이브러리
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Tree shaking 최적화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  // 이미지 최적화
  images: {
    domains: ['supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 압축 및 최적화
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Edge Runtime 설정
  experimental: {
    runtime: 'edge',
    allowedRevalidateHeaderKeys: ['authorization'],
  },

  // 환경별 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 성능 모니터링 설정

**src/lib/monitoring.ts**:
```typescript
// Web Vitals 모니터링
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (process.env.NODE_ENV === 'production') {
    // Vercel Analytics
    if (window.va) {
      window.va('track', 'WebVital', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label,
      });
    }

    // 커스텀 메트릭 수집
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        timestamp: Date.now(),
        url: window.location.pathname,
      }),
    });
  }
}

// 앱 로딩 성능 측정
export class AppPerformanceMonitor {
  private static measurements = new Map<string, number>();

  static startMeasure(appId: string): void {
    const start = performance.now();
    this.measurements.set(`${appId}-start`, start);
    performance.mark(`app-load-start-${appId}`);
  }

  static endMeasure(appId: string): number {
    const end = performance.now();
    const start = this.measurements.get(`${appId}-start`);

    if (start) {
      const duration = end - start;
      performance.mark(`app-load-end-${appId}`);
      performance.measure(`app-load-${appId}`,
        `app-load-start-${appId}`,
        `app-load-end-${appId}`);

      // 프로덕션에서 메트릭 전송
      if (process.env.NODE_ENV === 'production') {
        this.reportMetric('app-load-time', duration, { appId });
      }

      return duration;
    }

    return 0;
  }

  private static reportMetric(name: string, value: number, labels: Record<string, string>) {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        labels,
        timestamp: Date.now(),
      }),
    });
  }
}
```

---

## 🗄️ Supabase 배포 설정

### 환경별 데이터베이스 관리

**개발 환경 설정**:
```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 개발 시작
supabase start

# 마이그레이션 생성
supabase migration new create-platform-tables

# 로컬 적용
supabase db reset
```

**프로덕션 마이그레이션**:
```sql
-- migrations/20240101000001_create-platform-tables.sql
-- 플랫폼 코어 테이블
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'DOT Platform V0.2',
  version TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앱 레지스트리
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  manifest JSONB NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'installing', 'error')),
  install_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 앱 관계
CREATE TABLE user_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT REFERENCES apps(app_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'installed',
  settings JSONB DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- 앱 데이터 저장소
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

-- RLS 정책 설정
ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own apps" ON user_apps
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own app data" ON app_data
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_user_apps_user_id ON user_apps(user_id);
CREATE INDEX idx_user_apps_app_id ON user_apps(app_id);
CREATE INDEX idx_app_data_user_app ON app_data(user_id, app_id);
```

**Edge Functions 배포**:
```typescript
// supabase/functions/platform-api/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method } = req;
    const url = new URL(req.url);
    const path = url.pathname.replace('/platform-api', '');

    // 플랫폼 정보 API
    if (path === '/info' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('platforms')
        .select('*')
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 앱 목록 API
    if (path === '/apps' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('apps')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          message_ko: '엔드포인트를 찾을 수 없습니다',
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
          message_ko: '서버 내부 오류가 발생했습니다',
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

---

## 📊 모니터링 및 관찰성

### 성능 모니터링

**Vercel Analytics 설정**:
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**커스텀 메트릭 수집**:
```typescript
// app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // 메트릭 저장
    const { error } = await supabase
      .from('platform_metrics')
      .insert({
        name: metric.name,
        value: metric.value,
        labels: metric.labels || {},
        timestamp: new Date(metric.timestamp),
        user_agent: request.headers.get('user-agent'),
        url: metric.url,
      });

    if (error) throw error;

    // 실시간 알림 (임계값 초과시)
    if (metric.name === 'app-load-time' && metric.value > 3000) {
      await sendSlackAlert({
        type: 'performance',
        message: `앱 로딩 시간이 ${metric.value}ms로 임계값을 초과했습니다`,
        appId: metric.labels?.appId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Metrics collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect metric' },
      { status: 500 }
    );
  }
}

async function sendSlackAlert(alert: {
  type: string;
  message: string;
  appId?: string;
}) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 [DOT Platform] ${alert.type.toUpperCase()}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.message}*${alert.appId ? `\n앱 ID: ${alert.appId}` : ''}`,
          },
        },
      ],
    }),
  });
}
```

### 오류 추적

**Sentry 설정**:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 환경별 설정
  environment: process.env.NODE_ENV,

  // 사용자 컨텍스트
  beforeSend(event, hint) {
    // 민감한 정보 제거
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.Cookie;
    }

    return event;
  },

  // 릴리스 추적
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

---

## 🔐 프로덕션 보안

### 환경변수 보안 관리

**Vercel 환경변수 설정**:
```bash
# 프로덕션 필수 변수들
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# 선택적 보안 변수들
vercel env add SENTRY_DSN production
vercel env add SLACK_WEBHOOK_URL production
vercel env add MONITORING_API_KEY production
```

**보안 헤더 설정**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 보안 헤더 추가
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
  );

  // API 경로 보호
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const token = request.headers.get('authorization');

    if (!token && !request.nextUrl.pathname.startsWith('/api/public/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 🚨 장애 대응 및 복구

### 자동 복구 시스템

**헬스 체크 API**:
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = [];
  const startTime = Date.now();

  try {
    // 데이터베이스 연결 확인
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('platforms')
      .select('id')
      .limit(1);

    checks.push({
      name: 'database',
      status: dbError ? 'error' : 'healthy',
      responseTime: Date.now() - dbStart,
      error: dbError?.message,
    });

    // 외부 서비스 확인
    const serviceChecks = await Promise.allSettled([
      // Vercel Analytics 확인
      fetch('https://vercel.com/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        },
      }).then(res => res.ok),

      // 기타 서비스들...
    ]);

    checks.push({
      name: 'external_services',
      status: serviceChecks.every(check =>
        check.status === 'fulfilled' && check.value
      ) ? 'healthy' : 'degraded',
      details: serviceChecks.map(check => ({
        status: check.status,
        value: check.status === 'fulfilled' ? check.value : false,
      })),
    });

    const overallStatus = checks.every(check =>
      check.status === 'healthy'
    ) ? 'healthy' : 'degraded';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version,
      checks,
    };

    return NextResponse.json(response, {
      status: overallStatus === 'healthy' ? 200 : 503,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks,
    }, { status: 500 });
  }
}
```

### 백업 및 복구 전략

**자동 백업 시스템**:
```bash
#!/bin/bash
# scripts/backup.sh

# 환경별 백업 설정
if [ "$NODE_ENV" = "production" ]; then
  BACKUP_BUCKET="s3://dot-platform-backups"
  RETENTION_DAYS=30
else
  BACKUP_BUCKET="s3://dot-platform-backups-staging"
  RETENTION_DAYS=7
fi

# 데이터베이스 백업
echo "Starting database backup..."
BACKUP_FILENAME="db-backup-$(date +%Y%m%d-%H%M%S).sql"

# Supabase 데이터베이스 덤프
pg_dump "$DATABASE_URL" > "$BACKUP_FILENAME"

# S3 업로드
aws s3 cp "$BACKUP_FILENAME" "$BACKUP_BUCKET/database/"

# 로컬 파일 정리
rm "$BACKUP_FILENAME"

# 오래된 백업 정리
aws s3 ls "$BACKUP_BUCKET/database/" | \
while read -r line; do
  createDate=$(echo "$line" | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "$RETENTION_DAYS days ago" +%s)

  if [[ "$createDate" -lt "$olderThan" ]]; then
    fileName=$(echo "$line" | awk '{print $4}')
    aws s3 rm "$BACKUP_BUCKET/database/$fileName"
  fi
done

echo "Database backup completed: $BACKUP_FILENAME"
```

**복구 절차**:
```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: $0 YYYYMMDD-HHMMSS"
  exit 1
fi

BACKUP_FILE="db-backup-$BACKUP_DATE.sql"

# 백업 파일 다운로드
aws s3 cp "s3://dot-platform-backups/database/$BACKUP_FILE" .

# 복구 실행 (주의: 기존 데이터 삭제됨)
echo "⚠️  WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # 데이터베이스 복원
  psql "$DATABASE_URL" < "$BACKUP_FILE"
  echo "✅ Database restored from $BACKUP_FILE"
else
  echo "❌ Restore cancelled"
fi

# 정리
rm "$BACKUP_FILE"
```

---

## 📈 확장성 및 최적화

### 로드 밸런싱 전략

**Vercel Edge Functions 활용**:
```typescript
// app/api/apps/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Edge에서 캐시된 앱 정보 반환
  const cacheKey = `app-${params.id}`;
  const cached = await getEdgeCache(cacheKey);

  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  }

  // 캐시 미스시 데이터베이스에서 조회
  const appData = await fetchAppData(params.id);
  await setEdgeCache(cacheKey, appData, 300); // 5분 캐시

  return NextResponse.json(appData);
}

async function getEdgeCache(key: string) {
  try {
    const cached = await caches.default.match(
      new Request(`https://cache.internal/${key}`)
    );
    return cached ? await cached.json() : null;
  } catch {
    return null;
  }
}

async function setEdgeCache(key: string, data: any, ttl: number) {
  try {
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Cache-Control': `max-age=${ttl}`,
        'Content-Type': 'application/json',
      },
    });

    await caches.default.put(
      new Request(`https://cache.internal/${key}`),
      response
    );
  } catch (error) {
    console.error('Cache set failed:', error);
  }
}
```

### 성능 최적화 체크리스트

**배포 전 성능 검증**:
```bash
# package.json scripts 추가
{
  "scripts": {
    "perf:audit": "lighthouse-ci autorun",
    "perf:bundle": "npm run build && npx @next/bundle-analyzer",
    "perf:core-vitals": "npx web-vitals-cli https://your-app.vercel.app",
    "perf:full-check": "npm run perf:bundle && npm run perf:audit && npm run perf:core-vitals"
  }
}
```

**lighthouse.config.js**:
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/apps'],
      startServerCommand: 'npm start',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

## 🎯 배포 체크리스트

### 프로덕션 배포 전 확인사항

**🔴 필수 확인 (Critical)**:
- [ ] 환경변수 설정 완료 (`SUPABASE_*`, `NEXTAUTH_*`)
- [ ] 데이터베이스 마이그레이션 적용
- [ ] 보안 헤더 및 CSP 설정
- [ ] SSL 인증서 유효성
- [ ] 백업 시스템 작동 확인

**🟡 권장 확인 (Recommended)**:
- [ ] 성능 테스트 통과 (Lighthouse > 90점)
- [ ] E2E 테스트 성공
- [ ] 모니터링 시스템 연동
- [ ] 로그 수집 설정
- [ ] 에러 추적 (Sentry) 연동

**🟢 선택 확인 (Optional)**:
- [ ] A/B 테스트 설정
- [ ] 분석 도구 연동
- [ ] 알림 시스템 구성
- [ ] 문서 업데이트

### 배포 후 검증 절차

**즉시 검증 (0-5분)**:
```bash
# 1. 헬스 체크
curl https://your-app.vercel.app/api/health

# 2. 기본 페이지 로딩
curl -I https://your-app.vercel.app

# 3. API 응답 확인
curl https://your-app.vercel.app/api/platform/info
```

**단기 검증 (5-30분)**:
- 핵심 사용자 플로우 테스트
- 성능 메트릭 모니터링
- 에러율 확인
- 트래픽 분산 상태 점검

**장기 모니터링 (30분-24시간)**:
- Web Vitals 추이 관찰
- 사용자 피드백 수집
- 리소스 사용량 모니터링
- 백업 시스템 정상 작동 확인

---

**다음**: [DOT Platform V0.2 Documentation](README.md)에서 전체 문서 구조를 확인하세요.