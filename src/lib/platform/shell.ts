// DOT Platform V0.2 - Platform Shell State Management
// Zustand 기반 플랫폼 셸 상태 관리 시스템

import React from 'react'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type {
  PlatformShellState,
  LoadedApp,
  AppStatus,
  AppError,
  AppContext,
  PlatformAPI,
  PlatformEvent,
  PlatformEventData,
  EventHandler,
  UnsubscribeFunction,
  PlatformShellConfig
} from './types'
import type { App, UserApp } from '../database/types'

// ===========================================
// 플랫폼 셸 스토어 인터페이스
// ===========================================

interface PlatformShellStore extends PlatformShellState {
  // 초기화
  initialize: () => Promise<void>
  reset: () => void

  // 앱 관리
  loadApp: (appId: string) => Promise<void>
  unloadApp: (appId: string) => Promise<void>
  switchToApp: (appId: string) => Promise<void>
  reloadApp: (appId: string) => Promise<void>

  // 앱 상태 관리
  updateAppStatus: (appId: string, status: AppStatus) => void
  setAppError: (appId: string, error: AppError) => void
  clearAppError: (appId: string) => void

  // UI 상태 관리
  toggleNavigation: () => void
  toggleShellCollapse: () => void
  setNavigationOpen: (open: boolean) => void

  // 데이터 관리
  setAvailableApps: (apps: App[]) => void
  setInstalledApps: (apps: UserApp[]) => void
  refreshApps: () => Promise<void>

  // 앱 스토어 관리
  openAppStore: () => void
  closeAppStore: () => void
  installAppFromStore: (appId: string) => Promise<void>
  uninstallAppFromStore: (appId: string) => Promise<void>

  // 에러 관리
  setShellError: (error: string | null) => void
  clearAllErrors: () => void
}

// ===========================================
// 기본 설정
// ===========================================

const defaultConfig: PlatformShellConfig = {
  maxConcurrentApps: 5,
  appLoadTimeout: 30000,
  memoryMonitoringEnabled: true,
  animationsEnabled: true,
  transitionDuration: 300,
  compactMode: false,
  debugMode: process.env.NODE_ENV === 'development',
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  performanceLogging: process.env.NODE_ENV === 'development',
  sandboxApps: true,
  allowExternalRequests: true,
  enforcePermissions: true,
  devMode: process.env.NODE_ENV === 'development',
  hotReload: process.env.NODE_ENV === 'development',
  showDevTools: process.env.NODE_ENV === 'development'
}

// ===========================================
// 플랫폼 셸 스토어
// ===========================================

