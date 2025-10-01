// DOT Platform V0.2 - App Lifecycle Management System
// 앱 생명주기 관리 시스템

import React from 'react'
import type {
  LoadedApp,
  AppStatus,
  AppError,
  AppContext,
  AppComponent,
  AppLoader,
  PlatformAPI,
  EventHandler,
  UnsubscribeFunction
} from './types'
import type { App } from '../database/types'
import { platformEventManager } from './shell'

// ===========================================
// 앱 생명주기 관리자
// ===========================================

export class AppLifecycleManager {
  private static instance: AppLifecycleManager
  private loadedApps = new Map<string, LoadedApp>()
  private appModules = new Map<string, React.ComponentType<any>>()
  private cleanupHandlers = new Map<string, (() => void)[]>()
  private performanceMonitor = new PerformanceMonitor()

  static getInstance(): AppLifecycleManager {
    if (!AppLifecycleManager.instance) {
      AppLifecycleManager.instance = new AppLifecycleManager()
    }
    return AppLifecycleManager.instance
  }

  // ===========================================
  // 앱 로딩 및 초기화
  // ===========================================

  async loadApp(app: App, context: AppContext): Promise<LoadedApp> {
    const startTime = performance.now()

    try {
      // 이미 로드된 앱인지 확인
      if (this.loadedApps.has(app.app_id)) {
        const existingApp = this.loadedApps.get(app.app_id)!
        console.log(`[AppLifecycle] 앱이 이미 로드됨: ${app.app_id}`)
        return existingApp
      }

      console.log(`[AppLifecycle] 앱 로딩 시작: ${app.app_id}`)

      // 앱 로딩 이벤트 발생
      platformEventManager.emit('app:loading', {
        timestamp: new Date(),
        appId: app.app_id,
        data: { app, context }
      })

      // 동적 모듈 로드
      const AppComponent = await this.loadAppModule(app)

      // LoadedApp 객체 생성
      const loadedApp: LoadedApp = {
        id: this.generateAppInstanceId(),
        appId: app.app_id,
        manifest: app.manifest,
        status: 'loading',
        component: AppComponent,
        mountedAt: new Date(),
        lastActivityAt: new Date(),
        errorCount: 0,
        context
      }

      // 앱 검증
      await this.validateApp(loadedApp)

      // 앱 초기화
      await this.initializeApp(loadedApp)

      // 메모리 사용량 모니터링 시작
      this.performanceMonitor.startMonitoring(app.app_id)

      // 로드된 앱 목록에 추가
      this.loadedApps.set(app.app_id, loadedApp)

      // 상태 업데이트
      loadedApp.status = 'mounted'

      const loadTime = performance.now() - startTime
      console.log(`[AppLifecycle] 앱 로딩 완료: ${app.app_id} (${loadTime.toFixed(2)}ms)`)

      // 로딩 완료 이벤트
      platformEventManager.emit('app:loaded', {
        timestamp: new Date(),
        appId: app.app_id,
        data: {
          loadedApp,
          loadTime,
          memoryUsage: this.performanceMonitor.getMemoryUsage(app.app_id)
        }
      })

      return loadedApp

    } catch (error) {
      const loadTime = performance.now() - startTime
      const appError: AppError = {
        code: 'APP_LOAD_ERROR',
        message: error instanceof Error ? error.message : '앱 로드 실패',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
        recoverable: true,
        retryCount: 0
      }

      console.error(`[AppLifecycle] 앱 로딩 실패: ${app.app_id} (${loadTime.toFixed(2)}ms)`, error)

      // 에러 이벤트
      platformEventManager.emit('app:error', {
        timestamp: new Date(),
        appId: app.app_id,
        data: { error: appError, loadTime }
      })

      throw appError
    }
  }

  // ===========================================
  // 앱 언로딩
  // ===========================================

