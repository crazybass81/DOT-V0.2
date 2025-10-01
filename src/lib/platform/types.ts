// DOT Platform V0.2 - Platform Shell Types
// 플랫폼 셸 관련 TypeScript 타입 정의

import { ReactNode } from 'react'
import type { App, UserApp, AppManifest } from '../database/types'

// ===========================================
// 플랫폼 셸 상태 타입
// ===========================================

export interface PlatformShellState {
  // 현재 상태
  isInitialized: boolean
  currentApp: LoadedApp | null
  loadedApps: Map<string, LoadedApp>

  // 앱 목록 및 메타데이터
  availableApps: App[]
  installedApps: UserApp[]

  // UI 상태
  navigationOpen: boolean
  shellCollapsed: boolean

  // 로딩 상태
  isLoadingApps: boolean
  isLoadingApp: boolean

  // 에러 상태
  shellError: string | null
  appErrors: Map<string, AppError>

  // 앱 스토어 상태
  appStoreOpen: boolean
  installingApps: Map<string, AppInstallProgress>
}

// ===========================================
// 앱 생명주기 타입
// ===========================================

export interface LoadedApp {
  // 앱 메타데이터
  id: string
  appId: string
  manifest: AppManifest

  // 런타임 상태
  status: AppStatus
  component: React.ComponentType<AppProps> | null

  // 리소스 관리
  mountedAt: Date
  lastActivityAt: Date
  memoryUsage?: number

  // 에러 관리
  errorCount: number
  lastError?: AppError

  // 컨텍스트
  context: AppContext
}

export type AppStatus =
  | 'initializing'  // 초기화 중
  | 'loading'       // 로딩 중
  | 'mounted'       // 마운트됨
  | 'active'        // 활성 상태
  | 'inactive'      // 비활성 상태
  | 'error'         // 에러 발생
  | 'unmounting'    // 언마운트 중
  | 'unmounted'     // 언마운트됨

export interface AppError {
  code: string
  message: string
  stack?: string
  timestamp: Date
  recoverable: boolean
  retryCount: number
}

export interface AppContext {
  // 플랫폼 정보
  platformVersion: string
  userId?: string
  sessionId: string

  // 앱 권한
  permissions: string[]

  // 리소스 제한
  memoryLimit: number
  storageLimit: number
  networkAllowed: boolean

  // API 접근
  apiBaseUrl: string
  apiToken?: string
}

export interface AppProps {
  // 앱 컨텍스트
  context: AppContext

  // 플랫폼 API
  platformApi: PlatformAPI

  // 생명주기 콜백
  onMount?: () => void
  onUnmount?: () => void
  onError?: (error: AppError) => void
}

// ===========================================
// 플랫폼 API 타입
// ===========================================

export interface PlatformAPI {
  // 앱 관리
  loadApp: (appId: string) => Promise<void>
  unloadApp: (appId: string) => Promise<void>
  switchToApp: (appId: string) => Promise<void>

  // 상태 관리
  getAppState: <T = any>(key: string) => T | null
  setAppState: <T = any>(key: string, value: T) => Promise<void>

  // 데이터 저장소
  getData: <T = any>(dataKey: string) => Promise<T | null>
  setData: <T = any>(dataKey: string, data: T) => Promise<void>
  deleteData: (dataKey: string) => Promise<void>

  // 사용자 인터페이스
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  showModal: (content: ReactNode, options?: ModalOptions) => Promise<any>

  // 네트워크
  fetch: (url: string, options?: RequestInit) => Promise<Response>

  // 이벤트 시스템
  emit: (eventName: string, data?: any) => void
  on: (eventName: string, handler: (data?: any) => void) => () => void
  off: (eventName: string, handler: (data?: any) => void) => void
}

export interface ModalOptions {
  title?: string
  width?: string
  height?: string
  closable?: boolean
  centered?: boolean
}

// ===========================================
// 라우팅 타입
// ===========================================

export interface AppRoute {
  path: string
  component: string
  permissions?: string[]
  public?: boolean
  exact?: boolean
}

export interface DynamicRoute {
  appId: string
  routes: AppRoute[]
  basePath: string
  priority: number
}

// ===========================================
// 앱 스토어 타입
// ===========================================

export interface AppSearchFilters {
  category?: string
  minRating?: number
  maxPrice?: number
  isPaid?: boolean
  tags?: string[]
  sortBy?: 'popularity' | 'rating' | 'date' | 'name' | 'price'
  limit?: number
}