export const usePlatformShell = create<PlatformShellStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // 초기 상태
        isInitialized: false,
        currentApp: null,
        loadedApps: new Map(),
        availableApps: [],
        installedApps: [],
        navigationOpen: false,
        shellCollapsed: false,
        isLoadingApps: false,
        isLoadingApp: false,
        shellError: null,
        appErrors: new Map(),

        // 앱 스토어 상태
        appStoreOpen: false,
        installingApps: new Map(),

        // 초기화
        initialize: async () => {
          try {
            set({ isLoadingApps: true, shellError: null })

            // 앱 데이터 로드
            await get().refreshApps()

            // 이벤트 시스템 초기화
            platformEventManager.emit('platform:initialized', {
              timestamp: new Date(),
              userId: getCurrentUserId()
            })

            set({ isInitialized: true })

            if (defaultConfig.debugMode) {
              console.log('[Platform Shell] 초기화 완료')
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
            set({ shellError: errorMessage })

            platformEventManager.emit('platform:error', {
              timestamp: new Date(),
              data: { error: errorMessage }
            })

            console.error('[Platform Shell] 초기화 실패:', error)
          } finally {
            set({ isLoadingApps: false })
          }
        },

        reset: () => {
          // 모든 앱 언마운트
          const { loadedApps } = get()
          loadedApps.forEach((app) => {
            if (app.status === 'mounted' || app.status === 'active') {
              get().unloadApp(app.appId)
            }
          })

          set({
            isInitialized: false,
            currentApp: null,
            loadedApps: new Map(),
            availableApps: [],
            installedApps: [],
            navigationOpen: false,
            shellCollapsed: false,
            isLoadingApps: false,
            isLoadingApp: false,
            shellError: null,
            appErrors: new Map()
          })
        },

        // 앱 관리
        loadApp: async (appId: string) => {
          try {
            set({ isLoadingApp: true })

            const { availableApps, loadedApps } = get()

            // 이미 로드된 앱인지 확인
            if (loadedApps.has(appId)) {
              await get().switchToApp(appId)
              return
            }

            // 앱 메타데이터 찾기
            const appMeta = availableApps.find(app => app.app_id === appId)
            if (!appMeta) {
              throw new Error(`앱을 찾을 수 없습니다: ${appId}`)
            }

            // 동시 실행 앱 수 제한 확인
            const activeAppsCount = Array.from(loadedApps.values())
              .filter(app => app.status === 'active' || app.status === 'mounted').length

            if (activeAppsCount >= defaultConfig.maxConcurrentApps) {
              throw new Error(`최대 ${defaultConfig.maxConcurrentApps}개의 앱만 동시에 실행할 수 있습니다`)
            }

            platformEventManager.emit('app:loading', {
              timestamp: new Date(),
              appId,
              data: { appMeta }
            })

            // 앱 컨텍스트 생성
            const context: AppContext = createAppContext(appMeta)

            // 동적 앱 로드
            const appComponent = await loadAppComponent(appMeta)

            const loadedApp: LoadedApp = {
              id: generateAppInstanceId(),
              appId,
              manifest: appMeta.manifest,
              status: 'loading',
              component: appComponent,
              mountedAt: new Date(),
              lastActivityAt: new Date(),
              errorCount: 0,
              context
            }

            // 스토어에 추가
            const newLoadedApps = new Map(loadedApps)
            newLoadedApps.set(appId, loadedApp)
            set({ loadedApps: newLoadedApps })

            // 앱 마운트
            await mountApp(loadedApp)

            // 상태 업데이트
            get().updateAppStatus(appId, 'mounted')

            platformEventManager.emit('app:loaded', {
              timestamp: new Date(),
              appId,
              data: { loadedApp }
            })

            if (defaultConfig.debugMode) {
              console.log(`[Platform Shell] 앱 로드 완료: ${appId}`)
            }
          } catch (error) {
            const appError: AppError = {
              code: 'APP_LOAD_ERROR',
              message: error instanceof Error ? error.message : '앱 로드 실패',
              timestamp: new Date(),
              recoverable: true,
              retryCount: 0
            }

            get().setAppError(appId, appError)

            platformEventManager.emit('app:error', {
              timestamp: new Date(),
              appId,
              data: { error: appError }
            })

            throw error
          } finally {
            set({ isLoadingApp: false })
          }
        },

        unloadApp: async (appId: string) => {
          try {
            const { loadedApps, currentApp } = get()
            const app = loadedApps.get(appId)

            if (!app) {
              return
            }

            get().updateAppStatus(appId, 'unmounting')

            // 앱 언마운트
            await unmountApp(app)

            // 현재 앱이면 null로 설정
            if (currentApp?.appId === appId) {
              set({ currentApp: null })
            }

            // 스토어에서 제거
            const newLoadedApps = new Map(loadedApps)
            newLoadedApps.delete(appId)
            set({ loadedApps: newLoadedApps })

            // 에러도 제거
            get().clearAppError(appId)

            platformEventManager.emit('app:unmounted', {
              timestamp: new Date(),
              appId
            })

            if (defaultConfig.debugMode) {
              console.log(`[Platform Shell] 앱 언로드 완료: ${appId}`)
            }
          } catch (error) {
            console.error(`[Platform Shell] 앱 언로드 실패: ${appId}`, error)
          }
        },

        switchToApp: async (appId: string) => {
          try {
            const { loadedApps, currentApp } = get()
            const app = loadedApps.get(appId)

            if (!app) {
              await get().loadApp(appId)
              return
            }

            // 현재 앱을 비활성 상태로
            if (currentApp && currentApp.appId !== appId) {
              get().updateAppStatus(currentApp.appId, 'inactive')
            }

            // 새 앱을 활성 상태로
            get().updateAppStatus(appId, 'active')

            // 마지막 활동 시간 업데이트
            const updatedApp = { ...app, lastActivityAt: new Date() }
            const newLoadedApps = new Map(loadedApps)
            newLoadedApps.set(appId, updatedApp)

            set({
              currentApp: updatedApp,
              loadedApps: newLoadedApps
            })

            platformEventManager.emit('app:switched', {
              timestamp: new Date(),
              appId,
              data: {
                previousApp: currentApp?.appId,
                currentApp: appId
              }
            })

            if (defaultConfig.debugMode) {
              console.log(`[Platform Shell] 앱 전환 완료: ${appId}`)
            }
          } catch (error) {
            console.error(`[Platform Shell] 앱 전환 실패: ${appId}`, error)
          }
        },

        reloadApp: async (appId: string) => {
          await get().unloadApp(appId)
          await get().loadApp(appId)
        },

        // 앱 상태 관리
        updateAppStatus: (appId: string, status: AppStatus) => {
          const { loadedApps } = get()
          const app = loadedApps.get(appId)

          if (app) {
            const updatedApp = { ...app, status }
            const newLoadedApps = new Map(loadedApps)
            newLoadedApps.set(appId, updatedApp)
            set({ loadedApps: newLoadedApps })

            // 현재 앱 상태도 업데이트
            const { currentApp } = get()
            if (currentApp && currentApp.appId === appId) {
              set({ currentApp: updatedApp })
            }
          }
        },

        setAppError: (appId: string, error: AppError) => {
          const { appErrors, loadedApps } = get()
          const newAppErrors = new Map(appErrors)
          newAppErrors.set(appId, error)

          // 앱 상태도 에러로 변경
          get().updateAppStatus(appId, 'error')

          // 에러 카운트 증가
          const app = loadedApps.get(appId)
          if (app) {
            const updatedApp = {
              ...app,
              errorCount: app.errorCount + 1,
              lastError: error
            }
            const newLoadedApps = new Map(loadedApps)
            newLoadedApps.set(appId, updatedApp)
            set({ loadedApps: newLoadedApps })
          }

          set({ appErrors: newAppErrors })
        },

        clearAppError: (appId: string) => {
          const { appErrors } = get()
          const newAppErrors = new Map(appErrors)
          newAppErrors.delete(appId)
          set({ appErrors: newAppErrors })
        },

        // UI 상태 관리
        toggleNavigation: () => {
          const { navigationOpen } = get()
          set({ navigationOpen: !navigationOpen })

          platformEventManager.emit('navigation:toggled', {
            timestamp: new Date(),
            data: { open: !navigationOpen }
          })
        },

        toggleShellCollapse: () => {
          const { shellCollapsed } = get()
          set({ shellCollapsed: !shellCollapsed })

          platformEventManager.emit('shell:collapsed', {
            timestamp: new Date(),
            data: { collapsed: !shellCollapsed }
          })
        },

        setNavigationOpen: (open: boolean) => {
          set({ navigationOpen: open })
        },

        // 데이터 관리
        setAvailableApps: (apps: App[]) => {
          set({ availableApps: apps })
        },

        setInstalledApps: (apps: UserApp[]) => {
          set({ installedApps: apps })
        },

        refreshApps: async () => {
          try {
            set({ isLoadingApps: true })

            // 실제 구현에서는 API 호출
            // const availableApps = await fetchAvailableApps()
            // const installedApps = await fetchInstalledApps()

            // 임시 mock 데이터
            const mockAvailableApps: App[] = []
            const mockInstalledApps: UserApp[] = []

            set({
              availableApps: mockAvailableApps,
              installedApps: mockInstalledApps
            })
          } catch (error) {
            console.error('[Platform Shell] 앱 데이터 새로고침 실패:', error)
            get().setShellError('앱 데이터를 불러올 수 없습니다')
          } finally {
            set({ isLoadingApps: false })
          }
        },

        // 에러 관리
        setShellError: (error: string | null) => {
          set({ shellError: error })
        },

        clearAllErrors: () => {
          set({ shellError: null, appErrors: new Map() })
        },

        // 앱 스토어 관리
        openAppStore: () => {
          set({ appStoreOpen: true })

          platformEventManager.emit('app-store:opened', {
            timestamp: new Date(),
            view: 'home'
          })
        },

        closeAppStore: () => {
          set({ appStoreOpen: false })

          platformEventManager.emit('app-store:closed', {
            timestamp: new Date()
          })
        },

        installAppFromStore: async (appId: string) => {
          const userId = getCurrentUserId()
          if (!userId) {
            throw new Error('사용자 로그인이 필요합니다')
          }

          try {
            // 설치 진행 상태 설정
            const { installingApps } = get()
            const newInstallingApps = new Map(installingApps)
            newInstallingApps.set(appId, {
              appId,
              status: 'downloading',
              progress: 0,
              message: '앱 다운로드 중...'
            })
            set({ installingApps: newInstallingApps })

            // 앱 정보 가져오기
            const appRegistryService = await import('./app-registry').then(m => m.appRegistryService)
            const app = await appRegistryService.getApp(appId)
            if (!app) {
              throw new Error('앱을 찾을 수 없습니다')
            }

            platformEventManager.emit('app-store:install-started', {
              timestamp: new Date(),
              appId,
              appName: app.name,
              userId
            })

            // 설치 진행률 업데이트 (시뮬레이션)
            const updateProgress = (status: any, progress: number, message: string) => {
              const current = get().installingApps
              const updated = new Map(current)
              updated.set(appId, { appId, status, progress, message })
              set({ installingApps: updated })
            }

            updateProgress('downloading', 30, '앱 다운로드 중...')
            await new Promise(resolve => setTimeout(resolve, 1000))

            updateProgress('installing', 60, '앱 설치 중...')
            await new Promise(resolve => setTimeout(resolve, 1500))

            updateProgress('configuring', 90, '앱 구성 중...')
            await new Promise(resolve => setTimeout(resolve, 500))

            // 실제 앱 설치
            const userApp = await appRegistryService.installApp(appId, userId)

            // 설치된 앱 목록 업데이트
            const { installedApps } = get()
            set({ installedApps: [...installedApps, userApp] })

            // 설치 완료 상태로 변경
            updateProgress('completed', 100, '설치 완료')

            // 짧은 시간 후 설치 진행 상태 제거
            setTimeout(() => {
              const current = get().installingApps
              const updated = new Map(current)
              updated.delete(appId)
              set({ installingApps: updated })
            }, 2000)

            platformEventManager.emit('app-store:install-completed', {
              timestamp: new Date(),
              appId,
              appName: app.name,
              userId,
              installTime: 3000
            })

          } catch (error) {
            // 설치 실패 처리
            const { installingApps } = get()
            const newInstallingApps = new Map(installingApps)
            newInstallingApps.set(appId, {
              appId,
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : '알 수 없는 오류'
            })
            set({ installingApps: newInstallingApps })

            platformEventManager.emit('app-store:install-failed', {
              timestamp: new Date(),
              appId,
              appName: appId, // fallback
              userId: userId || '',
              error: error instanceof Error ? error.message : '알 수 없는 오류'
            })

            // 실패 상태도 짧은 시간 후 제거
            setTimeout(() => {
              const current = get().installingApps
              const updated = new Map(current)
              updated.delete(appId)
              set({ installingApps: updated })
            }, 3000)

            throw error
          }
        },

        uninstallAppFromStore: async (appId: string) => {
          const userId = getCurrentUserId()
          if (!userId) {
            throw new Error('사용자 로그인이 필요합니다')
          }

          try {
            const appRegistryService = await import('./app-registry').then(m => m.appRegistryService)
            const app = await appRegistryService.getApp(appId)

            platformEventManager.emit('app-store:uninstall-requested', {
              timestamp: new Date(),
              appId,
              appName: app?.name || appId,
              userId
            })

            // 앱 제거
            await appRegistryService.uninstallApp(appId, userId)

            // 설치된 앱 목록에서 제거
            const { installedApps } = get()
            const updatedApps = installedApps.filter(app => app.app_id !== appId)
            set({ installedApps: updatedApps })

            // 로드된 앱이 있다면 언로드
            await get().unloadApp(appId)

          } catch (error) {
            console.error(`앱 제거 실패: ${appId}`, error)
            throw error
          }
        }
      })),
      {
        name: 'platform-shell-store',
        partialize: (state) => ({
          // 지속할 상태만 선택
          navigationOpen: state.navigationOpen,
          shellCollapsed: state.shellCollapsed
        })
      }
    ),
    { name: 'platform-shell' }
  )
)