  async unloadApp(appId: string): Promise<void> {
    const app = this.loadedApps.get(appId)
    if (!app) {
      console.warn(`[AppLifecycle] 언로드할 앱을 찾을 수 없음: ${appId}`)
      return
    }

    try {
      console.log(`[AppLifecycle] 앱 언로드 시작: ${appId}`)

      // 상태 업데이트
      app.status = 'unmounting'

      // 정리 핸들러 실행
      await this.executeCleanupHandlers(appId)

      // 앱 정리
      await this.cleanupApp(app)

      // 성능 모니터링 중지
      this.performanceMonitor.stopMonitoring(appId)

      // 메모리에서 제거
      this.loadedApps.delete(appId)
      this.appModules.delete(appId)
      this.cleanupHandlers.delete(appId)

      console.log(`[AppLifecycle] 앱 언로드 완료: ${appId}`)

      // 언마운트 완료 이벤트
      platformEventManager.emit('app:unmounted', {
        timestamp: new Date(),
        appId,
        data: { finalMemoryUsage: this.performanceMonitor.getFinalMemoryUsage(appId) }
      })

    } catch (error) {
      console.error(`[AppLifecycle] 앱 언로드 실패: ${appId}`, error)

      // 강제 정리
      this.forceCleanup(appId)
    }
  }

  // ===========================================
  // 앱 상태 관리
  // ===========================================

  updateAppStatus(appId: string, status: AppStatus): void {
    const app = this.loadedApps.get(appId)
    if (!app) return

    const oldStatus = app.status
    app.status = status
    app.lastActivityAt = new Date()

    console.log(`[AppLifecycle] 앱 상태 변경: ${appId} (${oldStatus} → ${status})`)

    // 상태 변경 이벤트
    platformEventManager.emit('app:switched', {
      timestamp: new Date(),
      appId,
      data: { oldStatus, newStatus: status }
    })
  }

  setAppError(appId: string, error: AppError): void {
    const app = this.loadedApps.get(appId)
    if (!app) return

    app.errorCount++
    app.lastError = error
    app.status = 'error'

    console.error(`[AppLifecycle] 앱 에러 설정: ${appId}`, error)
  }

  // ===========================================
  // 리소스 관리
  // ===========================================

  registerCleanupHandler(appId: string, handler: () => void): void {
    if (!this.cleanupHandlers.has(appId)) {
      this.cleanupHandlers.set(appId, [])
    }
    this.cleanupHandlers.get(appId)!.push(handler)
  }

  getApp(appId: string): LoadedApp | undefined {
    return this.loadedApps.get(appId)
  }

  getAllApps(): LoadedApp[] {
    return Array.from(this.loadedApps.values())
  }

  getAppStats(appId: string) {
    return this.performanceMonitor.getStats(appId)
  }

  // ===========================================
  // 내부 메소드들
  // ===========================================

