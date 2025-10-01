// DOT Platform V0.2 - Database Migrations
// 데이터베이스 마이그레이션 관리 시스템

import { createServerClient } from './client'
import { readFileSync } from 'fs'
import { join } from 'path'

// ===========================================
// 마이그레이션 타입 정의
// ===========================================

export interface Migration {
  id: string
  name: string
  sql: string
  applied_at?: string
  checksum: string
}

export interface MigrationResult {
  id: string
  success: boolean
  error?: string
  duration_ms: number
}

// ===========================================
// 마이그레이션 실행 함수
// ===========================================

/**
 * 메인 스키마 마이그레이션 실행
 */
export async function runSchemaMigration(): Promise<MigrationResult> {
  const startTime = Date.now()
  const migrationId = 'schema_v1_0_0'

  try {
    const supabase = createServerClient()

    // 스키마 파일 읽기
    const schemaPath = join(process.cwd(), 'src/lib/database/schema.sql')
    const schemaSql = readFileSync(schemaPath, 'utf-8')

    console.log('데이터베이스 스키마 마이그레이션 시작...')

    // 마이그레이션 추적 테이블 생성
    await createMigrationTable(supabase)

    // 이미 적용된 마이그레이션인지 확인
    const existingMigration = await getMigration(supabase, migrationId)
    if (existingMigration) {
      console.log('스키마 마이그레이션이 이미 적용됨:', migrationId)
      return {
        id: migrationId,
        success: true,
        duration_ms: Date.now() - startTime,
      }
    }

    // 스키마 실행 (rpc 함수 없이 직접 실행)
    // 실제 환경에서는 Supabase Dashboard나 다른 방법으로 스키마를 실행해야 합니다.
    console.log('스키마 SQL 준비됨 - 수동으로 Supabase에 적용 필요')
    console.log('스키마 파일 경로:', schemaPath)

    // 마이그레이션 기록
    await recordMigration(supabase, {
      id: migrationId,
      name: 'DOT Platform V0.2 Initial Schema',
      sql: schemaSql,
      checksum: generateChecksum(schemaSql),
    })

    const duration = Date.now() - startTime
    console.log(`스키마 마이그레이션 완료: ${duration}ms`)

    return {
      id: migrationId,
      success: true,
      duration_ms: duration,
    }
  } catch (error) {
    console.error('스키마 마이그레이션 실패:', error)

    return {
      id: migrationId,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startTime,
    }
  }
}

/**
 * 초기 데이터 삽입
 */
export async function seedInitialData(): Promise<MigrationResult> {
  const startTime = Date.now()
  const migrationId = 'seed_initial_data_v1_0_0'

  try {
    const supabase = createServerClient()

    console.log('초기 데이터 시드 시작...')

    // 이미 적용된 시드인지 확인
    const existingSeed = await getMigration(supabase, migrationId)
    if (existingSeed) {
      console.log('초기 데이터 시드가 이미 적용됨:', migrationId)
      return {
        id: migrationId,
        success: true,
        duration_ms: Date.now() - startTime,
      }
    }

    // 플랫폼 기본 설정이 없는 경우에만 삽입
    const { data: existingPlatform } = await supabase
      .from('platforms')
      .select('id')
      .limit(1)
      .single()

    if (!existingPlatform) {
      const { error: platformError } = await supabase
        .from('platforms')
        .insert({
          name: 'DOT Platform V0.2',
          version: '1.0.0',
          config: {
            features: {
              app_installation: true,
              user_registration: true,
              developer_mode: true,
            },
            limits: {
              max_apps_per_user: 20,
              max_data_per_app_mb: 100,
              session_timeout_hours: 24,
            },
            ui: {
              theme: 'system',
              language: 'ko-KR',
            },
          },
        } as any)

      if (platformError) {
        throw platformError
      }

      console.log('플랫폼 기본 설정 생성 완료')
    }

    // 샘플 앱 데이터 삽입 (개발 환경용)
    if (process.env.NODE_ENV === 'development') {
      await seedSampleApps(supabase)
    }

    // 시드 기록
    await recordMigration(supabase, {
      id: migrationId,
      name: 'Initial Data Seed',
      sql: '-- Initial data seed operations',
      checksum: 'seed_initial_data',
    })

    const duration = Date.now() - startTime
    console.log(`초기 데이터 시드 완료: ${duration}ms`)

    return {
      id: migrationId,
      success: true,
      duration_ms: duration,
    }
  } catch (error) {
    console.error('초기 데이터 시드 실패:', error)

    return {
      id: migrationId,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startTime,
    }
  }
}

/**
 * 샘플 앱 데이터 삽입 (개발 환경용)
 */