// ===========================================
// 이벤트 관리자
// ===========================================

class PlatformEventManager {
  private listeners = new Map<PlatformEvent, Set<EventHandler>>()

  emit(event: PlatformEvent, data: Omit<PlatformEventData, 'type'>): void {
    const eventData: PlatformEventData = { type: event, ...data }
    const eventListeners = this.listeners.get(event)

    if (eventListeners) {
      eventListeners.forEach(handler => {
        try {
          handler(eventData)
        } catch (error) {
          console.error(`[Event Manager] 이벤트 핸들러 실행 실패: ${event}`, error)
        }
      })
    }

    if (defaultConfig.debugMode) {
      console.log(`[Event Manager] 이벤트 발생: ${event}`, eventData)
    }
  }

  on(event: PlatformEvent, handler: EventHandler): UnsubscribeFunction {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(handler)

    return () => {
      this.listeners.get(event)?.delete(handler)
    }
  }

  off(event: PlatformEvent, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler)
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const platformEventManager = new PlatformEventManager()

// ===========================================
// 유틸리티 함수들
// ===========================================

function createAppContext(app: App): AppContext {
  return {
    platformVersion: '0.2.0',
    userId: getCurrentUserId(),
    sessionId: generateSessionId(),
    permissions: [], // 실제 구현에서는 앱 권한 로드
    memoryLimit: app.max_memory_mb,
    storageLimit: app.max_storage_mb,
    networkAllowed: app.requires_network,
    apiBaseUrl: '/api',
    apiToken: undefined // 인증된 사용자의 토큰
  }
}

async function loadAppComponent(app: App): Promise<React.ComponentType<any>> {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('앱 로드 타임아웃')), defaultConfig.appLoadTimeout)
  )

  const loadPromise = import(
    /* webpackChunkName: "app-[request]" */
    `../../apps/${app.app_id}/index`
  ).then(module => module.default)

  return Promise.race([loadPromise, timeout]) as Promise<React.ComponentType<any>>
}

