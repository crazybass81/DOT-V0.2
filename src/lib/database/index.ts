// DOT Platform V0.2 - Database Module Index
// 데이터베이스 모듈 통합 export

// 클라이언트 및 기본 함수
export {
  supabase,
  createServerClient,
  getCurrentUser,
  getCurrentSession,
  signOut,
  getPlatformConfig,
  getActiveApps,
  getUserApps,
  getUserProfile,
  updateUserProfile,
  installApp,
  uninstallApp,
  updateAppUsage,
  saveAppData,
  getAppData,
  deleteAppData,
  subscribeToUserApps,
  subscribeToAppsStatus,
  handleDatabaseError,
} from './client'

// 인증 시스템
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithProvider,
  resetPassword,
  updatePassword,
  updateEmail,
  createUserProfile,
  updateUserProfileWithActivity,
  isPlatformAdmin,
  isDeveloper,
  isVerifiedDeveloper,
  getAuthContext,
  onAuthStateChange,
  setupAutoProfileCreation,
  getAuthErrorMessage,
} from '../auth/auth'

// 마이그레이션 시스템
export {
  runSchemaMigration,
  seedInitialData,
  runAllMigrations,
  checkDatabaseConnection,
  getAppliedMigrations,
} from './migrations'

// 타입 정의
export type {
  Database,
  Platform,
  PlatformConfig,
  App,
  AppManifest,
  AppRoute,
  AppPermissionType,
  UserApp,
  UserProfile,
  AppData,
  AppPermission,
  AppSession,
  AppLog,
  DatabaseResponse,
  PaginationParams,
  PaginatedResult,
  AppFilter,
  UserAppFilter,
  AppDataFilter,
  AppStats,
  UserStats,
  PlatformStats,
} from './types'

export type {
  AuthUser,
  AuthSession,
  AuthState,
} from '../auth/auth'

export type {
  Migration,
  MigrationResult,
} from './migrations'