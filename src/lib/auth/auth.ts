// DOT Platform V0.2 - Authentication System
// Supabase Auth 기반 인증 시스템

import { supabase, getUserProfile, updateUserProfile } from '../database/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '../database/types'

export type AuthUser = User
export type AuthSession = Session

// ===========================================
// 인증 상태 타입
// ===========================================

export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  profile: Database['public']['Tables']['user_profiles']['Row'] | null
  loading: boolean
}

// ===========================================
// 인증 함수
// ===========================================

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  options?: {
    displayName?: string
    redirectTo?: string
  }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options?.redirectTo,
      data: {
        display_name: options?.displayName,
      },
    },
  })

  if (error) {
    console.error('회원가입 실패:', error)
    throw error
  }

  return data
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('로그인 실패:', error)
    throw error
  }

  return data
}

/**
 * 소셜 로그인 (GitHub, Google 등)
 */
export async function signInWithProvider(
  provider: 'github' | 'google' | 'discord',
  options?: {
    redirectTo?: string
  }
) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options?.redirectTo,
    },
  })

  if (error) {
    console.error(`${provider} 로그인 실패:`, error)
    throw error
  }

  return data
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

/**
 * 비밀번호 재설정 요청
 */
export async function resetPassword(
  email: string,
  redirectTo?: string
) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    console.error('비밀번호 재설정 요청 실패:', error)
    throw error
  }
}

/**
 * 새 비밀번호 설정
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('비밀번호 변경 실패:', error)
    throw error
  }
}

/**
 * 이메일 변경
 */
export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) {
    console.error('이메일 변경 실패:', error)
    throw error
  }
}

// ===========================================
// 사용자 프로필 관리
// ===========================================

/**
 * 사용자 프로필 생성 (회원가입 후 자동 호출)
 */
export async function createUserProfile(
  userId: string,
  profileData?: any
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      display_name: profileData?.display_name,
      avatar_url: profileData?.avatar_url,
      bio: profileData?.bio,
      timezone: profileData?.timezone || 'Asia/Seoul',
      locale: profileData?.locale || 'ko-KR',
      theme: profileData?.theme || 'system',
      ...profileData,
    } as any)
    .select()
    .single()

  if (error) {
    console.error('사용자 프로필 생성 실패:', error)
    throw error
  }

  return data
}

/**
 * 사용자 프로필 업데이트 with 마지막 접속 시간
 */
export async function updateUserProfileWithActivity(
  userId: string,
  updates?: any
) {
  return updateUserProfile(userId, {
    ...updates,
    last_seen_at: new Date().toISOString(),
  })
}

// ===========================================
// 권한 확인 함수
// ===========================================

/**
 * 사용자가 플랫폼 관리자인지 확인
 */
export function isPlatformAdmin(session: AuthSession | null): boolean {
  if (!session) return false

  const userRole = session.user?.user_metadata?.role ||
                   session.user?.app_metadata?.role

  return userRole === 'platform_admin'
}

/**
 * 사용자가 개발자인지 확인
 */
export async function isDeveloper(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return (profile as any)?.is_developer || false
}

/**
 * 사용자가 검증된 개발자인지 확인
 */
export async function isVerifiedDeveloper(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return ((profile as any)?.is_developer && (profile as any)?.developer_verified) || false
}

// ===========================================
// 세션 관리
// ===========================================

/**
 * 현재 세션 가져오기
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('세션 가져오기 실패:', error)
    return null
  }

  return session
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('사용자 정보 가져오기 실패:', error)
    return null
  }

  return user
}

/**
 * 인증된 사용자의 전체 컨텍스트 가져오기
 */
export async function getAuthContext(): Promise<{
  user: AuthUser | null
  session: AuthSession | null
  profile: any | null
}> {
  const session = await getCurrentSession()
  const user = session?.user || null

  let profile = null
  if (user) {
    try {
      profile = await getUserProfile(user.id)
    } catch (error) {
      console.error('사용자 프로필 가져오기 실패:', error)
    }
  }

  return { user, session, profile }
}

// ===========================================
// 인증 이벤트 리스너
// ===========================================

/**
 * 인증 상태 변경 리스너 등록
 */
export function onAuthStateChange(
  callback: (event: any, session: AuthSession | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('인증 상태 변경:', event, session?.user?.email)
    callback(event, session)
  })
}

/**
 * 자동 프로필 생성 리스너 (신규 사용자용)
 */
export function setupAutoProfileCreation() {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const userId = session.user.id

      // 기존 프로필이 있는지 확인
      const existingProfile = await getUserProfile(userId)

      if (!existingProfile) {
        try {
          // 신규 사용자 프로필 생성
          await createUserProfile(userId, {
            display_name: session.user.user_metadata?.display_name ||
                         session.user.user_metadata?.full_name ||
                         session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
          })

          console.log('새 사용자 프로필 생성 완료:', userId)
        } catch (error) {
          console.error('자동 프로필 생성 실패:', error)
        }
      } else {
        // 기존 사용자의 마지막 접속 시간 업데이트
        try {
          await updateUserProfileWithActivity(userId)
        } catch (error) {
          console.error('마지막 접속 시간 업데이트 실패:', error)
        }
      }
    }
  })
}

// ===========================================
// 에러 처리 유틸리티
// ===========================================

export function getAuthErrorMessage(error: any): string {
  switch (error?.message) {
    case 'Invalid login credentials':
      return '이메일 또는 비밀번호가 잘못되었습니다.'
    case 'User not found':
      return '존재하지 않는 사용자입니다.'
    case 'Email not confirmed':
      return '이메일 인증이 완료되지 않았습니다. 인증 메일을 확인해주세요.'
    case 'Password should be at least 6 characters':
      return '비밀번호는 최소 6자 이상이어야 합니다.'
    case 'User already registered':
      return '이미 등록된 이메일입니다.'
    case 'Signup requires a valid password':
      return '유효한 비밀번호를 입력해주세요.'
    case 'Invalid email':
      return '유효하지 않은 이메일 주소입니다.'
    default:
      return error?.message || '알 수 없는 오류가 발생했습니다.'
  }
}