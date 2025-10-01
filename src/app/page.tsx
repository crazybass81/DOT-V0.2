import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DOT Platform V0.2 - 플랫폼 홈',
  description: '마이크로 앱 아키텍처 기반 플랫폼 메인 페이지',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-platform-bg">
      {/* 플랫폼 헤더 */}
      <header className="bg-platform-surface border-b border-platform-border">
        <div className="platform-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-platform-text">
                    DOT Platform
                  </h1>
                  <p className="text-xs text-platform-text-muted">v0.2</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                플랫폼 베이스 준비 완료
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="platform-container py-8">
        <div className="max-w-4xl mx-auto">
          {/* 환영 섹션 */}
          <div className="platform-card p-8 mb-8">
            <h2 className="text-2xl font-bold text-platform-text mb-4">
              DOT Platform V0.2에 오신 것을 환영합니다
            </h2>
            <p className="text-platform-text-muted mb-6 leading-relaxed">
              마이크로 앱 아키텍처 기반의 확장 가능한 플랫폼입니다.
              현재 플랫폼 베이스 구조가 준비되어 있으며, 향후 다양한 마이크로 앱들을
              동적으로 로딩하고 실행할 수 있습니다.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 현재 상태 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-platform-text">
                  🏗️ 현재 구현된 기능
                </h3>
                <ul className="space-y-2 text-sm text-platform-text-muted">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Next.js 14+ App Router 기반 구조</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>TypeScript 5+ Strict 모드</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Tailwind CSS 4+ 디자인 시스템</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>플랫폼 기본 디렉토리 구조</span>
                  </li>
                </ul>
              </div>

              {/* 예정된 기능 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-platform-text">
                  📋 구현 예정 기능
                </h3>
                <ul className="space-y-2 text-sm text-platform-text-muted">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span>Supabase 데이터베이스 통합</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span>플랫폼 셸 (Platform Shell)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span>앱 레지스트리 시스템</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span>동적 모듈 로딩 시스템</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span>MCP 서버 통합</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 아키텍처 개요 */}
          <div className="platform-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-platform-text mb-4">
              🏛️ 플랫폼 아키텍처
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-xs text-gray-700 overflow-x-auto">
{`┌─────────────────────────────────────────────────────────┐
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
├─────────────────────────────────────────────────────────┤
│                   Data Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Supabase    │ │  Realtime   │ │MCP Bridge   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </div>

          {/* 중요 알림 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-500 mt-0.5">
                ℹ️
              </div>
              <div>
                <h4 className="text-blue-900 font-semibold mb-2">
                  개발 진행 상황 안내
                </h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  현재 T001 작업이 완료되어 Next.js 프로젝트 기본 구조가 준비되었습니다.
                  다음 단계로 Supabase 데이터베이스 스키마 구현과 환경 설정이 진행될 예정입니다.
                  플랫폼 베이스만 구축하며, 세부 앱 기능은 별도로 구현될 예정입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}