  private async loadAppModule(app: App): Promise<React.ComponentType<any>> {
    // 캐시된 모듈이 있으면 반환
    if (this.appModules.has(app.app_id)) {
      return this.appModules.get(app.app_id)!
    }

    // 동적 임포트로 앱 모듈 로드
    const entryPoint = app.manifest.entry_point || `../../apps/${app.app_id}/index`

    try {
      // 타임아웃 설정 (30초)
      const loadPromise = import(
        /* webpackChunkName: "[request]" */
        entryPoint
      )

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('앱 로드 타임아웃')), 30000)
      )

      const module = await Promise.race([loadPromise, timeoutPromise]) as any
      const AppComponent = module.default || module.App || module

      if (!AppComponent) {
        throw new Error('앱 컴포넌트를 찾을 수 없습니다')
      }

      // 모듈 캐싱
      this.appModules.set(app.app_id, AppComponent)

      return AppComponent

    } catch (error) {
      // 개발 환경에서 mock 컴포넌트 반환
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AppLifecycle] 앱 모듈 로드 실패, Mock 컴포넌트 사용: ${app.app_id}`, error)
        return this.createMockComponent(app)
      }

      throw new Error(`앱 모듈을 로드할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  private createMockComponent(app: App): React.ComponentType<any> {
    return function MockApp({ context }: { context: AppContext }) {
      return React.createElement('div', {
        className: 'h-full flex items-center justify-center p-8'
      }, React.createElement('div', {
        className: 'text-center max-w-md'
      }, [
        React.createElement('div', {
          key: 'icon',
          className: 'w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'
        }, React.createElement('span', {
          className: 'text-2xl text-blue-600'
        }, '📱')),
        React.createElement('h3', {
          key: 'title',
          className: 'text-lg font-semibold text-gray-900 mb-2'
        }, app.display_name_ko || app.name),
        React.createElement('p', {
          key: 'description',
          className: 'text-gray-600 mb-4'
        }, app.description_ko || app.description || '앱이 개발 중입니다.'),
        React.createElement('div', {
          key: 'meta',
          className: 'text-sm text-gray-500 space-y-1'
        }, [
          React.createElement('div', { key: 'version' }, `버전: ${app.version}`),
          React.createElement('div', { key: 'id' }, `앱 ID: ${app.app_id}`),
          React.createElement('div', { key: 'context' }, `사용자 ID: ${context.userId || 'Guest'}`)
        ])
      ]))
    }
  }

  private async validateApp(app: LoadedApp): Promise<void> {
    // 컴포넌트 유효성 검사
    if (!app.component || typeof app.component !== 'function') {
      throw new Error('유효하지 않은 앱 컴포넌트')
    }

    // 매니페스트 검증
    if (!app.manifest) {
      throw new Error('앱 매니페스트가 없습니다')
    }

    // 권한 검증
    const requiredPermissions = app.manifest.permissions || []
    const grantedPermissions = app.context.permissions || []

    for (const permission of requiredPermissions) {
      if (!grantedPermissions.includes(permission)) {
        throw new Error(`필요한 권한이 없습니다: ${permission}`)
      }
    }

    // 리소스 제한 검증
    const memoryUsage = this.performanceMonitor.getMemoryUsage(app.appId)
    if (memoryUsage > app.context.memoryLimit) {
      throw new Error(`메모리 사용량 초과: ${memoryUsage}MB > ${app.context.memoryLimit}MB`)
    }
  }

  private async initializeApp(app: LoadedApp): Promise<void> {
    // 앱별 초기화 로직
    try {
      // 앱 컨텍스트 설정
      if (app.component && 'initialize' in app.component) {
        await (app.component as any).initialize?.(app.context)
      }

      // 앱별 이벤트 리스너 등록
      this.registerAppEventListeners(app)

      // 초기화 완료
      app.status = 'mounted'

    } catch (error) {
      throw new Error(`앱 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  private registerAppEventListeners(app: LoadedApp): void {
    // 앱별 이벤트 리스너 등록
    const unsubscribe = platformEventManager.on('platform:error', (data) => {
      if (data.appId === app.appId) {
        // 앱별 에러 처리
        console.error(`[AppLifecycle] 앱 에러 수신: ${app.appId}`, data)
      }
    })

    // 정리 핸들러로 등록
    this.registerCleanupHandler(app.appId, unsubscribe)
  }

  private async executeCleanupHandlers(appId: string): Promise<void> {
    const handlers = this.cleanupHandlers.get(appId) || []

    for (const handler of handlers) {
      try {
        await Promise.resolve(handler())
      } catch (error) {
        console.error(`[AppLifecycle] 정리 핸들러 실행 실패: ${appId}`, error)
      }
    }
  }

  private async cleanupApp(app: LoadedApp): Promise<void> {
    try {
      // 앱별 정리 로직 실행
      if (app.component && 'cleanup' in app.component) {
        await (app.component as any).cleanup?.()
      }

      // 상태 정리
      app.status = 'unmounted'

    } catch (error) {
      console.error(`[AppLifecycle] 앱 정리 실패: ${app.appId}`, error)
    }
  }

  private forceCleanup(appId: string): void {
    console.warn(`[AppLifecycle] 강제 정리 실행: ${appId}`)

    this.loadedApps.delete(appId)
    this.appModules.delete(appId)
    this.cleanupHandlers.delete(appId)
    this.performanceMonitor.forceCleanup(appId)
  }

  private generateAppInstanceId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ===========================================
// 성능 모니터링
// ===========================================

class PerformanceMonitor {
  private memoryUsage = new Map<string, number>()
  private startTimes = new Map<string, number>()
  private stats = new Map<string, any>()

  startMonitoring(appId: string): void {
    this.startTimes.set(appId, performance.now())
    this.updateMemoryUsage(appId)
  }

  stopMonitoring(appId: string): void {
    const startTime = this.startTimes.get(appId)
    if (startTime) {
      const duration = performance.now() - startTime
      this.stats.set(appId, {
        duration,
        finalMemoryUsage: this.getMemoryUsage(appId)
      })
    }

    this.startTimes.delete(appId)
    this.memoryUsage.delete(appId)
  }

  getMemoryUsage(appId: string): number {
    // 실제 구현에서는 더 정확한 메모리 측정
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory
      return memory.usedJSHeapSize / 1024 / 1024 // MB로 변환
    }
    return this.memoryUsage.get(appId) || 0
  }

  getFinalMemoryUsage(appId: string): number {
    return this.stats.get(appId)?.finalMemoryUsage || 0
  }

  getStats(appId: string) {
    return {
      memoryUsage: this.getMemoryUsage(appId),
      isMonitoring: this.startTimes.has(appId),
      ...this.stats.get(appId)
    }
  }

  forceCleanup(appId: string): void {
    this.startTimes.delete(appId)
    this.memoryUsage.delete(appId)
    this.stats.delete(appId)
  }

  private updateMemoryUsage(appId: string): void {
    const usage = this.getMemoryUsage(appId)
    this.memoryUsage.set(appId, usage)

    // 주기적 업데이트 (5초마다)
    setTimeout(() => {
      if (this.startTimes.has(appId)) {
        this.updateMemoryUsage(appId)
      }
    }, 5000)
  }
}

// ===========================================
// 싱글톤 인스턴스 내보내기
// ===========================================

export const appLifecycleManager = AppLifecycleManager.getInstance()

// ===========================================
// 유틸리티 함수들
// ===========================================

export function createAppContext(app: App, userId?: string): AppContext {
  return {
    platformVersion: '0.2.0',
    userId,
    sessionId: generateSessionId(),
    permissions: [], // 실제 구현에서는 사용자별 권한 로드
    memoryLimit: app.max_memory_mb,
    storageLimit: app.max_storage_mb,
    networkAllowed: app.requires_network,
    apiBaseUrl: '/api',
    apiToken: undefined // 실제 구현에서는 JWT 토큰
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// React Hook for App Lifecycle
export function useAppLifecycle() {
  const manager = React.useMemo(() => appLifecycleManager, [])

  const loadApp = React.useCallback(async (app: App, context: AppContext) => {
    return manager.loadApp(app, context)
  }, [manager])

  const unloadApp = React.useCallback(async (appId: string) => {
    return manager.unloadApp(appId)
  }, [manager])

  const getApp = React.useCallback((appId: string) => {
    return manager.getApp(appId)
  }, [manager])

  const getAllApps = React.useCallback(() => {
    return manager.getAllApps()
  }, [manager])

  return {
    loadApp,
    unloadApp,
    getApp,
    getAllApps,
    updateAppStatus: manager.updateAppStatus.bind(manager),
    setAppError: manager.setAppError.bind(manager),
    registerCleanupHandler: manager.registerCleanupHandler.bind(manager),
    getAppStats: manager.getAppStats.bind(manager)
  }
}