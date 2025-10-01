// DOT Platform V0.2 - Security & Permissions Types
// 보안 및 권한 관리 시스템 타입 정의

// ===========================================
// 권한 타입 정의
// ===========================================

export interface Permission {
  id: string
  name: string
  description: string
  resource: ResourceType
  action: ActionType
  scope?: PermissionScope
}

export type ResourceType =
  | 'app'           // 앱 관리
  | 'user'          // 사용자 관리
  | 'data'          // 데이터 접근
  | 'api'           // API 호출
  | 'file'          // 파일 시스템
  | 'network'       // 네트워크 접근
  | 'system'        // 시스템 설정
  | 'notification'  // 알림
  | 'storage'       // 저장소
  | 'camera'        // 카메라
  | 'microphone'    // 마이크
  | 'location'      // 위치 정보
  | 'clipboard'     // 클립보드
  | 'share'         // 공유

export type ActionType =
  | 'read'          // 읽기
  | 'write'         // 쓰기
  | 'create'        // 생성
  | 'update'        // 수정
  | 'delete'        // 삭제
  | 'execute'       // 실행
  | 'list'          // 목록
  | 'manage'        // 관리
  | '*'             // 모든 액션

export interface PermissionScope {
  type: 'own' | 'team' | 'organization' | 'global'
  entityId?: string
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains'
  value: any
}

// ===========================================
// 역할 기반 접근 제어 (RBAC)
// ===========================================

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface UserRole {
  userId: string
  roleId: string
  grantedBy?: string
  grantedAt: Date
  expiresAt?: Date
  scope?: PermissionScope
}

// ===========================================
// 보안 정책
// ===========================================

export interface SecurityPolicy {
  id: string
  name: string
  type: PolicyType
  rules: PolicyRule[]
  priority: number
  enabled: boolean
  appliesTo: PolicyTarget[]
  createdAt: Date
  updatedAt: Date
}

export type PolicyType =
  | 'access_control'     // 접근 제어
  | 'data_protection'    // 데이터 보호
  | 'network_security'   // 네트워크 보안
  | 'app_isolation'      // 앱 격리
  | 'resource_limit'     // 리소스 제한
  | 'audit_logging'      // 감사 로깅

export interface PolicyRule {
  id: string
  condition: PolicyCondition
  action: PolicyAction
  severity: 'info' | 'warning' | 'error' | 'critical'
  message?: string
}

export interface PolicyCondition {
  type: 'permission' | 'resource' | 'time' | 'location' | 'custom'
  operator: string
  value: any
  combine?: 'and' | 'or'
  children?: PolicyCondition[]
}

export interface PolicyAction {
  type: 'allow' | 'deny' | 'log' | 'alert' | 'require_mfa' | 'rate_limit'
  params?: Record<string, any>
}

export interface PolicyTarget {
  type: 'user' | 'role' | 'app' | 'all'
  id?: string
}

// ===========================================
// 앱 샌드박싱
// ===========================================

export interface AppSandbox {
  appId: string
  isolation: IsolationLevel
  permissions: AppPermission[]
  resourceLimits: ResourceLimits
  networkPolicy: NetworkPolicy
  dataAccess: DataAccessPolicy
  iframeOptions?: IframeOptions
}

export type IsolationLevel =
  | 'none'        // 격리 없음 (신뢰된 앱)
  | 'basic'       // 기본 격리
  | 'standard'    // 표준 격리
  | 'strict'      // 엄격한 격리
  | 'maximum'     // 최대 격리

export interface AppPermission {
  resource: ResourceType
  actions: ActionType[]
  granted: boolean
  conditions?: PermissionCondition[]
  requestedAt?: Date
  grantedAt?: Date
  grantedBy?: string
  reason?: string
}

export interface ResourceLimits {
  memory: number          // MB
  storage: number         // MB
  cpu: number            // percentage (0-100)
  networkBandwidth?: number  // KB/s
  apiCallsPerMinute?: number
  maxExecutionTime?: number  // seconds
}

export interface NetworkPolicy {
  allowedDomains: string[]
  blockedDomains: string[]
  allowSubdomains: boolean
  enforceHttps: boolean
  corsPolicy?: CorsPolicy
}

export interface CorsPolicy {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  allowCredentials: boolean
  maxAge?: number
}

export interface DataAccessPolicy {
  allowedCollections: string[]
  allowedOperations: DataOperation[]
  rowLevelSecurity: boolean
  encryptionRequired: boolean
  auditLogging: boolean
}

export type DataOperation = 'select' | 'insert' | 'update' | 'delete'

export interface IframeOptions {
  sandbox: string[]  // iframe sandbox attributes
  allow: string[]    // iframe allow attributes
  csp?: string      // Content Security Policy
}

// ===========================================
// 보안 컨텍스트
// ===========================================

export interface SecurityContext {
  userId?: string
  sessionId: string
  roles: Role[]
  permissions: Permission[]
  policies: SecurityPolicy[]
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export interface PermissionCheck {
  resource: ResourceType
  action: ActionType
  scope?: PermissionScope
  context?: Record<string, any>
}

export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  appliedPolicies?: string[]
  requiredPermissions?: Permission[]
  suggestions?: string[]
}

// ===========================================
// 감사 로그
// ===========================================

export interface AuditLog {
  id: string
  timestamp: Date
  userId?: string
  sessionId: string
  appId?: string
  action: string
  resource: string
  resourceId?: string
  result: 'success' | 'failure' | 'denied'
  reason?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: 'info' | 'warning' | 'error' | 'critical'
  timestamp: Date
  userId?: string
  appId?: string
  message: string
  details?: Record<string, any>
  handled: boolean
}

export type SecurityEventType =
  | 'permission_denied'
  | 'policy_violation'
  | 'suspicious_activity'
  | 'authentication_failure'
  | 'authorization_failure'
  | 'resource_limit_exceeded'
  | 'sandbox_breach'
  | 'data_access_violation'

// ===========================================
// 보안 설정
// ===========================================

export interface SecurityConfig {
  // 인증 설정
  authentication: {
    required: boolean
    mfaEnabled: boolean
    sessionTimeout: number  // minutes
    maxSessions: number
  }

  // 권한 설정
  authorization: {
    defaultRole: string
    rbacEnabled: boolean
    policyEnforcement: 'strict' | 'permissive'
  }

  // 샌드박싱 설정
  sandboxing: {
    enabled: boolean
    defaultIsolation: IsolationLevel
    allowUnsafeApps: boolean
  }

  // 감사 설정
  auditing: {
    enabled: boolean
    logLevel: 'none' | 'minimal' | 'standard' | 'verbose'
    retentionDays: number
  }

  // 보안 기능
  features: {
    csrfProtection: boolean
    xssProtection: boolean
    clickjacking: boolean
    rateLimit: boolean
    ipWhitelist?: string[]
    ipBlacklist?: string[]
  }
}