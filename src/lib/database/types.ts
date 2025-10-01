// DOT Platform V0.2 - Database Types
// TypeScript 타입 정의 for Supabase

export interface Database {
  public: {
    Tables: {
      platforms: {
        Row: Platform
        Insert: Omit<Platform, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Platform, 'id' | 'created_at'>>
      }
      apps: {
        Row: App
        Insert: Omit<App, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'deprecated_at'>
        Update: Partial<Omit<App, 'id' | 'created_at'>>
      }
      user_apps: {
        Row: UserApp
        Insert: Omit<UserApp, 'id' | 'installed_at' | 'updated_at'>
        Update: Partial<Omit<UserApp, 'id' | 'user_id' | 'app_id' | 'installed_at'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at' | 'last_seen_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      app_data: {
        Row: AppData
        Insert: Omit<AppData, 'id' | 'created_at' | 'updated_at' | 'accessed_at'>
        Update: Partial<Omit<AppData, 'id' | 'app_id' | 'user_id' | 'data_key' | 'created_at'>>
      }
      app_permissions: {
        Row: AppPermission
        Insert: Omit<AppPermission, 'id' | 'granted_at'>
        Update: Partial<Omit<AppPermission, 'id' | 'app_id' | 'user_id' | 'scope' | 'granted_at'>>
      }
      app_sessions: {
        Row: AppSession
        Insert: Omit<AppSession, 'id' | 'created_at' | 'expires_at'>
        Update: Partial<Omit<AppSession, 'id' | 'app_id' | 'user_id' | 'session_token' | 'created_at'>>
      }
      app_logs: {
        Row: AppLog
        Insert: Omit<AppLog, 'id' | 'created_at' | 'log_date'>
        Update: never // 로그는 수정 불가
      }
    }
  }
}

// ===========================================
// 플랫폼 코어 타입
// ===========================================

export interface Platform {
  id: string
  name: string
  version: string
  config: PlatformConfig
  maintenance_mode: boolean
  max_concurrent_apps: number
  max_users_per_app: number
  created_at: string
  updated_at: string
}

export interface PlatformConfig {
  features: {
    app_installation: boolean
    user_registration: boolean
    developer_mode: boolean
  }
  limits: {
    max_apps_per_user: number
    max_data_per_app_mb: number
    session_timeout_hours: number
  }
  ui: {
    theme: 'light' | 'dark' | 'system'
    language: string
  }
  [key: string]: any
}

export interface App {
  id: string
  app_id: string
  name: string
  display_name_ko?: string
  description?: string
  description_ko?: string
  version: string
  manifest: AppManifest

  // 상태 및 메타데이터
  status: 'active' | 'inactive' | 'installing' | 'error' | 'deprecated'
  category: string
  tags: string[]

  // 통계 및 메트릭
  install_count: number
  active_users_count: number
  average_rating: number
  total_ratings: number

  // 리소스 제한
  max_memory_mb: number
  max_storage_mb: number
  requires_network: boolean

  // 개발자 정보
  developer_id?: string
  repository_url?: string
  documentation_url?: string

  // 타임스탬프
  created_at: string
  updated_at: string
  published_at?: string
  deprecated_at?: string
}

export interface AppManifest {
  routes: AppRoute[]
  permissions: AppPermissionType[]
  dependencies?: string[]
  entry_point: string
  config_schema?: Record<string, any>
  [key: string]: any
}

export interface AppRoute {
  path: string
  component: string
  permissions?: AppPermissionType[]
  public?: boolean
}

export type AppPermissionType =
  | 'read:profile'
  | 'write:profile'
  | 'read:data'
  | 'write:data'
  | 'admin:users'
  | 'system:files'
  | 'network:external'

export interface UserApp {
  id: string
  user_id: string
  app_id: string

  // 설치 상태
  status: 'installed' | 'disabled' | 'uninstalling'

  // 설정
  settings: Record<string, any>
  preferences: Record<string, any>

  // 사용 통계
  launch_count: number
  last_used_at?: string
  total_usage_minutes: number

  // 평가
  user_rating?: number
  user_review?: string

  // 타임스탬프
  installed_at: string
  updated_at: string
}

export interface UserProfile {
  id: string // auth.users.id와 동일

  // 기본 프로필 정보
  display_name?: string
  avatar_url?: string
  bio?: string
  website_url?: string

