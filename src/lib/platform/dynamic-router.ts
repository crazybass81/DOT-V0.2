// DOT Platform V0.2 - Dynamic Routing System
// 동적 라우팅 생성/제거 시스템

import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import type { DynamicRoute, AppRoute, LoadedApp } from './types'
import type { App } from '../database/types'
import { platformEventManager } from './shell'

// ===========================================
// 동적 라우터 관리자
// ===========================================

export class DynamicRouterManager {
  private static instance: DynamicRouterManager
  private routes = new Map<string, DynamicRoute>()
  private pathMatcher = new RoutePathMatcher()
  private routeHistory = new Set<string>()

  static getInstance(): DynamicRouterManager {
    if (!DynamicRouterManager.instance) {
      DynamicRouterManager.instance = new DynamicRouterManager()
    }
    return DynamicRouterManager.instance
  }

  // ===========================================
  // 라우트 등록 및 제거
  // ===========================================

  registerAppRoutes(app: App, loadedApp: LoadedApp): void {
    try {
      const appRoutes = app.manifest.routes || []
      const basePath = this.generateBasePath(app.app_id)

      const dynamicRoute: DynamicRoute = {
        appId: app.app_id,
        routes: appRoutes,
        basePath,
        priority: this.calculatePriority(app)
      }

      // 기존 라우트가 있다면 제거
      if (this.routes.has(app.app_id)) {
        this.unregisterAppRoutes(app.app_id)
      }

      // 라우트 등록
      this.routes.set(app.app_id, dynamicRoute)

      // 경로 매처에 등록
      for (const route of appRoutes) {
        const fullPath = this.joinPath(basePath, route.path)
        this.pathMatcher.addRoute(fullPath, {
          appId: app.app_id,
          route,
          component: route.component,
          permissions: route.permissions || [],
          public: route.public || false
        })
        this.routeHistory.add(fullPath)
      }

      console.log(`[DynamicRouter] 앱 라우트 등록: ${app.app_id} (${appRoutes.length}개 경로)`)

      // 라우트 등록 이벤트
      platformEventManager.emit('app:loaded', {
        timestamp: new Date(),
        appId: app.app_id,
        data: {
          routesRegistered: appRoutes.length,
          basePath,
          routes: appRoutes.map(r => this.joinPath(basePath, r.path))
        }
      })

    } catch (error) {
      console.error(`[DynamicRouter] 라우트 등록 실패: ${app.app_id}`, error)
      throw new Error(`라우트 등록 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  unregisterAppRoutes(appId: string): void {
    try {
      const dynamicRoute = this.routes.get(appId)
      if (!dynamicRoute) {
        console.warn(`[DynamicRouter] 제거할 라우트를 찾을 수 없음: ${appId}`)
        return
      }

      // 경로 매처에서 제거
      for (const route of dynamicRoute.routes) {
        const fullPath = this.joinPath(dynamicRoute.basePath, route.path)
        this.pathMatcher.removeRoute(fullPath)
        this.routeHistory.delete(fullPath)
      }

      // 라우트 맵에서 제거
      this.routes.delete(appId)

      console.log(`[DynamicRouter] 앱 라우트 제거: ${appId} (${dynamicRoute.routes.length}개 경로)`)

      // 라우트 제거 이벤트
      platformEventManager.emit('app:unmounted', {
        timestamp: new Date(),
        appId,
        data: {
          routesUnregistered: dynamicRoute.routes.length,
          basePath: dynamicRoute.basePath
        }
      })

    } catch (error) {
      console.error(`[DynamicRouter] 라우트 제거 실패: ${appId}`, error)
    }
  }

  // ===========================================
  // 라우트 매칭 및 처리
  // ===========================================

  matchRoute(pathname: string): RouteMatch | null {
    try {
      // 플랫폼 기본 경로들 처리
      if (this.isSystemRoute(pathname)) {
        return this.handleSystemRoute(pathname)
      }

      // 앱 라우트 매칭
      const match = this.pathMatcher.match(pathname)
      if (match) {
        return {
          ...match,
          fullPath: pathname,
          params: this.extractParams(pathname, match.pattern),
          query: this.extractQuery(pathname)
        }
      }

      return null

    } catch (error) {
      console.error(`[DynamicRouter] 라우트 매칭 실패: ${pathname}`, error)
      return null
    }
  }

  async handleRequest(request: NextRequest): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname
    const match = this.matchRoute(pathname)

    if (!match) {
      return null // 라우트가 매칭되지 않음
    }

    try {
      // 권한 검사
      if (!await this.checkPermissions(match, request)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // 앱 라우트 처리
      if (match.appId) {
        return this.handleAppRoute(match, request)
      }

      // 시스템 라우트 처리
      return this.handleSystemRouteRequest(match, request)

    } catch (error) {
      console.error(`[DynamicRouter] 요청 처리 실패: ${pathname}`, error)
      return NextResponse.redirect(new URL('/error', request.url))
    }
  }

  // ===========================================
  // 라우트 정보 조회
  // ===========================================

  getAppRoutes(appId: string): DynamicRoute | undefined {
    return this.routes.get(appId)
  }

  getAllRoutes(): DynamicRoute[] {
    return Array.from(this.routes.values())
  }

  getRouteHistory(): string[] {
    return Array.from(this.routeHistory)
  }

  generateAppUrl(appId: string, path = '/'): string {
    const dynamicRoute = this.routes.get(appId)
    if (!dynamicRoute) {
      return `/apps/${appId}`
    }

    return this.joinPath(dynamicRoute.basePath, path)
  }

  // ===========================================
  // 내부 메소드들
  // ===========================================

  private generateBasePath(appId: string): string {
    return `/apps/${appId}`
  }

  private calculatePriority(app: App): number {
    // 우선순위 계산 로직
    let priority = 100

    // 시스템 앱은 높은 우선순위
    if (app.category === 'system') {
      priority += 50
    }

    // 인기 앱은 약간 높은 우선순위
    if (app.install_count > 1000) {
      priority += 10
    }

    // 평점이 높은 앱은 약간 높은 우선순위
    if (app.average_rating > 4.0) {
      priority += 5
    }

    return priority
  }

  private joinPath(...paths: string[]): string {
    return '/' + paths
      .map(path => path.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/')
  }

  private isSystemRoute(pathname: string): boolean {
    const systemRoutes = [
      '/',
      '/home',
      '/settings',
      '/profile',
      '/login',
      '/logout',
      '/unauthorized',
      '/error'
    ]

    return systemRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )
  }

  private handleSystemRoute(pathname: string): RouteMatch {
    return {
      appId: 'system',
      route: {
        path: pathname,
        component: 'SystemComponent',
        public: pathname === '/login'
      },
      pattern: pathname,
      fullPath: pathname,
      params: {},
      query: {},
      component: 'SystemComponent',
      permissions: [],
      public: pathname === '/login'
    }
  }

  private extractParams(pathname: string, pattern: string): Record<string, string> {
    const params: Record<string, string> = {}

    // 간단한 파라미터 추출 로직
    const patternParts = pattern.split('/')
    const pathParts = pathname.split('/')

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      if (patternPart?.startsWith(':') && pathPart) {
        const paramName = patternPart.substring(1)
        params[paramName] = decodeURIComponent(pathPart)
      }
    }

    return params
  }

  private extractQuery(pathname: string): Record<string, string> {
    const query: Record<string, string> = {}
    const queryString = pathname.split('?')[1]

    if (queryString) {
      const params = new URLSearchParams(queryString)
      params.forEach((value, key) => {
        query[key] = value
      })
    }

    return query
  }

  private async checkPermissions(match: RouteMatch, request: NextRequest): Promise<boolean> {
    // 공개 라우트는 권한 검사 생략
    if (match.public) {
      return true
    }

    // 권한이 없는 라우트는 통과
    if (!match.permissions?.length) {
      return true
    }

    try {
      // 실제 구현에서는 JWT 토큰이나 세션을 통해 사용자 권한 확인
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return false
      }

      // 간단한 권한 검사 로직 (실제로는 더 복잡함)
      const userPermissions = await this.getUserPermissions(authHeader)
      return match.permissions.every(permission =>
        userPermissions.includes(permission)
      )

    } catch (error) {
      console.error(`[DynamicRouter] 권한 검사 실패:`, error)
      return false
    }
  }

  private async getUserPermissions(authHeader: string): Promise<string[]> {
    // 실제 구현에서는 JWT 디코딩 또는 데이터베이스 조회
    // 지금은 mock 데이터 반환
    return ['read:profile', 'write:profile', 'read:data']
  }

  private handleAppRoute(match: RouteMatch, request: NextRequest): NextResponse {
    // 앱 라우트 처리 로직
    // 실제 구현에서는 앱 컴포넌트로 리다이렉트하거나 SSR 처리

    const appUrl = new URL(request.url)
    appUrl.searchParams.set('app', match.appId)
    appUrl.searchParams.set('component', match.component)
    appUrl.pathname = '/'

    return NextResponse.rewrite(appUrl)
  }

  private handleSystemRouteRequest(match: RouteMatch, request: NextRequest): NextResponse {
    // 시스템 라우트 처리 로직
    return NextResponse.next()
  }
}

// ===========================================
// 라우트 경로 매처
// ===========================================

class RoutePathMatcher {
  private exactRoutes = new Map<string, RouteInfo>()
  private paramRoutes: Array<{ pattern: RegExp, template: string, info: RouteInfo }> = []

  addRoute(path: string, info: RouteInfo): void {
    if (this.hasParams(path)) {
      // 파라미터가 있는 경로
      const pattern = this.pathToRegex(path)
      this.paramRoutes.push({ pattern, template: path, info })
    } else {
      // 정확한 경로
      this.exactRoutes.set(path, info)
    }
  }

  removeRoute(path: string): void {
    if (this.hasParams(path)) {
      this.paramRoutes = this.paramRoutes.filter(route => route.template !== path)
    } else {
      this.exactRoutes.delete(path)
    }
  }

  match(pathname: string): RouteInfo & { pattern: string } | null {
    // 정확한 매칭 먼저 시도
    const exactMatch = this.exactRoutes.get(pathname)
    if (exactMatch) {
      return { ...exactMatch, pattern: pathname }
    }

    // 파라미터 매칭 시도
    for (const { pattern, template, info } of this.paramRoutes) {
      if (pattern.test(pathname)) {
        return { ...info, pattern: template }
      }
    }

    return null
  }

  private hasParams(path: string): boolean {
    return path.includes(':') || path.includes('*')
  }

  private pathToRegex(path: string): RegExp {
    // 간단한 경로 -> 정규식 변환
    const regexPath = path
      .replace(/:[^/]+/g, '([^/]+)')  // :param -> 캡처 그룹
      .replace(/\*/g, '(.*)')         // * -> 모든 문자
      .replace(/\//g, '\\/')          // / 이스케이프

    return new RegExp(`^${regexPath}$`)
  }
}

// ===========================================
// 타입 정의
// ===========================================

interface RouteInfo {
  appId: string
  route: AppRoute
  component: string
  permissions: string[]
  public: boolean
}

interface RouteMatch extends RouteInfo {
  pattern: string
  fullPath: string
  params: Record<string, string>
  query: Record<string, string>
}

// ===========================================
// 싱글톤 인스턴스 및 유틸리티
// ===========================================

export const dynamicRouterManager = DynamicRouterManager.getInstance()

// Next.js 미들웨어에서 사용할 함수
export async function handleDynamicRoute(request: NextRequest): Promise<NextResponse | null> {
  return dynamicRouterManager.handleRequest(request)
}

// React Hook for Dynamic Router
export function useDynamicRouter() {
  const router = React.useMemo(() => dynamicRouterManager, [])

  const generateAppUrl = React.useCallback((appId: string, path?: string) => {
    return router.generateAppUrl(appId, path)
  }, [router])

  const matchCurrentRoute = React.useCallback(() => {
    if (typeof window === 'undefined') return null
    return router.matchRoute(window.location.pathname)
  }, [router])

  return {
    generateAppUrl,
    matchCurrentRoute,
    getAppRoutes: router.getAppRoutes.bind(router),
    getAllRoutes: router.getAllRoutes.bind(router),
    getRouteHistory: router.getRouteHistory.bind(router)
  }
}

// 라우트 데코레이터 (앱 개발자용)
export function defineAppRoutes(routes: AppRoute[]) {
  return function (target: any) {
    // 앱 컴포넌트에 라우트 정보 추가
    target.routes = routes
    return target
  }
}

// 앱 라우트 헬퍼
export class AppRouteBuilder {
  private routes: AppRoute[] = []

  route(path: string, component: string): AppRouteBuilder {
    this.routes.push({ path, component })
    return this
  }

  protectedRoute(path: string, component: string, permissions: string[]): AppRouteBuilder {
    this.routes.push({ path, component, permissions, public: false })
    return this
  }

  publicRoute(path: string, component: string): AppRouteBuilder {
    this.routes.push({ path, component, public: true })
    return this
  }

  build(): AppRoute[] {
    return [...this.routes]
  }
}

// 사용 예시:
// const routes = new AppRouteBuilder()
//   .route('/', 'HomePage')
//   .route('/settings', 'SettingsPage')
//   .protectedRoute('/admin', 'AdminPage', ['admin:access'])
//   .publicRoute('/help', 'HelpPage')
//   .build()