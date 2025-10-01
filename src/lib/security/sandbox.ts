// DOT Platform V0.2 - App Sandboxing System
// 앱 격리 및 샌드박싱 시스템

import React from 'react'
import type {
  AppSandbox,
  IsolationLevel,
  AppPermission,
  ResourceLimits,
  NetworkPolicy,
  DataAccessPolicy,
  IframeOptions,
  ResourceType,
  ActionType
} from './types'
import { PermissionManager } from './permissions'
import type { LoadedApp } from '../platform/types'

// ===========================================
// Sandbox Manager
// ===========================================

export class SandboxManager {
  private static instance: SandboxManager
  private sandboxes: Map<string, AppSandbox> = new Map()
  private resourceMonitors: Map<string, ResourceMonitor> = new Map()

  private constructor() {}

  static getInstance(): SandboxManager {
    if (!SandboxManager.instance) {
      SandboxManager.instance = new SandboxManager()
    }
    return SandboxManager.instance
  }

  // 샌드박스 생성
  createSandbox(appId: string, config?: Partial<AppSandbox>): AppSandbox {
    const defaultSandbox: AppSandbox = {
      appId,
      isolation: config?.isolation || 'standard',
      permissions: config?.permissions || this.getDefaultPermissions(),
      resourceLimits: config?.resourceLimits || this.getDefaultResourceLimits(),
      networkPolicy: config?.networkPolicy || this.getDefaultNetworkPolicy(),
      dataAccess: config?.dataAccess || this.getDefaultDataAccessPolicy(),
      iframeOptions: config?.iframeOptions
    }

    const sandbox = { ...defaultSandbox, ...config }
    this.sandboxes.set(appId, sandbox)

    // 리소스 모니터 시작
    this.startResourceMonitoring(appId, sandbox.resourceLimits)

    return sandbox
  }

  // 샌드박스 가져오기
  getSandbox(appId: string): AppSandbox | null {
    return this.sandboxes.get(appId) || null
  }

  // 샌드박스 업데이트
  updateSandbox(appId: string, updates: Partial<AppSandbox>): void {
    const sandbox = this.sandboxes.get(appId)
    if (!sandbox) {
      throw new Error(`Sandbox not found for app: ${appId}`)
    }

    const updated = { ...sandbox, ...updates }
    this.sandboxes.set(appId, updated)

    // 리소스 제한 업데이트 시 모니터 재시작
    if (updates.resourceLimits) {
      this.restartResourceMonitoring(appId, updates.resourceLimits)
    }
  }

  // 샌드박스 삭제
  destroySandbox(appId: string): void {
    this.sandboxes.delete(appId)
    this.stopResourceMonitoring(appId)
  }

  // 권한 체크
  async checkAppPermission(
    appId: string,
    resource: ResourceType,
    action: ActionType
  ): Promise<boolean> {
    const sandbox = this.sandboxes.get(appId)
    if (!sandbox) return false

    // 격리 레벨 체크
    if (sandbox.isolation === 'none') {
      return true // 신뢰된 앱
    }

    // 권한 찾기
    const permission = sandbox.permissions.find(
      p => p.resource === resource && p.actions.includes(action)
    )

    return permission?.granted || false
  }

  // 네트워크 요청 검증
  validateNetworkRequest(appId: string, url: string): boolean {
    const sandbox = this.sandboxes.get(appId)
    if (!sandbox) return false

    const policy = sandbox.networkPolicy
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // HTTPS 강제
    if (policy.enforceHttps && urlObj.protocol !== 'https:') {
      return false
    }

    // 차단 도메인 체크
    if (policy.blockedDomains.some(blocked =>
      this.matchDomain(domain, blocked, policy.allowSubdomains)
    )) {
      return false
    }

    // 허용 도메인 체크
    if (policy.allowedDomains.length > 0) {
      return policy.allowedDomains.some(allowed =>
        this.matchDomain(domain, allowed, policy.allowSubdomains)
      )
    }

    return true
  }

  // 도메인 매칭
  private matchDomain(domain: string, pattern: string, allowSubdomains: boolean): boolean {
    if (domain === pattern) return true

    if (allowSubdomains) {
      return domain.endsWith(`.${pattern}`)
    }

    return false
  }

  // 데이터 접근 검증
  validateDataAccess(appId: string, collection: string, operation: string): boolean {
    const sandbox = this.sandboxes.get(appId)
    if (!sandbox) return false

    const policy = sandbox.dataAccess

    // 컬렉션 체크
    if (!policy.allowedCollections.includes(collection) &&
        !policy.allowedCollections.includes('*')) {
      return false
    }

    // 작업 체크
    if (!policy.allowedOperations.includes(operation as any)) {
      return false
    }

    return true
  }