export interface AppRating {
  id: string
  app_id: string
  user_id: string
  rating: number
  review_text?: string
  is_verified: boolean
  helpful_count: number
  created_at: string
  user?: {
    display_name: string
    avatar_url?: string
  }
}

export interface AppStats {
  installCount: number
  activeUsers: number
  averageRating: number
  totalReviews: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
}

export interface AppInstallProgress {
  appId: string
  status: 'downloading' | 'installing' | 'configuring' | 'completed' | 'error'
  progress: number // 0-100
  message?: string
  error?: string
}

export interface AppStoreState {
  isOpen: boolean
  currentView: 'home' | 'search' | 'category' | 'app-detail' | 'installed'
  selectedApp: App | null
  searchQuery: string
  searchFilters: AppSearchFilters
  searchResults: App[]
  featuredApps: App[]
  popularApps: App[]
  categories: AppCategory[]
  installingApps: Map<string, AppInstallProgress>
  lastRefresh: Date | null
}

export interface AppCategory {
  id: string
  name: string
  display_name_ko: string
  description?: string
  icon?: string
  app_count: number
  sort_order: number
}

// ===========================================
// 앱 스토어 이벤트 타입
// ===========================================

export interface AppStoreEvents {
  'app-store:opened': {
    timestamp: Date
    view?: string
  }
  'app-store:closed': {
    timestamp: Date
  }
  'app-store:search': {
    timestamp: Date
    query: string
    filters?: AppSearchFilters
    resultCount: number
  }
  'app-store:app-viewed': {
    timestamp: Date
    appId: string
    appName: string
  }
  'app-store:install-started': {
    timestamp: Date
    appId: string
    appName: string
    userId: string
  }
  'app-store:install-completed': {
    timestamp: Date
    appId: string
    appName: string
    userId: string
    installTime: number
  }
  'app-store:install-failed': {
    timestamp: Date
    appId: string
    appName: string
    userId: string
    error: string
  }
  'app-store:uninstall-requested': {
    timestamp: Date
    appId: string
    appName: string
    userId: string
  }
}

// ===========================================
// 에러 바운더리 타입
// ===========================================

export interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorInfo: React.ErrorInfo | null
}

export interface ErrorRecoveryOptions {
  // 자동 복구 시도
  autoRecover: boolean
  maxRetries: number
  retryDelay: number

  // 사용자 액션
  showRetryButton: boolean
  allowReload: boolean
  allowSwitch: boolean

  // 에러 리포팅
  reportError: boolean
  reportDetails: boolean
}

// ===========================================
// 이벤트 타입
// ===========================================

export type PlatformEvent =
  | 'platform:initialized'
  | 'platform:error'
  | 'app:loading'
  | 'app:loaded'
  | 'app:mounted'
  | 'app:unmounted'
  | 'app:error'
  | 'app:switched'
  | 'app:installed'
  | 'app:uninstalled'
  | 'navigation:toggled'
  | 'shell:collapsed'
  | 'user:login'
  | 'user:logout'
  | 'app-store:opened'
  | 'app-store:closed'
  | 'app-store:search'
  | 'app-store:app-viewed'
  | 'app-store:install-started'
  | 'app-store:install-completed'
  | 'app-store:install-failed'
  | 'app-store:uninstall-requested'

export interface PlatformEventData {
  type: PlatformEvent
  timestamp: Date
  appId?: string
  userId?: string
  data?: any
}

// ===========================================
// 설정 타입
// ===========================================

export interface PlatformShellConfig {
  // 성능 설정
  maxConcurrentApps: number
  appLoadTimeout: number
  memoryMonitoringEnabled: boolean

  // UI 설정
  animationsEnabled: boolean
  transitionDuration: number
  compactMode: boolean

  // 디버그 설정
  debugMode: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  performanceLogging: boolean

  // 보안 설정
  sandboxApps: boolean
  allowExternalRequests: boolean
  enforcePermissions: boolean

  // 개발자 모드
  devMode: boolean
  hotReload: boolean
  showDevTools: boolean
}

// ===========================================
// 유틸리티 타입
// ===========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type AppComponent = React.ComponentType<AppProps>

export type AppLoader = () => Promise<{ default: AppComponent }>

export type EventHandler<T = any> = (data: T) => void

export type UnsubscribeFunction = () => void