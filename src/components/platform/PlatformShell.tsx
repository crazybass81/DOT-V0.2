// DOT Platform V0.2 - Platform Shell Component
// 플랫폼 메인 셸 컴포넌트

'use client'

import React, { useEffect, useState } from 'react'
import { usePlatformShell } from '../../lib/platform/shell'
import type { LoadedApp } from '../../lib/platform/types'
import AppStore from '../apps/AppStore'

// 아이콘 컴포넌트들
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const AppsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const StoreIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
)

// 헤더 컴포넌트
interface PlatformHeaderProps {
  navigationOpen: boolean
  onToggleNavigation: () => void
  currentApp: LoadedApp | null
  onOpenAppStore: () => void
}

const PlatformHeader: React.FC<PlatformHeaderProps> = ({
  navigationOpen,
  onToggleNavigation,
  currentApp,
  onOpenAppStore
}) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
      {/* 왼쪽: 메뉴 버튼 및 로고 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleNavigation}
          className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          aria-label={navigationOpen ? "내비게이션 닫기" : "내비게이션 열기"}
        >
          {navigationOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">DOT Platform</h1>
            <p className="text-xs text-gray-500">v0.2</p>
          </div>
        </div>
      </div>

      {/* 중앙: 현재 앱 정보 */}
      {currentApp && (
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center">
            <AppsIcon />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {currentApp.manifest?.name || currentApp.appId}
          </span>
          <div className={`w-2 h-2 rounded-full ${
            currentApp.status === 'active' ? 'bg-green-500' :
            currentApp.status === 'error' ? 'bg-red-500' :
            'bg-yellow-500'
          }`} />
        </div>
      )}

      {/* 오른쪽: 사용자 메뉴 */}
      <div className="flex items-center space-x-2">
        <div className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
          플랫폼 준비완료
        </div>
        <button
          onClick={onOpenAppStore}
          className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          title="앱 스토어"
        >
          <StoreIcon />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200">
          <UserIcon />
        </button>
      </div>
    </header>
  )
}

// 내비게이션 컴포넌트
interface PlatformNavigationProps {
  isOpen: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  availableApps: any[]
  installedApps: any[]
  currentApp: LoadedApp | null
  onSwitchApp: (appId: string) => void
  isLoadingApp: boolean
}