  // 기본 권한
  private getDefaultPermissions(): AppPermission[] {
    return [
      {
        resource: 'data',
        actions: ['read'],
        granted: true
      },
      {
        resource: 'storage',
        actions: ['read', 'write'],
        granted: true
      },
      {
        resource: 'notification',
        actions: ['create'],
        granted: false
      }
    ]
  }

  // 기본 리소스 제한
  private getDefaultResourceLimits(): ResourceLimits {
    return {
      memory: 128,          // 128MB
      storage: 50,          // 50MB
      cpu: 25,             // 25%
      networkBandwidth: 1000, // 1MB/s
      apiCallsPerMinute: 100,
      maxExecutionTime: 30   // 30 seconds
    }
  }

  // 기본 네트워크 정책
  private getDefaultNetworkPolicy(): NetworkPolicy {
    return {
      allowedDomains: [],
      blockedDomains: [],
      allowSubdomains: true,
      enforceHttps: true,
      corsPolicy: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: false,
        maxAge: 86400
      }
    }
  }

  // 기본 데이터 접근 정책
  private getDefaultDataAccessPolicy(): DataAccessPolicy {
    return {
      allowedCollections: ['user_data'],
      allowedOperations: ['select', 'insert', 'update'],
      rowLevelSecurity: true,
      encryptionRequired: false,
      auditLogging: true
    }
  }

  // 리소스 모니터링 시작
  private startResourceMonitoring(appId: string, limits: ResourceLimits): void {
    const monitor = new ResourceMonitor(appId, limits)
    this.resourceMonitors.set(appId, monitor)
    monitor.start()
  }

  // 리소스 모니터링 재시작
  private restartResourceMonitoring(appId: string, limits: ResourceLimits): void {
    this.stopResourceMonitoring(appId)
    this.startResourceMonitoring(appId, limits)
  }

  // 리소스 모니터링 중지
  private stopResourceMonitoring(appId: string): void {
    const monitor = this.resourceMonitors.get(appId)
    if (monitor) {
      monitor.stop()
      this.resourceMonitors.delete(appId)
    }
  }

  // 샌드박스 컴포넌트 래퍼
  wrapComponent(app: LoadedApp): React.ComponentType<any> | null {
    if (!app.component) return null

    const sandbox = this.getSandbox(app.appId)
    if (!sandbox) return app.component

    switch (sandbox.isolation) {
      case 'none':
        return app.component

      case 'basic':
        return this.createBasicWrapper(app.component, sandbox)

      case 'standard':
        return this.createStandardWrapper(app.component, sandbox)

      case 'strict':
        return this.createStrictWrapper(app.component, sandbox)

      case 'maximum':
        return this.createMaximumWrapper(app.component, sandbox)

      default:
        return app.component
    }
  }

  // 기본 래퍼
  private createBasicWrapper(
    Component: React.ComponentType<any>,
    sandbox: AppSandbox
  ): React.ComponentType<any> {
    return (props: any) => {
      // 기본 격리: prop 필터링
      const filteredProps = this.filterProps(props, sandbox)
      return React.createElement(Component, filteredProps)
    }
  }

  // 표준 래퍼
  private createStandardWrapper(
    Component: React.ComponentType<any>,
    sandbox: AppSandbox
  ): React.ComponentType<any> {
    return (props: any) => {
      // 표준 격리: Error Boundary + prop 필터링
      const filteredProps = this.filterProps(props, sandbox)

      return React.createElement(
        SandboxErrorBoundary,
        { appId: sandbox.appId },
        React.createElement(Component, filteredProps)
      )
    }
  }

  // 엄격한 래퍼
  private createStrictWrapper(
    Component: React.ComponentType<any>,
    sandbox: AppSandbox
  ): React.ComponentType<any> {
    return (props: any) => {
      // 엄격한 격리: iframe 래퍼
      if (typeof window === 'undefined') {
        return null // SSR에서는 iframe 사용 불가
      }

      return React.createElement(IframeSandbox, {
        appId: sandbox.appId,
        component: Component,
        props: this.filterProps(props, sandbox),
        options: sandbox.iframeOptions
      })
    }
  }

  // 최대 래퍼
  private createMaximumWrapper(
    Component: React.ComponentType<any>,
    sandbox: AppSandbox
  ): React.ComponentType<any> {
    return (props: any) => {
      // 최대 격리: Web Worker + iframe
      if (typeof window === 'undefined') {
        return null
      }

      return React.createElement(WorkerSandbox, {
        appId: sandbox.appId,
        component: Component,
        props: this.filterProps(props, sandbox),
        options: sandbox.iframeOptions
      })
    }
  }

  // Props 필터링
  private filterProps(props: any, sandbox: AppSandbox): any {
    const filtered = { ...props }

    // 민감한 정보 제거
    delete filtered.apiToken
    delete filtered.privateKey
    delete filtered.secrets

    // 권한에 따른 필터링
    if (!this.checkAppPermission(sandbox.appId, 'api', 'execute')) {
      delete filtered.platformApi
    }

    return filtered
  }
}

