// DOT Platform V0.2 - App Registry Service
// 앱 등록, 검색, 설치, 제거를 관리하는 서비스

import { createClient } from '@supabase/supabase-js'
import type { Database, App, UserApp } from '../database/types'
import type {
  AppStatus,
  AppManifest,
  AppSearchFilters,
  AppRating,
  AppStats,
  PlatformEventData
} from './types'
import { platformEventManager } from './shell'

// ===========================================
// 타입 정의
// ===========================================

export interface AppRegistryService {
  // 앱 검색 및 조회
  searchApps(query: string, filters?: AppSearchFilters): Promise<App[]>
  getApp(appId: string): Promise<App | null>
  getAppsByCategory(category: string): Promise<App[]>
  getFeaturedApps(): Promise<App[]>
  getPopularApps(): Promise<App[]>

  // 앱 설치/제거
  installApp(appId: string, userId: string): Promise<UserApp>
  uninstallApp(appId: string, userId: string): Promise<void>

  // 사용자 앱 관리
  getUserApps(userId: string): Promise<UserApp[]>
  getUserApp(userAppId: string): Promise<UserApp | null>
  updateAppSettings(userAppId: string, settings: Record<string, any>): Promise<void>

  // 앱 평가 및 리뷰
  rateApp(appId: string, userId: string, rating: number, review?: string): Promise<void>
  getAppRatings(appId: string, limit?: number): Promise<AppRating[]>

  // 앱 통계
  updateUsageStats(appId: string, userId: string): Promise<void>
  getAppStats(appId: string): Promise<AppStats>

  // 앱 상태 관리
  updateAppStatus(appId: string, status: AppStatus): Promise<void>
  checkAppUpdates(userId: string): Promise<App[]>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface SecurityScanResult {
  passed: boolean
  vulnerabilities: SecurityVulnerability[]
  riskScore: number
}

export interface SecurityVulnerability {
  type: 'high' | 'medium' | 'low'
  category: string
  description: string
  recommendation: string
}

// ===========================================
// App Registry Service 구현
// ===========================================

export class AppRegistryServiceImpl implements AppRegistryService {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // ===========================================
  // 앱 검색 및 조회
  // ===========================================

  async searchApps(query: string, filters?: AppSearchFilters): Promise<App[]> {
    try {
      let queryBuilder = this.supabase
        .from('apps')
        .select('*')
        .eq('status', 'published')

      // 텍스트 검색
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
        )
      }

      // 필터 적용
      if (filters) {
        if (filters.category) {
          queryBuilder = queryBuilder.eq('category', filters.category)
        }
        if (filters.minRating) {
          queryBuilder = queryBuilder.gte('average_rating', filters.minRating)
        }
        if (filters.maxPrice !== undefined) {
          queryBuilder = queryBuilder.lte('price', filters.maxPrice)
        }
        if (filters.isPaid !== undefined) {
          if (filters.isPaid) {
            queryBuilder = queryBuilder.gt('price', 0)
          } else {
            queryBuilder = queryBuilder.eq('price', 0)
          }
        }
        if (filters.tags?.length) {
          queryBuilder = queryBuilder.overlaps('tags', filters.tags)
        }
      }

      // 정렬
      const sortBy = filters?.sortBy || 'popularity'
      switch (sortBy) {
        case 'popularity':
          queryBuilder = queryBuilder.order('install_count', { ascending: false })
          break
        case 'rating':
          queryBuilder = queryBuilder.order('average_rating', { ascending: false })
          break
        case 'date':
          queryBuilder = queryBuilder.order('created_at', { ascending: false })
          break
        case 'name':
          queryBuilder = queryBuilder.order('name', { ascending: true })
          break
        case 'price':
          queryBuilder = queryBuilder.order('price', { ascending: true })
          break
      }

      // 제한
      const limit = filters?.limit || 50
      queryBuilder = queryBuilder.limit(limit)

      const { data, error } = await queryBuilder

      if (error) {
        console.error('[AppRegistry] 앱 검색 실패:', error)
        throw new Error(`앱 검색 실패: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('[AppRegistry] searchApps 오류:', error)
      throw error
    }
  }

  async getApp(appId: string): Promise<App | null> {
    try {
      const { data, error } = await this.supabase
        .from('apps')
        .select('*')
        .eq('app_id', appId)
        .eq('status', 'published')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // 앱이 존재하지 않음
        }
        console.error('[AppRegistry] 앱 조회 실패:', error)
        throw new Error(`앱 조회 실패: ${error.message}`)
      }

      return data

    } catch (error) {
      console.error('[AppRegistry] getApp 오류:', error)
      throw error
    }
  }

  async getAppsByCategory(category: string): Promise<App[]> {
    try {
      const { data, error } = await this.supabase
        .from('apps')
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('install_count', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[AppRegistry] 카테고리별 앱 조회 실패:', error)
        throw new Error(`카테고리별 앱 조회 실패: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('[AppRegistry] getAppsByCategory 오류:', error)
      throw error
    }
  }

