// DOT Platform V0.2 - Security Policy Manager
// 보안 정책 관리 시스템

import { createClient } from '@/lib/supabase/server'
import type {
  SecurityPolicy,
  PolicyType,
  PolicyRule,
  PolicyCondition,
  PolicyAction,
  PolicyTarget,
  SecurityContext,
  SecurityEvent,
  SecurityEventType,
  AuditLog
} from './types'

// ===========================================
// Policy Manager
// ===========================================

export class PolicyManager {
  private static instance: PolicyManager
  private policies: Map<string, SecurityPolicy> = new Map()
  private policyCache: Map<string, SecurityPolicy[]> = new Map()
  private readonly cacheTimeout = 10 * 60 * 1000 // 10 minutes

  private constructor() {
    this.initializeDefaultPolicies()
  }

  static getInstance(): PolicyManager {
    if (!PolicyManager.instance) {
      PolicyManager.instance = new PolicyManager()
    }
    return PolicyManager.instance
  }

  // 기본 정책 초기화
  private initializeDefaultPolicies(): void {
    const defaultPolicies = this.createDefaultPolicies()
    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy)
    })
  }

  // 정책 평가
  async evaluatePolicy(
    policyId: string,
    context: SecurityContext,
    data?: any
  ): Promise<PolicyAction | null> {
    const policy = await this.getPolicy(policyId)
    if (!policy || !policy.enabled) {
      return null
    }

    // 정책 대상 확인
    if (!this.isPolicyApplicable(policy, context)) {
      return null
    }

    // 규칙 평가
    for (const rule of policy.rules) {
      const conditionMet = await this.evaluateCondition(
        rule.condition,
        context,
        data
      )

      if (conditionMet) {
        // 감사 로그 기록
        await this.logPolicyEvaluation(policy, rule, context, true)
        return rule.action
      }
    }

    return null
  }

  // 모든 적용 가능한 정책 평가
  async evaluateAllPolicies(
    context: SecurityContext,
    type?: PolicyType
  ): Promise<PolicyAction[]> {
    const applicablePolicies = await this.getApplicablePolicies(context, type)
    const actions: PolicyAction[] = []

    // 우선순위 순으로 정렬
    applicablePolicies.sort((a, b) => b.priority - a.priority)

    for (const policy of applicablePolicies) {
      const action = await this.evaluatePolicy(policy.id, context)
      if (action) {
        actions.push(action)

        // deny 액션은 즉시 중단
        if (action.type === 'deny') {
          break
        }
      }
    }

    return actions
  }

  // 조건 평가
  private async evaluateCondition(
    condition: PolicyCondition,
    context: SecurityContext,
    data?: any
  ): Promise<boolean> {
    switch (condition.type) {
      case 'permission':
        return this.evaluatePermissionCondition(condition, context)

      case 'resource':
        return this.evaluateResourceCondition(condition, data)

      case 'time':
        return this.evaluateTimeCondition(condition)

      case 'location':
        return this.evaluateLocationCondition(condition, context)

      case 'custom':
        return this.evaluateCustomCondition(condition, context, data)

      default:
        return false
    }
  }

  // 권한 조건 평가
  private evaluatePermissionCondition(
    condition: PolicyCondition,
    context: SecurityContext
  ): boolean {
    const requiredPermission = condition.value
    return context.permissions.some(p =>
      p.resource === requiredPermission.resource &&
      p.action === requiredPermission.action
    )
  }

  // 리소스 조건 평가
  private evaluateResourceCondition(
    condition: PolicyCondition,
    data?: any
  ): boolean {
    if (!data || !data.resource) return false

    switch (condition.operator) {
      case 'equals':
        return data.resource === condition.value
      case 'contains':
        return data.resource.includes(condition.value)
      case 'startsWith':
        return data.resource.startsWith(condition.value)
      case 'endsWith':
        return data.resource.endsWith(condition.value)
      default:
        return false
    }
  }

  // 시간 조건 평가
  private evaluateTimeCondition(condition: PolicyCondition): boolean {
    const now = new Date()
    const { start, end, daysOfWeek, hoursOfDay } = condition.value

    // 날짜 범위 체크
    if (start && new Date(start) > now) return false
    if (end && new Date(end) < now) return false

    // 요일 체크
    if (daysOfWeek && !daysOfWeek.includes(now.getDay())) {
      return false
    }

    // 시간 체크
    if (hoursOfDay) {
      const currentHour = now.getHours()
      if (!hoursOfDay.includes(currentHour)) {
        return false
      }
    }

    return true
  }

  // 위치 조건 평가
  private evaluateLocationCondition(
    condition: PolicyCondition,
    context: SecurityContext
  ): boolean {
    if (!context.ipAddress) return false

    const { allowedIps, blockedIps, allowedCountries } = condition.value

    // IP 체크
    if (blockedIps?.includes(context.ipAddress)) {
      return false
    }

    if (allowedIps && !allowedIps.includes(context.ipAddress)) {
      return false
    }

    // 국가 체크 (GeoIP 필요)
    // TODO: Implement GeoIP checking

    return true
  }

  // 커스텀 조건 평가
  private async evaluateCustomCondition(
    condition: PolicyCondition,
    context: SecurityContext,
    data?: any
  ): Promise<boolean> {
    // 커스텀 평가 로직
    const customEvaluator = this.getCustomEvaluator(condition.value.type)
    if (customEvaluator) {
      return customEvaluator(condition.value, context, data)
    }

    return false
  }

  // 정책 적용 가능 여부 확인
  private isPolicyApplicable(
    policy: SecurityPolicy,
    context: SecurityContext
  ): boolean {
    if (!policy.appliesTo || policy.appliesTo.length === 0) {
      return true // 모든 대상
    }

    for (const target of policy.appliesTo) {
      if (this.matchesTarget(target, context)) {
        return true
      }
    }

    return false
  }

  // 대상 매칭
  private matchesTarget(
    target: PolicyTarget,
    context: SecurityContext
  ): boolean {
    switch (target.type) {
      case 'all':
        return true

      case 'user':
        return target.id === context.userId

      case 'role':
        return context.roles.some(r => r.id === target.id)

      case 'app':
        // TODO: Check if context includes app information
        return false

      default:
        return false
    }
  }

  // 정책 가져오기
  async getPolicy(policyId: string): Promise<SecurityPolicy | null> {
    // 캐시 확인
    const cached = this.policies.get(policyId)
    if (cached) return cached

    // DB에서 로드
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('security_policies')
      .select('*')
      .eq('id', policyId)
      .single()

    if (error || !data) {
      console.error('Failed to load policy:', error)
      return null
    }

    // 캐시 저장
    this.policies.set(policyId, data)
    return data
  }

  // 적용 가능한 정책 가져오기
  async getApplicablePolicies(
    context: SecurityContext,
    type?: PolicyType
  ): Promise<SecurityPolicy[]> {
    const cacheKey = `policies_${context.userId}_${type || 'all'}`
    const cached = this.policyCache.get(cacheKey)

    if (cached) return cached

    const supabase = await createClient()
    let query = supabase
      .from('security_policies')
      .select('*')
      .eq('enabled', true)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to load policies:', error)
      return []
    }

    const applicablePolicies = (data || []).filter(policy =>
      this.isPolicyApplicable(policy, context)
    )

    // 캐시 저장
    this.policyCache.set(cacheKey, applicablePolicies)
    setTimeout(() => {
      this.policyCache.delete(cacheKey)
    }, this.cacheTimeout)

    return applicablePolicies
  }

  // 정책 생성
  async createPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    const supabase = await createClient()

    const newPolicy = {
      ...policy,
      id: this.generatePolicyId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const { data, error } = await supabase
      .from('security_policies')
      .insert(newPolicy)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create policy: ${error.message}`)
    }

    this.policies.set(data.id, data)
    this.clearCache()

    return data
  }

  // 정책 업데이트
  async updatePolicy(
    policyId: string,
    updates: Partial<SecurityPolicy>
  ): Promise<SecurityPolicy> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('security_policies')
      .update({
        ...updates,
        updatedAt: new Date()
      })
      .eq('id', policyId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update policy: ${error.message}`)
    }

    this.policies.set(policyId, data)
    this.clearCache()

    return data
  }

  // 정책 삭제
  async deletePolicy(policyId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('security_policies')
      .delete()
      .eq('id', policyId)

    if (error) {
      throw new Error(`Failed to delete policy: ${error.message}`)
    }

    this.policies.delete(policyId)
    this.clearCache()
  }

  // 감사 로그 기록
  private async logPolicyEvaluation(
    policy: SecurityPolicy,
    rule: PolicyRule,
    context: SecurityContext,
    matched: boolean
  ): Promise<void> {
    const auditLog: Omit<AuditLog, 'id'> = {
      timestamp: new Date(),
      userId: context.userId,
      sessionId: context.sessionId,
      action: `policy_evaluation`,
      resource: `policy:${policy.id}`,
      resourceId: rule.id,
      result: matched ? 'success' : 'failure',
      reason: rule.message,
      metadata: {
        policyName: policy.name,
        policyType: policy.type,
        ruleAction: rule.action.type,
        severity: rule.severity
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }

    await this.saveAuditLog(auditLog)
  }

  // 감사 로그 저장
  private async saveAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        ...log,
        id: this.generateLogId()
      })

    if (error) {
      console.error('Failed to save audit log:', error)
    }
  }

  // 보안 이벤트 기록
  async logSecurityEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('security_events')
      .insert({
        ...event,
        id: this.generateEventId()
      })

    if (error) {
      console.error('Failed to log security event:', error)
    }

    // 심각한 이벤트는 즉시 알림
    if (event.severity === 'critical') {
      await this.handleCriticalEvent(event)
    }
  }

  // 심각한 이벤트 처리
  private async handleCriticalEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    // 알림 발송
    console.error('CRITICAL SECURITY EVENT:', event)

    // TODO: Send notifications (email, Slack, etc.)
    // TODO: Trigger automatic response actions
  }

  // 커스텀 평가자 가져오기
  private getCustomEvaluator(type: string): any {
    const evaluators: Record<string, any> = {
      'rate_limit': this.evaluateRateLimit,
      'anomaly_detection': this.evaluateAnomaly,
      'risk_score': this.evaluateRiskScore
    }

    return evaluators[type]
  }

  // Rate limiting 평가
  private evaluateRateLimit = async (
    value: any,
    context: SecurityContext,
    data?: any
  ): Promise<boolean> => {
    // TODO: Implement rate limiting logic
    return true
  }

  // 이상 감지 평가
  private evaluateAnomaly = async (
    value: any,
    context: SecurityContext,
    data?: any
  ): Promise<boolean> => {
    // TODO: Implement anomaly detection logic
    return false
  }

  // 위험 점수 평가
  private evaluateRiskScore = async (
    value: any,
    context: SecurityContext,
    data?: any
  ): Promise<boolean> => {
    // TODO: Implement risk scoring logic
    return true
  }

  // 기본 정책 생성
  private createDefaultPolicies(): SecurityPolicy[] {
    return [
      {
        id: 'default_access_control',
        name: 'Default Access Control',
        type: 'access_control',
        rules: [
          {
            id: 'deny_unauthorized',
            condition: {
              type: 'permission',
              operator: 'not_exists',
              value: { resource: '*', action: '*' },
              combine: 'and'
            },
            action: {
              type: 'deny',
              params: {}
            },
            severity: 'error',
            message: 'Access denied - no permission'
          }
        ],
        priority: 100,
        enabled: true,
        appliesTo: [{ type: 'all' }],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rate_limiting',
        name: 'API Rate Limiting',
        type: 'network_security',
        rules: [
          {
            id: 'api_rate_limit',
            condition: {
              type: 'custom',
              operator: 'exceeds',
              value: { type: 'rate_limit', limit: 100, window: 60 },
              combine: 'and'
            },
            action: {
              type: 'rate_limit',
              params: { wait: 60 }
            },
            severity: 'warning',
            message: 'Rate limit exceeded'
          }
        ],
        priority: 500,
        enabled: true,
        appliesTo: [{ type: 'all' }],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'data_protection',
        name: 'Data Protection Policy',
        type: 'data_protection',
        rules: [
          {
            id: 'encrypt_sensitive',
            condition: {
              type: 'resource',
              operator: 'contains',
              value: 'sensitive',
              combine: 'and'
            },
            action: {
              type: 'require_mfa',
              params: {}
            },
            severity: 'info',
            message: 'MFA required for sensitive data'
          }
        ],
        priority: 800,
        enabled: true,
        appliesTo: [{ type: 'all' }],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  // ID 생성 유틸리티
  private generatePolicyId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 캐시 클리어
  private clearCache(): void {
    this.policyCache.clear()
  }
}

// Export singleton instance
export const policyManager = PolicyManager.getInstance()