const PlatformNavigation: React.FC<PlatformNavigationProps> = ({
  isOpen,
  collapsed,
  onToggleCollapse,
  availableApps,
  installedApps,
  currentApp,
  onSwitchApp,
  isLoadingApp
}) => {
  return (
    <nav className={`
      fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-20
      transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      ${collapsed ? 'w-16' : 'w-64'}
      lg:relative lg:top-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0
    `}>
      {/* 내비게이션 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              앱 메뉴
            </h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={collapsed ? "내비게이션 확장" : "내비게이션 축소"}
          >
            <svg className="w-4 h-4 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 내비게이션 메뉴 */}
      <div className="flex flex-col h-full overflow-y-auto">
        {/* 홈 */}
        <button
          onClick={() => onSwitchApp('home')}
          className={`
            flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200
            ${currentApp?.appId === 'home' ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' : 'text-gray-700'}
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <HomeIcon />
          {!collapsed && <span className="ml-3 text-sm font-medium">홈</span>}
        </button>

        {/* 설치된 앱들 */}
        {installedApps.length > 0 && (
          <div className="mt-4">
            {!collapsed && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  설치된 앱
                </h3>
              </div>
            )}
            {installedApps.map((app) => (
              <button
                key={app.app_id}
                onClick={() => onSwitchApp(app.app_id)}
                disabled={isLoadingApp}
                className={`
                  flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 w-full
                  ${currentApp?.appId === app.app_id ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' : 'text-gray-700'}
                  ${collapsed ? 'justify-center' : ''}
                  ${isLoadingApp ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="w-5 h-5 bg-gray-300 rounded flex items-center justify-center">
                  <AppsIcon />
                </div>
                {!collapsed && (
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {app.display_name_ko || app.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      v{app.version}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 사용 가능한 앱들 (설치되지 않은) */}
        {availableApps.length > 0 && (
          <div className="mt-4">
            {!collapsed && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  사용 가능한 앱
                </h3>
              </div>
            )}
            {availableApps.slice(0, 5).map((app) => (
              <button
                key={app.app_id}
                onClick={() => {/* 설치 로직 */}}
                className={`
                  flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 w-full text-gray-500
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                  <AppsIcon />
                </div>
                {!collapsed && (
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {app.display_name_ko || app.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      설치 가능
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 하단 메뉴 */}
        <div className="mt-auto border-t border-gray-200">
          <button
            className={`
              flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 w-full text-gray-700
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <SettingsIcon />
            {!collapsed && <span className="ml-3 text-sm font-medium">설정</span>}
          </button>
        </div>
      </div>
    </nav>
  )
}

// 앱 컨테이너 컴포넌트
interface AppContainerProps {
  currentApp: LoadedApp | null
  isLoadingApp: boolean
  shellError: string | null
  appErrors: Map<string, any>
  children?: React.ReactNode
}

const AppContainer: React.FC<AppContainerProps> = ({
  currentApp,
  isLoadingApp,
  shellError,
  appErrors,
  children
}) => {
  if (shellError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">플랫폼 오류</h3>
          <p className="text-gray-600 mb-4">{shellError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  if (isLoadingApp) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">앱을 로딩하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (!currentApp) {
    // 기본 페이지 콘텐츠가 있으면 표시, 없으면 환영 메시지
    if (children) {
      return (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )
    }

    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
            <HomeIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">DOT Platform에 오신 것을 환영합니다</h3>
          <p className="text-gray-600 mb-4">
            마이크로 앱 아키텍처 기반의 확장 가능한 플랫폼입니다.
            좌측 메뉴에서 앱을 선택하여 시작하세요.
          </p>
          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🏗️ 현재 구현 상태</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ 플랫폼 셸 구조</li>
                <li>✅ 상태 관리 시스템</li>
                <li>✅ 동적 앱 로딩 준비</li>
                <li>⏳ 마이크로 앱 구현 예정</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasError = appErrors.has(currentApp.appId)
  if (hasError) {
    const error = appErrors.get(currentApp.appId)
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">앱 실행 오류</h3>
          <p className="text-gray-600 mb-4">{error?.message || '앱을 실행할 수 없습니다'}</p>
          <div className="space-x-2">
            <button
              onClick={() => {/* 재시도 로직 */}}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
            >
              다시 시도
            </button>
            <button
              onClick={() => {/* 앱 전환 로직 */}}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              다른 앱 선택
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 실제 앱 렌더링
  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full bg-white">
        {currentApp.component ? (
          <currentApp.component
            context={currentApp.context}
            platformApi={{} as any} // 실제 구현에서는 proper API 제공
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <AppsIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentApp.appId}</h3>
              <p className="text-gray-600">앱 컴포넌트를 로딩하고 있습니다...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 메인 PlatformShell 컴포넌트
interface PlatformShellProps {
  children?: React.ReactNode
}

export default function PlatformShell({ children }: PlatformShellProps) {
  const {
    // 상태
    isInitialized,
    currentApp,
    availableApps,
    installedApps,
    navigationOpen,
    shellCollapsed,
    isLoadingApp,
    shellError,
    appErrors,
    appStoreOpen,
    installingApps,

    // 액션
    initialize,
    switchToApp,
    toggleNavigation,
    toggleShellCollapse,
    setNavigationOpen,
    openAppStore,
    closeAppStore,
    installAppFromStore,
    uninstallAppFromStore
  } = usePlatformShell()

  // 초기화
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  // 설치된 앱 목록을 Set으로 변환
  const installedAppIds = new Set(installedApps.map(app => app.app_id))

  // 모바일에서 클릭 외부 영역 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (navigationOpen && !target.closest('nav') && !target.closest('button[aria-label*="내비게이션"]')) {
        setNavigationOpen(false)
      }
    }

    if (navigationOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [navigationOpen, setNavigationOpen])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B로 내비게이션 토글
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        toggleNavigation()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [toggleNavigation])

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">플랫폼을 초기화하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <PlatformHeader
        navigationOpen={navigationOpen}
        onToggleNavigation={toggleNavigation}
        currentApp={currentApp}
        onOpenAppStore={openAppStore}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 내비게이션 */}
        <PlatformNavigation
          isOpen={navigationOpen}
          collapsed={shellCollapsed}
          onToggleCollapse={toggleShellCollapse}
          availableApps={availableApps}
          installedApps={installedApps}
          currentApp={currentApp}
          onSwitchApp={switchToApp}
          isLoadingApp={isLoadingApp}
        />

        {/* 앱 컨테이너 */}
        <AppContainer
          currentApp={currentApp}
          isLoadingApp={isLoadingApp}
          shellError={shellError}
          appErrors={appErrors}
          children={children}
        />
      </div>

      {/* 모바일 오버레이 */}
      {navigationOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" />
      )}

      {/* 앱 스토어 */}
      <AppStore
        isOpen={appStoreOpen}
        onClose={closeAppStore}
        onInstallApp={installAppFromStore}
        onUninstallApp={uninstallAppFromStore}
        installedApps={installedAppIds}
        installingApps={installingApps}
      />
    </div>
  )
}