// ===========================================
// Resource Monitor
// ===========================================

class ResourceMonitor {
  private appId: string
  private limits: ResourceLimits
  private interval: NodeJS.Timeout | null = null
  private metrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    apiCalls: 0,
    lastReset: Date.now()
  }

  constructor(appId: string, limits: ResourceLimits) {
    this.appId = appId
    this.limits = limits
  }

  start(): void {
    this.interval = setInterval(() => {
      this.checkResources()
    }, 1000) // 1초마다 체크
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private checkResources(): void {
    // 메모리 체크
    if (this.metrics.memoryUsage > this.limits.memory) {
      this.handleResourceViolation('memory')
    }

    // CPU 체크
    if (this.metrics.cpuUsage > this.limits.cpu) {
      this.handleResourceViolation('cpu')
    }

    // API 호출 제한 체크 (분당)
    const now = Date.now()
    if (now - this.metrics.lastReset > 60000) {
      this.metrics.apiCalls = 0
      this.metrics.lastReset = now
    }

    if (this.limits.apiCallsPerMinute &&
        this.metrics.apiCalls > this.limits.apiCallsPerMinute) {
      this.handleResourceViolation('api_rate')
    }
  }

  private handleResourceViolation(type: string): void {
    console.warn(`Resource violation for app ${this.appId}: ${type}`)

    // 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sandbox:resource-violation', {
        detail: {
          appId: this.appId,
          type,
          limits: this.limits,
          metrics: this.metrics
        }
      }))
    }
  }

  updateMetrics(metrics: Partial<typeof this.metrics>): void {
    Object.assign(this.metrics, metrics)
  }
}

// ===========================================
// Sandbox Components
// ===========================================

// Error Boundary for sandboxed apps
class SandboxErrorBoundary extends React.Component<
  { appId: string; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Sandbox error in app ${this.props.appId}:`, error, errorInfo)

    // 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sandbox:error', {
        detail: {
          appId: this.props.appId,
          error: error.message,
          stack: error.stack
        }
      }))
    }
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        className: 'sandbox-error',
        children: [
          React.createElement('h3', { key: 'title' }, 'App Error'),
          React.createElement('p', { key: 'message' },
            `The app encountered an error: ${this.state.error?.message}`
          )
        ]
      })
    }

    return this.props.children
  }
}

// Iframe Sandbox Component
const IframeSandbox: React.FC<{
  appId: string
  component: React.ComponentType<any>
  props: any
  options?: IframeOptions
}> = ({ appId, component, props, options }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  React.useEffect(() => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (!doc) return

    // iframe 내용 설정
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${options?.csp ? `<meta http-equiv="Content-Security-Policy" content="${options.csp}">` : ''}
          <style>
            body { margin: 0; padding: 0; }
            .sandbox-container { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="app-root" class="sandbox-container"></div>
          <script>
            // Sandbox communication bridge
            window.addEventListener('message', function(event) {
              // Handle messages from parent
            });
          </script>
        </body>
      </html>
    `

    doc.open()
    doc.write(html)
    doc.close()

    // TODO: Render component inside iframe
  }, [appId, options])

  const sandboxAttrs = options?.sandbox || [
    'allow-scripts',
    'allow-same-origin',
    'allow-forms'
  ]

  const allowAttrs = options?.allow || []

  return React.createElement('iframe', {
    ref: iframeRef,
    className: 'app-sandbox-iframe',
    sandbox: sandboxAttrs.join(' '),
    allow: allowAttrs.join('; '),
    style: {
      width: '100%',
      height: '100%',
      border: 'none'
    }
  })
}

// Worker Sandbox Component
const WorkerSandbox: React.FC<{
  appId: string
  component: React.ComponentType<any>
  props: any
  options?: IframeOptions
}> = ({ appId, component, props, options }) => {
  React.useEffect(() => {
    // TODO: Initialize Web Worker for maximum isolation
    // This would require a separate worker script
  }, [appId])

  // Fallback to iframe sandbox for now
  return React.createElement(IframeSandbox, {
    appId,
    component,
    props,
    options
  })
}

// ===========================================
// Sandbox Utilities
// ===========================================

export function getIsolationLevel(trustLevel: number): IsolationLevel {
  if (trustLevel >= 90) return 'none'
  if (trustLevel >= 70) return 'basic'
  if (trustLevel >= 50) return 'standard'
  if (trustLevel >= 30) return 'strict'
  return 'maximum'
}

export function validateSandboxConfig(config: Partial<AppSandbox>): boolean {
  // 검증 로직
  if (config.resourceLimits) {
    const limits = config.resourceLimits
    if (limits.memory < 0 || limits.memory > 2048) return false
    if (limits.cpu < 0 || limits.cpu > 100) return false
    if (limits.storage < 0 || limits.storage > 1000) return false
  }

  return true
}

// Export singleton instance
export const sandboxManager = SandboxManager.getInstance()