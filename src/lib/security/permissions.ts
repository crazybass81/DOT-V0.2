// DOT Platform V0.2 - Permission Management System
// 권한 검증 미들웨어 및 권한 관리 시스템

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  Permission,
  PermissionCheck,
  PermissionCheckResult,
  Role,
  SecurityContext,
  ResourceType,
  ActionType,
  PermissionScope,
  UserRole
} from './types'

// ===========================================
// Permission Manager
// ===========================================

export class PermissionManager {
  private static instance: PermissionManager
  private permissionCache: Map<string, Permission[]> = new Map()
  private roleCache: Map<string, Role> = new Map()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager()
    }
    return PermissionManager.instance
  }

  // 권한 체크
  async checkPermission(
    check: PermissionCheck,
    context: SecurityContext
  ): Promise<PermissionCheckResult> {
    try {
      // 1. 슈퍼 관리자 체크
      if (this.isSuperAdmin(context)) {
        return {
          allowed: true,
          reason: 'Super admin has all permissions'
        }
      }

      // 2. 역할 기반 권한 체크
      const hasRolePermission = await this.checkRolePermissions(check, context)
      if (hasRolePermission.allowed) {
        return hasRolePermission
      }

      // 3. 직접 권한 체크
      const hasDirectPermission = await this.checkDirectPermissions(check, context)
      if (hasDirectPermission.allowed) {
        return hasDirectPermission
      }

      // 4. 정책 기반 체크
      const policyResult = await this.checkPolicies(check, context)
      if (policyResult.allowed) {
        return policyResult
      }

      // 권한 없음
      return {
        allowed: false,
        reason: 'No matching permission found',
        requiredPermissions: [this.createRequiredPermission(check)],
        suggestions: this.generateSuggestions(check, context)
      }
    } catch (error) {
      console.error('Permission check failed:', error)
      return {
        allowed: false,
        reason: 'Permission check error'
      }
    }
  }

  // 슈퍼 관리자 확인
  private isSuperAdmin(context: SecurityContext): boolean {
    return context.roles.some(role =>
      role.name === 'super_admin' || role.id === 'super_admin'
    )
  }

  // 역할 기반 권한 체크
  private async checkRolePermissions(
    check: PermissionCheck,
    context: SecurityContext
  ): Promise<PermissionCheckResult> {
    for (const role of context.roles) {
      const permissions = role.permissions || []

      for (const permission of permissions) {
        if (this.matchesPermission(permission, check)) {
          // 범위 체크
          if (check.scope && permission.scope) {
            const scopeMatch = await this.checkScope(
              permission.scope,
              check.scope,
              context
            )
            if (!scopeMatch) continue
          }

          return {
            allowed: true,
            reason: `Allowed by role: ${role.name}`,
            appliedPolicies: [role.id]
          }
        }
      }
    }

    return { allowed: false }
  }

  // 직접 권한 체크
  private async checkDirectPermissions(
    check: PermissionCheck,
    context: SecurityContext
  ): Promise<PermissionCheckResult> {
    for (const permission of context.permissions) {
      if (this.matchesPermission(permission, check)) {
        // 범위 체크
        if (check.scope && permission.scope) {
          const scopeMatch = await this.checkScope(
            permission.scope,
            check.scope,
            context
          )
          if (!scopeMatch) continue
        }

        return {
          allowed: true,
          reason: `Direct permission: ${permission.name}`,
          appliedPolicies: [permission.id]
        }
      }
    }

    return { allowed: false }
  }

  // 정책 기반 체크
  private async checkPolicies(
    check: PermissionCheck,
    context: SecurityContext
  ): Promise<PermissionCheckResult> {
    const applicablePolicies = context.policies.filter(policy =>
      policy.enabled && this.isPolicyApplicable(policy, context)
    )

    // 우선순위 순으로 정렬
    applicablePolicies.sort((a, b) => b.priority - a.priority)

    for (const policy of applicablePolicies) {
      for (const rule of policy.rules) {
        const conditionMet = await this.evaluatePolicyCondition(
          rule.condition,
          check,
          context
        )

        if (conditionMet) {
          if (rule.action.type === 'allow') {
            return {
              allowed: true,
              reason: `Allowed by policy: ${policy.name}`,
              appliedPolicies: [policy.id]
            }
          } else if (rule.action.type === 'deny') {
            return {
              allowed: false,
              reason: rule.message || `Denied by policy: ${policy.name}`,
              appliedPolicies: [policy.id]
            }
          }
        }
      }
    }

    return { allowed: false }
  }

  // 권한 매칭 확인
  private matchesPermission(
    permission: Permission,
    check: PermissionCheck
  ): boolean {
    // 리소스 체크
    if (permission.resource !== check.resource && permission.resource !== '*' as any) {
      return false
    }

    // 액션 체크
    if (permission.action !== check.action && permission.action !== '*') {
      return false
    }

    return true
  }

  // 범위 체크
  private async checkScope(
    permissionScope: PermissionScope,
    checkScope: PermissionScope,
    context: SecurityContext
  ): Promise<boolean> {
    // 범위 타입 우선순위: global > organization > team > own
    const scopePriority = {
      'global': 4,
      'organization': 3,
      'team': 2,
      'own': 1
    }

    const permPriority = scopePriority[permissionScope.type]
    const checkPriority = scopePriority[checkScope.type]

    // 권한 범위가 요구 범위보다 크거나 같으면 허용
    if (permPriority >= checkPriority) {
      // 추가 조건 체크
      if (permissionScope.conditions) {
        return this.evaluateConditions(
          permissionScope.conditions,
          context
        )
      }
      return true
    }

    return false
  }

  // 조건 평가
  private evaluateConditions(
    conditions: any[],
    context: SecurityContext
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, context)

      switch (condition.operator) {
        case 'eq':
          if (fieldValue !== condition.value) return false
          break
        case 'ne':
          if (fieldValue === condition.value) return false
          break
        case 'gt':
          if (!(fieldValue > condition.value)) return false
          break
        case 'lt':
          if (!(fieldValue < condition.value)) return false
          break
        case 'in':
          if (!condition.value.includes(fieldValue)) return false
          break
        case 'contains':
          if (!fieldValue?.includes?.(condition.value)) return false
          break
      }
    }

    return true
  }

  // 정책 적용 가능 여부 확인
  private isPolicyApplicable(
    policy: any,
    context: SecurityContext
  ): boolean {
    if (!policy.appliesTo || policy.appliesTo.length === 0) {
      return true // 모든 대상에 적용
    }

    for (const target of policy.appliesTo) {
      switch (target.type) {
        case 'all':
          return true
        case 'user':
          if (target.id === context.userId) return true
          break
        case 'role':
          if (context.roles.some(r => r.id === target.id)) return true
          break
      }
    }

    return false
  }

  // 정책 조건 평가
  private async evaluatePolicyCondition(
    condition: any,
    check: PermissionCheck,
    context: SecurityContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'permission':
        return this.matchesPermission(
          { resource: condition.value.resource, action: condition.value.action } as Permission,
          check
        )

      case 'resource':
        return check.resource === condition.value

      case 'time':
        return this.evaluateTimeCondition(condition)

      case 'custom':
        return this.evaluateCustomCondition(condition, context)

      default:
        return false
    }
  }

  // 시간 조건 평가
  private evaluateTimeCondition(condition: any): boolean {
    const now = new Date()
    const { start, end } = condition.value

    if (start && new Date(start) > now) return false
    if (end && new Date(end) < now) return false

    return true
  }

  // 커스텀 조건 평가
  private evaluateCustomCondition(
    condition: any,
    context: SecurityContext
  ): boolean {
    // 커스텀 로직 구현
    return true
  }

  // 필드 값 가져오기
  private getFieldValue(field: string, context: any): any {
    const parts = field.split('.')
    let value = context

    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) return null
    }

    return value
  }

  // 필요 권한 생성
  private createRequiredPermission(check: PermissionCheck): Permission {
    return {
      id: `required_${check.resource}_${check.action}`,
      name: `${check.resource}:${check.action}`,
      description: `Permission to ${check.action} ${check.resource}`,
      resource: check.resource,
      action: check.action,
      scope: check.scope
    }
  }

  // 제안 생성
  private generateSuggestions(
    check: PermissionCheck,
    context: SecurityContext
  ): string[] {
    const suggestions: string[] = []

    // 비슷한 권한 찾기
    const similarPermissions = context.permissions.filter(p =>
      p.resource === check.resource || p.action === check.action
    )

    if (similarPermissions.length > 0) {
      suggestions.push(
        `You have similar permissions: ${similarPermissions
          .map(p => p.name)
          .join(', ')}`
      )
    }

    // 역할 제안
    suggestions.push(
      'Contact your administrator to request this permission'
    )

    return suggestions
  }

  // 사용자 역할 로드
  async loadUserRoles(userId: string): Promise<Role[]> {
    const cacheKey = `roles_${userId}`
    const cached = this.roleCache.get(cacheKey)

    if (cached) {
      return [cached]
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name,
          description,
          permissions,
          is_system,
          priority
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to load user roles:', error)
      return []
    }

    const roles = data?.map(ur => ur.roles).filter(Boolean) || []

    // 캐시 저장
    roles.forEach(role => {
      this.roleCache.set(`role_${role.id}`, role)
    })

    return roles
  }

  // 사용자 권한 로드
  async loadUserPermissions(userId: string): Promise<Permission[]> {
    const cacheKey = `permissions_${userId}`
    const cached = this.permissionCache.get(cacheKey)

    if (cached) {
      return cached
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to load user permissions:', error)
      return []
    }

    const permissions = data || []

    // 캐시 저장
    this.permissionCache.set(cacheKey, permissions)
    setTimeout(() => {
      this.permissionCache.delete(cacheKey)
    }, this.cacheTimeout)

    return permissions
  }

  // 캐시 클리어
  clearCache(userId?: string) {
    if (userId) {
      this.permissionCache.delete(`permissions_${userId}`)
      this.roleCache.delete(`roles_${userId}`)
    } else {
      this.permissionCache.clear()
      this.roleCache.clear()
    }
  }
}