  // 지역화 설정
  timezone: string
  locale: string
  date_format: string
  time_format: '12h' | '24h'

  // UI/UX 설정
  theme: 'light' | 'dark' | 'system'
  color_scheme: string
  font_size: 'small' | 'medium' | 'large'
  reduce_motion: boolean

  // 플랫폼 설정
  default_app_layout: 'grid' | 'list'
  show_app_ratings: boolean
  auto_update_apps: boolean

  // 개인화 설정
  preferences: Record<string, any>
  shortcuts: Record<string, any>

  // 개발자 관련
  is_developer: boolean
  developer_verified: boolean
  github_username?: string

  // 타임스탬프
  created_at: string
  updated_at: string
  last_seen_at: string
}

// ===========================================
// 앱 데이터 타입
// ===========================================

export interface AppData {
  id: string
  app_id: string
  user_id?: string

  // 데이터 분류
  data_type: 'state' | 'settings' | 'user_data' | 'cache' | 'temp'
  data_key: string

  // 데이터 내용
  data: Record<string, any>
  data_size: number

  // 캐시 및 만료 관리
  expires_at?: string
  is_encrypted: boolean
  compression_type?: 'gzip' | 'lz4'

  // 버전 관리
  version: number
  previous_version_id?: string

  // 메타데이터
  metadata: Record<string, any>
  tags: string[]

  // 타임스탬프
  created_at: string
  updated_at: string
  accessed_at: string
}

export interface AppPermission {
  id: string
  app_id: string
  user_id?: string

  // 권한 정보
  permissions: AppPermissionType[]
  scope: 'user' | 'app' | 'platform'

  // 권한 부여 정보
  granted_by?: string
  granted_reason?: string

  // 시간 제한
  granted_at: string
  expires_at?: string
  revoked_at?: string

  // 조건부 권한
  conditions: Record<string, any>

  // 권한 상태
  status: 'active' | 'inactive' | 'revoked' | 'expired'
}

export interface AppSession {
  id: string
  app_id: string
  user_id: string

  // 세션 정보
  session_token: string
  device_info: Record<string, any>
  ip_address?: string
  user_agent?: string

  // 세션 상태
  status: 'active' | 'inactive' | 'expired' | 'terminated'

  // 활동 추적
  last_activity_at: string
  activities_count: number
  data_transferred_mb: number

  // 시간 정보
  created_at: string
  expires_at: string
  terminated_at?: string
}

export interface AppLog {
  id: string
  app_id: string
  user_id?: string
  session_id?: string

  // 로그 레벨 및 분류
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  category: 'auth' | 'api' | 'ui' | 'performance' | 'security'
  event_type: string

  // 로그 내용
  message: string
  details: Record<string, any>
  stack_trace?: string

  // 컨텍스트 정보
  source?: string
  request_id?: string

  // 성능 메트릭
  duration_ms?: number
  memory_usage_mb?: number

  // 시간 정보
  created_at: string
  log_date: string
}

// ===========================================
// 유틸리티 타입
// ===========================================

// 데이터베이스 응답 타입
export type DatabaseResponse<T> = {
  data: T | null
  error: Error | null
}

// 페이지네이션 타입
export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    current_page: number
    total_pages: number
    total_count: number
    has_next: boolean
    has_previous: boolean
  }
}

// 필터 타입
export interface AppFilter {
  status?: App['status'][]
  category?: string[]
  tags?: string[]
  developer_id?: string
  search?: string
}

export interface UserAppFilter {
  status?: UserApp['status'][]
  app_category?: string[]
  last_used_after?: string
  rating_gte?: number
}

export interface AppDataFilter {
  data_type?: AppData['data_type'][]
  expires_before?: string
  size_gte?: number
  size_lte?: number
}

// 집계 타입
export interface AppStats {
  total_installs: number
  active_users: number
  average_rating: number
  total_ratings: number
  category_distribution: Record<string, number>
  daily_active_users: number
}

export interface UserStats {
  total_apps_installed: number
  total_usage_minutes: number
  favorite_category: string
  most_used_app: string
  last_activity: string
}

export interface PlatformStats {
  total_users: number
  total_apps: number
  total_sessions: number
  total_data_mb: number
  top_apps: Array<{
    app_id: string
    name: string
    install_count: number
  }>
}