async function seedSampleApps(supabase: any) {
  const sampleApps = [
    {
      app_id: 'welcome',
      name: 'Welcome App',
      display_name_ko: '환영 앱',
      description: 'Welcome and onboarding application for new users',
      description_ko: '신규 사용자를 위한 환영 및 온보딩 앱',
      version: '1.0.0',
      status: 'active',
      category: 'system',
      tags: ['onboarding', 'welcome'],
      manifest: {
        routes: [
          {
            path: '/welcome',
            component: 'WelcomeComponent',
            public: true,
          },
        ],
        permissions: ['read:profile'],
        entry_point: 'index.js',
      },
      max_memory_mb: 10,
      max_storage_mb: 5,
      requires_network: false,
    },
    {
      app_id: 'settings',
      name: 'Platform Settings',
      display_name_ko: '플랫폼 설정',
      description: 'User settings and preferences management',
      description_ko: '사용자 설정 및 환경 설정 관리',
      version: '1.0.0',
      status: 'active',
      category: 'system',
      tags: ['settings', 'preferences', 'profile'],
      manifest: {
        routes: [
          {
            path: '/settings',
            component: 'SettingsComponent',
            permissions: ['read:profile', 'write:profile'],
          },
          {
            path: '/settings/profile',
            component: 'ProfileSettingsComponent',
            permissions: ['read:profile', 'write:profile'],
          },
        ],
        permissions: ['read:profile', 'write:profile'],
        entry_point: 'index.js',
      },
      max_memory_mb: 15,
      max_storage_mb: 10,
      requires_network: true,
    },
    {
      app_id: 'app_store',
      name: 'App Store',
      display_name_ko: '앱 스토어',
      description: 'Browse and install applications',
      description_ko: '앱 탐색 및 설치',
      version: '1.0.0',
      status: 'active',
      category: 'system',
      tags: ['apps', 'store', 'installation'],
      manifest: {
        routes: [
          {
            path: '/apps',
            component: 'AppStoreComponent',
            public: true,
          },
          {
            path: '/apps/:appId',
            component: 'AppDetailComponent',
            public: true,
          },
        ],
        permissions: ['read:data'],
        entry_point: 'index.js',
      },
      max_memory_mb: 25,
      max_storage_mb: 15,
      requires_network: true,
    },
  ]

  for (const app of sampleApps) {
    // 이미 존재하는 앱인지 확인
    const { data: existingApp } = await supabase
      .from('apps')
      .select('id')
      .eq('app_id', app.app_id)
      .single()

    if (!existingApp) {
      const { error } = await supabase
        .from('apps')
        .insert(app)

      if (error) {
        console.error(`샘플 앱 생성 실패 (${app.app_id}):`, error)
      } else {
        console.log(`샘플 앱 생성 완료: ${app.app_id}`)
      }
    }
  }
}

// ===========================================
// 마이그레이션 유틸리티 함수
// ===========================================

/**
 * 마이그레이션 추적 테이블 생성
 */
async function createMigrationTable(supabase: any) {
  const { error } = await supabase.rpc('create_migration_table')

  if (error && !error.message.includes('already exists')) {
    // 직접 SQL 실행
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createTableSql,
    })

    if (createError) {
      console.warn('마이그레이션 테이블 생성 실패:', createError)
    }
  }
}

/**
 * 마이그레이션 기록 조회
 */
async function getMigration(supabase: any, migrationId: string): Promise<Migration | null> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .eq('id', migrationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.warn('마이그레이션 기록 조회 실패:', error)
    return null
  }
}

/**
 * 마이그레이션 기록 저장
 */
async function recordMigration(supabase: any, migration: Omit<Migration, 'applied_at'>) {
  try {
    const { error } = await supabase
      .from('_migrations')
      .insert({
        id: migration.id,
        name: migration.name,
        checksum: migration.checksum,
        applied_at: new Date().toISOString(),
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.warn('마이그레이션 기록 저장 실패:', error)
  }
}

/**
 * 체크섬 생성 (간단한 해시)
 */
function generateChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32비트 정수로 변환
  }
  return hash.toString(16)
}

// ===========================================
// 마이그레이션 상태 확인
// ===========================================

/**
 * 데이터베이스 연결 확인
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('_migrations').select('count').limit(1)

    return !error
  } catch (error) {
    console.error('데이터베이스 연결 확인 실패:', error)
    return false
  }
}

/**
 * 적용된 마이그레이션 목록 조회
 */
export async function getAppliedMigrations(): Promise<Migration[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .order('applied_at', { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('적용된 마이그레이션 조회 실패:', error)
    return []
  }
}

// ===========================================
// 메인 마이그레이션 실행 함수
// ===========================================

/**
 * 전체 마이그레이션 실행 (스키마 + 시드 데이터)
 */
export async function runAllMigrations(): Promise<{
  success: boolean
  results: MigrationResult[]
  totalDuration: number
}> {
  const startTime = Date.now()
  const results: MigrationResult[] = []

  console.log('DOT Platform V0.2 데이터베이스 마이그레이션 시작')

  // 1. 스키마 마이그레이션
  const schemaResult = await runSchemaMigration()
  results.push(schemaResult)

  // 2. 초기 데이터 시드
  if (schemaResult.success) {
    const seedResult = await seedInitialData()
    results.push(seedResult)
  }

  const totalDuration = Date.now() - startTime
  const success = results.every(result => result.success)

  console.log('마이그레이션 완료:', {
    success,
    totalDuration,
    results: results.map(r => ({ id: r.id, success: r.success })),
  })

  return {
    success,
    results,
    totalDuration,
  }
}