// ===========================================
// Permission Middleware
// ===========================================

export async function withPermission(
  resource: ResourceType,
  action: ActionType,
  handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const manager = PermissionManager.getInstance()

    // 보안 컨텍스트 생성
    const context: SecurityContext = {
      userId: session.user.id,
      sessionId: session.access_token,
      roles: await manager.loadUserRoles(session.user.id),
      permissions: await manager.loadUserPermissions(session.user.id),
      policies: [], // TODO: Load user policies
      timestamp: new Date()
    }

    // 권한 체크
    const checkResult = await manager.checkPermission(
      { resource, action },
      context
    )

    if (!checkResult.allowed) {
      return NextResponse.json(
        {
          error: 'Permission denied',
          reason: checkResult.reason,
          requiredPermissions: checkResult.requiredPermissions,
          suggestions: checkResult.suggestions
        },
        { status: 403 }
      )
    }

    // 핸들러 실행
    return handler(req, context)
  }
}

// ===========================================
// Permission Decorators (for class methods)
// ===========================================

export function RequirePermission(resource: ResourceType, action: ActionType) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Get context from first argument or this.context
      const context = args[0]?.context || this.context

      if (!context) {
        throw new Error('Security context required')
      }

      const manager = PermissionManager.getInstance()
      const checkResult = await manager.checkPermission(
        { resource, action },
        context
      )

      if (!checkResult.allowed) {
        throw new Error(`Permission denied: ${checkResult.reason}`)
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// ===========================================
// Permission Hooks (for React components)
// ===========================================

export function usePermission(
  resource: ResourceType,
  action: ActionType,
  scope?: PermissionScope
) {
  // This would be implemented as a React hook
  // For now, returning a placeholder
  return {
    hasPermission: false,
    loading: false,
    error: null
  }
}

// ===========================================
// Default Roles and Permissions
// ===========================================

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access',
    permissions: [
      {
        id: 'all',
        name: 'All Permissions',
        description: 'Complete system access',
        resource: '*' as ResourceType,
        action: '*'
      }
    ],
    isSystem: true,
    priority: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrative access',
    permissions: [],
    isSystem: true,
    priority: 900,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Developer access',
    permissions: [],
    isSystem: true,
    priority: 500,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user',
    name: 'User',
    description: 'Standard user access',
    permissions: [],
    isSystem: true,
    priority: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'guest',
    name: 'Guest',
    description: 'Limited guest access',
    permissions: [],
    isSystem: true,
    priority: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]