  async getFeaturedApps(): Promise<App[]> {
    try {
      const { data, error } = await this.supabase
        .from('apps')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true })
        .limit(20)

      if (error) {
        console.error('[AppRegistry] 추천 앱 조회 실패:', error)
        throw new Error(`추천 앱 조회 실패: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('[AppRegistry] getFeaturedApps 오류:', error)
      throw error
    }
  }

  async getPopularApps(): Promise<App[]> {
    try {
      const { data, error } = await this.supabase
        .from('apps')
        .select('*')
        .eq('status', 'published')
        .order('install_count', { ascending: false })
        .limit(20)

      if (error) {
        console.error('[AppRegistry] 인기 앱 조회 실패:', error)
        throw new Error(`인기 앱 조회 실패: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('[AppRegistry] getPopularApps 오류:', error)
      throw error
    }
  }

  // ===========================================
  // 앱 설치/제거
  // ===========================================

  async installApp(appId: string, userId: string): Promise<UserApp> {
    try {
      // 1. 앱 존재 및 상태 확인
      const app = await this.getApp(appId)
      if (!app) {
        throw new Error('앱을 찾을 수 없습니다')
      }

      // 2. 이미 설치된 앱인지 확인
      const existingInstall = await this.getUserApp(`${userId}-${appId}`)
      if (existingInstall) {
        throw new Error('이미 설치된 앱입니다')
      }

      // 3. 사용자 앱 설치 기록 생성
      const userApp: Omit<UserApp, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        app_id: appId,
        install_date: new Date().toISOString(),
        status: 'active',
        settings: {},
        usage_stats: {
          total_opens: 0,
          last_opened: null,
          total_usage_time: 0
        }
      }

      const { data, error } = await this.supabase
        .from('user_apps')
        .insert(userApp)
        .select()
        .single()

      if (error) {
        console.error('[AppRegistry] 앱 설치 실패:', error)
        throw new Error(`앱 설치 실패: ${error.message}`)
      }

      // 4. 앱 설치 카운트 업데이트
      await this.supabase.rpc('increment_app_install_count', { app_id: appId })

      // 5. 이벤트 발생
      platformEventManager.emit('app:installed', {
        timestamp: new Date(),
        appId,
        data: {
          userId,
          appName: app.name,
          version: app.version
        }
      })

      console.log(`[AppRegistry] 앱 설치 완료: ${appId} (사용자: ${userId})`)

      return data

    } catch (error) {
      console.error('[AppRegistry] installApp 오류:', error)
      throw error
    }
  }

  async uninstallApp(appId: string, userId: string): Promise<void> {
    try {
      // 1. 설치된 앱 확인
      const userApp = await this.getUserApp(`${userId}-${appId}`)
      if (!userApp) {
        throw new Error('설치되지 않은 앱입니다')
      }

      // 2. 사용자 앱 데이터 제거
      const { error: deleteError } = await this.supabase
        .from('user_apps')
        .delete()
        .eq('user_id', userId)
        .eq('app_id', appId)

      if (deleteError) {
        console.error('[AppRegistry] 앱 제거 실패:', deleteError)
        throw new Error(`앱 제거 실패: ${deleteError.message}`)
      }

      // 3. 앱별 사용자 데이터 정리 (선택적)
      await this.supabase
        .from('app_data')
        .delete()
        .eq('app_id', appId)
        .eq('user_id', userId)

      // 4. 앱 설치 카운트 감소
      await this.supabase.rpc('decrement_app_install_count', { app_id: appId })

      // 5. 이벤트 발생
      platformEventManager.emit('app:uninstalled', {
        timestamp: new Date(),
        appId,
        data: {
          userId,
          uninstallReason: 'user_request'
        }
      })

      console.log(`[AppRegistry] 앱 제거 완료: ${appId} (사용자: ${userId})`)

    } catch (error) {
      console.error('[AppRegistry] uninstallApp 오류:', error)
      throw error
    }
  }

  // ===========================================
  // 사용자 앱 관리
  // ===========================================

  async getUserApps(userId: string): Promise<UserApp[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_apps')
        .select(`
          *,
          app:apps(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('install_date', { ascending: false })

      if (error) {
        console.error('[AppRegistry] 사용자 앱 조회 실패:', error)
        throw new Error(`사용자 앱 조회 실패: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('[AppRegistry] getUserApps 오류:', error)
      throw error
    }
  }