async function mountApp(app: LoadedApp): Promise<void> {
  // 앱 마운트 로직
  if (app.component && typeof app.component === 'function') {
    // React 컴포넌트 검증
    try {
      // 컴포넌트 렌더링 가능한지 확인
      const TestComponent = app.component
      const testElement = React.createElement(TestComponent, {
        context: app.context,
        platformApi: createPlatformAPI(app.appId)
      })

      if (!testElement) {
        throw new Error('앱 컴포넌트가 올바르지 않습니다')
      }
    } catch (error) {
      throw new Error(`앱 마운트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }
}

async function unmountApp(app: LoadedApp): Promise<void> {
  // 앱 언마운트 로직 - 리소스 정리
  try {
    // 메모리 정리, 이벤트 리스너 제거 등
    if (defaultConfig.performanceLogging) {
      console.log(`[Platform Shell] 앱 메모리 사용량 정리: ${app.appId}`)
    }
  } catch (error) {
    console.warn(`[Platform Shell] 앱 정리 중 오류 발생: ${app.appId}`, error)
  }
}

function createPlatformAPI(appId: string): PlatformAPI {
  return {
    loadApp: usePlatformShell.getState().loadApp,
    unloadApp: usePlatformShell.getState().unloadApp,
    switchToApp: usePlatformShell.getState().switchToApp,
    getAppState: <T = any>(key: string) => null as T | null,
    setAppState: async <T = any>(key: string, value: T) => {},
    getData: async <T = any>(dataKey: string) => null as T | null,
    setData: async <T = any>(dataKey: string, data: T) => {},
    deleteData: async (dataKey: string) => {},
    showNotification: (message: string, type = 'info' as const) => {
      console.log(`[Notification] ${type}: ${message}`)
    },
    showModal: async (content, options) => null,
    fetch: async (url: string, options?: RequestInit) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'X-App-ID': appId
        }
      })
    },
    emit: (eventName: string, data?: any) => platformEventManager.emit(eventName as PlatformEvent, data),
    on: (eventName: string, handler: (data?: any) => void) => platformEventManager.on(eventName as PlatformEvent, handler as EventHandler),
    off: (eventName: string, handler: (data?: any) => void) => platformEventManager.off(eventName as PlatformEvent, handler as EventHandler)
  }
}

function getCurrentUserId(): string | undefined {
  // 실제 구현에서는 Supabase Auth에서 사용자 ID 가져오기
  return undefined
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateAppInstanceId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}