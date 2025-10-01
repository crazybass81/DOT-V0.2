// DOT Platform V0.2 - Supabase Client
// Supabase 클라이언트 설정 및 유틸리티 함수

import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일에서 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.'
  )
}

// 클라이언트 사이드 Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application': 'DOT Platform V0.2',
    },
  },
})

// 서버 사이드용 Supabase 클라이언트 (서비스 롤 키 사용)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application': 'DOT Platform V0.2 Server',
      },
    },
  })
}

// ===========================================
// 인증 유틸리티 함수
// ===========================================

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('사용자 정보 가져오기 실패:', error)
    return null
  }

  return user
}

/**
 * 사용자 세션 확인
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('세션 정보 가져오기 실패:', error)
    return null
  }

  return session
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('로그아웃 실패:', error)
    throw error
  }
}

// ===========================================
// 데이터베이스 유틸리티 함수
// ===========================================

/**
 * 플랫폼 설정 가져오기
 */
export async function getPlatformConfig() {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .single()

  if (error) {
    console.error('플랫폼 설정 가져오기 실패:', error)
    return null
  }

  return data
}

/**
 * 활성 앱 목록 가져오기
 */
export async function getActiveApps() {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('활성 앱 목록 가져오기 실패:', error)
    return []
  }

  return data || []
}

/**
 * 사용자 설치 앱 목록 가져오기
 */
export async function getUserApps(userId: string) {
  const { data, error } = await supabase
    .from('user_apps')
    .select(`
      *,
      apps:app_id (
        id,
        app_id,
        name,
        display_name_ko,
        description,
        description_ko,
        version,
        category,
        tags
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'installed')
    .order('last_used_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('사용자 앱 목록 가져오기 실패:', error)
    return []
  }

  return data || []
}

/**
 * 사용자 프로필 가져오기
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('사용자 프로필 가져오기 실패:', error)
    return null
  }

  return data
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  userId: string,
  updates: any
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('사용자 프로필 업데이트 실패:', error)
    throw error
  }

  return data
}

/**
 * 앱 설치
 */
export async function installApp(userId: string, appId: string) {
  // 이미 설치된 앱인지 확인
  const { data: existingApp, error: checkError } = await supabase
    .from('user_apps')
    .select('id')
    .eq('user_id', userId)
    .eq('app_id', appId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('앱 설치 상태 확인 실패:', checkError)
    throw checkError
  }

  if (existingApp) {
    throw new Error('이미 설치된 앱입니다.')
  }

  // 앱 설치
  const { data, error } = await supabase
    .from('user_apps')
    .insert({
      user_id: userId,
      app_id: appId,
      status: 'installed',
    })
    .select()
    .single()

  if (error) {
    console.error('앱 설치 실패:', error)
    throw error
  }

  // 앱 설치 카운트 증가
  const { error: updateError } = await supabase.rpc('increment_app_install_count', {
    target_app_id: appId
  })

  if (updateError) {
    console.error('앱 설치 카운트 업데이트 실패:', updateError)
    // 설치는 성공했으므로 에러를 던지지 않음
  }

  return data
}

/**
 * 앱 제거
 */
export async function uninstallApp(userId: string, appId: string) {
  const { error } = await supabase
    .from('user_apps')
    .delete()
    .eq('user_id', userId)
    .eq('app_id', appId)

  if (error) {
    console.error('앱 제거 실패:', error)
    throw error
  }

  // 앱 설치 카운트 감소
  const { error: updateError } = await supabase.rpc('decrement_app_install_count', {
    target_app_id: appId
  })

  if (updateError) {
    console.error('앱 설치 카운트 업데이트 실패:', updateError)
    // 제거는 성공했으므로 에러를 던지지 않음
  }
}

/**
 * 앱 사용 기록 업데이트
 */
export async function updateAppUsage(userId: string, appId: string) {
  const { error } = await supabase.rpc('update_app_usage', {
    target_user_id: userId,
    target_app_id: appId
  })

  if (error) {
    console.error('앱 사용 기록 업데이트 실패:', error)
    throw error
  }
}

/**
 * 앱 데이터 저장
 */
export async function saveAppData(
  appId: string,
  userId: string,
  dataType: 'state' | 'settings' | 'user_data' | 'cache' | 'temp',
  dataKey: string,
  data: Record<string, any>,
  options?: {
    expiresAt?: string
    metadata?: Record<string, any>
    tags?: string[]
  }
) {
  const { data: result, error } = await supabase
    .from('app_data')
    .upsert({
      app_id: appId,
      user_id: userId,
      data_type: dataType,
      data_key: dataKey,
      data,
      data_size: JSON.stringify(data).length,
      expires_at: options?.expiresAt,
      metadata: options?.metadata || {},
      tags: options?.tags || [],
      updated_at: new Date().toISOString(),
      accessed_at: new Date().toISOString(),
    } as any)
    .select()
    .single()

  if (error) {
    console.error('앱 데이터 저장 실패:', error)
    throw error
  }

  return result
}

/**
 * 앱 데이터 가져오기
 */
export async function getAppData(
  appId: string,
  userId: string,
  dataKey: string
) {
  const { data, error } = await supabase
    .from('app_data')
    .select('*')
    .eq('app_id', appId)
    .eq('user_id', userId)
    .eq('data_key', dataKey)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 데이터가 없음
    }
    console.error('앱 데이터 가져오기 실패:', error)
    throw error
  }

  // 액세스 시간 업데이트 (백그라운드에서 실행)
  supabase
    .from('app_data')
    .update({ accessed_at: new Date().toISOString() } as any)
    .eq('id', data.id)
    .then()

  return data
}

/**
 * 앱 데이터 삭제
 */
export async function deleteAppData(
  appId: string,
  userId: string,
  dataKey: string
) {
  const { error } = await supabase
    .from('app_data')
    .delete()
    .eq('app_id', appId)
    .eq('user_id', userId)
    .eq('data_key', dataKey)

  if (error) {
    console.error('앱 데이터 삭제 실패:', error)
    throw error
  }
}

// ===========================================
// 실시간 구독 유틸리티
// ===========================================

/**
 * 사용자 앱 변경사항 구독
 */
export function subscribeToUserApps(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('user_apps_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_apps',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()
}

/**
 * 앱 상태 변경사항 구독
 */
export function subscribeToAppsStatus(callback: (payload: any) => void) {
  return supabase
    .channel('apps_status_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'apps',
      },
      callback
    )
    .subscribe()
}

// ===========================================
// 에러 처리 유틸리티
// ===========================================

export function handleDatabaseError(error: any, context: string) {
  console.error(`${context} 오류:`, error)

  // 사용자 친화적인 에러 메시지 반환
  switch (error?.code) {
    case 'PGRST116':
      return '데이터를 찾을 수 없습니다.'
    case '23505':
      return '이미 존재하는 데이터입니다.'
    case '23503':
      return '참조하는 데이터가 존재하지 않습니다.'
    case '42501':
      return '접근 권한이 없습니다.'
    default:
      return '데이터베이스 오류가 발생했습니다.'
  }
}