  async getUserApp(userAppId: string): Promise<UserApp | null> {
    try {
      // userAppId는 "userId-appId" 형태로 가정
      const [userId, appId] = userAppId.split('-')

      const { data, error } = await this.supabase
        .from('user_apps')
        .select(`
          *,
          app:apps(*)
        `)
        .eq('user_id', userId)
        .eq('app_id', appId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('[AppRegistry] 사용자 앱 조회 실패:', error)
        throw new Error(`사용자 앱 조회 실패: ${error.message}`)
      }

      return data

    } catch (error) {
      console.error('[AppRegistry] getUserApp 오류:', error)
      throw error
    }
  }

  async updateAppSettings(userAppId: string, settings: Record<string, any>): Promise<void> {
    try {
      const [userId, appId] = userAppId.split('-')

      const { error } = await this.supabase
        .from('user_apps')
        .update({
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('app_id', appId)

      if (error) {
        console.error('[AppRegistry] 앱 설정 업데이트 실패:', error)
        throw new Error(`앱 설정 업데이트 실패: ${error.message}`)
      }

      console.log(`[AppRegistry] 앱 설정 업데이트: ${userAppId}`)

    } catch (error) {
      console.error('[AppRegistry] updateAppSettings 오류:', error)
      throw error
    }
  }

  // ===========================================
  // 앱 평가 및 리뷰 (기본 구현)
  // ===========================================

  async rateApp(appId: string, userId: string, rating: number, review?: string): Promise<void> {
    console.log(`[AppRegistry] 앱 평가: ${appId}, 평점: ${rating}`)
    // 실제 구현에서는 app_reviews 테이블에 저장
  }

  async getAppRatings(appId: string, limit = 10): Promise<AppRating[]> {
    console.log(`[AppRegistry] 앱 평가 조회: ${appId}`)
    return []
  }

  // ===========================================
  // 앱 통계 (기본 구현)
  // ===========================================

  async updateUsageStats(appId: string, userId: string): Promise<void> {
    try {
      await this.supabase.rpc('update_app_usage_stats', {
        app_id: appId,
        user_id: userId
      })
    } catch (error) {
      console.error('[AppRegistry] 사용 통계 업데이트 오류:', error)
    }
  }

  async getAppStats(appId: string): Promise<AppStats> {
    try {
      const { data, error } = await this.supabase
        .from('apps')
        .select('install_count, average_rating, review_count')
        .eq('app_id', appId)
        .single()

      if (error) {
        console.error('[AppRegistry] 앱 통계 조회 실패:', error)
        return {
          installCount: 0,
          activeUsers: 0,
          averageRating: 0,
          totalReviews: 0,
          dailyActiveUsers: 0,
          weeklyActiveUsers: 0,
          monthlyActiveUsers: 0
        }
      }

      return {
        installCount: data.install_count || 0,
        activeUsers: 0, // 별도 계산 필요
        averageRating: data.average_rating || 0,
        totalReviews: data.review_count || 0,
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0
      }

    } catch (error) {
      console.error('[AppRegistry] getAppStats 오류:', error)
      throw error
    }
  }

  // ===========================================
  // 앱 상태 관리 (기본 구현)
  // ===========================================

  async updateAppStatus(appId: string, status: AppStatus): Promise<void> {
    console.log(`[AppRegistry] 앱 상태 업데이트: ${appId} -> ${status}`)
  }

  async checkAppUpdates(userId: string): Promise<App[]> {
    console.log(`[AppRegistry] 앱 업데이트 확인: ${userId}`)
    return []
  }
}

// ===========================================
// 싱글톤 인스턴스
// ===========================================

export const appRegistryService: AppRegistryService = new AppRegistryServiceImpl()

// ===========================================
// 유틸리티 함수들
// ===========================================

export function validateAppManifest(manifest: AppManifest): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 필수 필드 검증
  if (!manifest.name?.trim()) {
    errors.push('앱 이름은 필수입니다')
  }
  if (!manifest.version?.trim()) {
    errors.push('앱 버전은 필수입니다')
  }
  if (!manifest.main?.trim()) {
    errors.push('메인 컴포넌트는 필수입니다')
  }

  // 버전 형식 검증
  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    warnings.push('버전 형식은 x.y.z 형태를 권장합니다')
  }

  // 권한 검증
  if (manifest.permissions?.includes('*')) {
    errors.push('와일드카드 권한(*) 은 허용되지 않습니다')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function calculateAppRiskScore(app: App): number {
  let risk = 0

  // 권한 기반 위험도
  const dangerousPermissions = ['file_system', 'network', 'camera', 'microphone']
  const appPermissions = app.manifest.permissions || []
  risk += appPermissions.filter(p => dangerousPermissions.includes(p)).length * 20

  // 설치 수 기반 신뢰도 (역방향)
  if (app.install_count < 100) risk += 30
  else if (app.install_count < 1000) risk += 10

  // 평점 기반 신뢰도 (역방향)
  if (app.average_rating < 3.0) risk += 40
  else if (app.average_rating < 4.0) risk += 20

  // 개발자 검증 상태
  if (!app.developer_verified) risk += 25

  return Math.min(risk, 100)
}