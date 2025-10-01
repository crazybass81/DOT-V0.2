'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  Database,
  Wifi,
  Bell,
  Folder,
  Terminal,
  Camera,
  Mic,
  MapPin,
  Share2,
  Settings,
  FileText,
  Activity,
  Clock,
  ChevronRight,
  X
} from 'lucide-react'
import type {
  Permission,
  AppPermission,
  ResourceType,
  ActionType,
  SecurityPolicy,
  AuditLog,
  SecurityEvent
} from '@/lib/security/types'

// ===========================================
// Permission Icons
// ===========================================

const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  app: <Terminal className="w-4 h-4" />,
  user: <Shield className="w-4 h-4" />,
  data: <Database className="w-4 h-4" />,
  api: <Wifi className="w-4 h-4" />,
  file: <Folder className="w-4 h-4" />,
  network: <Wifi className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  notification: <Bell className="w-4 h-4" />,
  storage: <Database className="w-4 h-4" />,
  camera: <Camera className="w-4 h-4" />,
  microphone: <Mic className="w-4 h-4" />,
  location: <MapPin className="w-4 h-4" />,
  clipboard: <FileText className="w-4 h-4" />,
  share: <Share2 className="w-4 h-4" />
}

const ACTION_LABELS: Record<ActionType, string> = {
  read: '읽기',
  write: '쓰기',
  create: '생성',
  update: '수정',
  delete: '삭제',
  execute: '실행',
  list: '목록',
  manage: '관리',
  '*': '전체'
}

// ===========================================
// Permission Request Dialog
// ===========================================

interface PermissionRequestDialogProps {
  appName: string
  appIcon?: string
  permissions: AppPermission[]
  onApprove: (permissions: AppPermission[]) => void
  onDeny: () => void
  onClose: () => void
}

export const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  appName,
  appIcon,
  permissions,
  onApprove,
  onDeny,
  onClose
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(permissions.filter(p => p.granted).map(p => `${p.resource}_${p.actions.join(',')}`))
  )

  const togglePermission = (key: string) => {
    const newSet = new Set(selectedPermissions)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setSelectedPermissions(newSet)
  }

  const handleApprove = () => {
    const approvedPermissions = permissions.map(p => ({
      ...p,
      granted: selectedPermissions.has(`${p.resource}_${p.actions.join(',')}`)
    }))
    onApprove(approvedPermissions)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {appIcon ? (
                <img src={appIcon} alt={appName} className="w-12 h-12 rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold dark:text-white">권한 요청</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{appName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Permission List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            이 앱이 다음 권한을 요청합니다:
          </p>

          <div className="space-y-3">
            {permissions.map(permission => {
              const key = `${permission.resource}_${permission.actions.join(',')}`
              const isSelected = selectedPermissions.has(key)

              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } cursor-pointer transition-colors`}
                  onClick={() => togglePermission(key)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                        {RESOURCE_ICONS[permission.resource]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm dark:text-white">
                            {permission.resource}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {permission.actions.map(action => (
                              <span
                                key={action}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded"
                              >
                                {ACTION_LABELS[action]}
                              </span>
                            ))}
                          </div>
                        </div>
                        {permission.reason && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {permission.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-current" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t dark:border-gray-800 flex justify-end space-x-3">
          <button
            onClick={onDeny}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            거부
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            허용
          </button>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Permission Settings Panel
// ===========================================

interface PermissionSettingsPanelProps {
  appId: string
  appName: string
  permissions: AppPermission[]
  onPermissionChange: (resource: ResourceType, actions: ActionType[], granted: boolean) => void
}

export const PermissionSettingsPanel: React.FC<PermissionSettingsPanelProps> = ({
  appId,
  appName,
  permissions,
  onPermissionChange
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="p-6 border-b dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white">앱 권한 설정</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{appName}</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {permissions.map(permission => (
            <div
              key={`${permission.resource}_${permission.actions.join(',')}`}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-400">
                  {RESOURCE_ICONS[permission.resource]}
                </div>
                <div>
                  <div className="font-medium text-sm dark:text-white">
                    {permission.resource}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    {permission.actions.map(action => (
                      <span
                        key={action}
                        className="px-2 py-1 text-xs bg-white dark:bg-gray-700 rounded"
                      >
                        {ACTION_LABELS[action]}
                      </span>
                    ))}
                  </div>
                  {permission.grantedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      허용됨: {new Date(permission.grantedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={permission.granted}
                  onChange={(e) => onPermissionChange(
                    permission.resource,
                    permission.actions,
                    e.target.checked
                  )}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Security Dashboard
// ===========================================

interface SecurityDashboardProps {
  policies: SecurityPolicy[]
  auditLogs: AuditLog[]
  securityEvents: SecurityEvent[]
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  policies,
  auditLogs,
  securityEvents
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'audit' | 'events'>('overview')

  // Security score calculation
  const calculateSecurityScore = () => {
    const enabledPolicies = policies.filter(p => p.enabled).length
    const totalPolicies = policies.length
    const recentEvents = securityEvents.filter(e =>
      e.severity === 'critical' || e.severity === 'error'
    ).length

    const score = Math.max(0, Math.min(100,
      (enabledPolicies / totalPolicies) * 100 - (recentEvents * 5)
    ))

    return Math.round(score)
  }

  const securityScore = calculateSecurityScore()

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/10'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold dark:text-white">보안 대시보드</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              시스템 보안 상태 및 정책 관리
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">보안 점수</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'policies'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            정책
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            감사 로그
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'events'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            보안 이벤트
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">활성 정책</p>
                    <p className="text-2xl font-bold dark:text-white mt-1">
                      {policies.filter(p => p.enabled).length}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">최근 이벤트</p>
                    <p className="text-2xl font-bold dark:text-white mt-1">
                      {securityEvents.length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">감사 로그</p>
                    <p className="text-2xl font-bold dark:text-white mt-1">
                      {auditLogs.length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-medium mb-3 dark:text-white">최근 활동</h4>
              <div className="space-y-2">
                {auditLogs.slice(0, 5).map(log => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {log.result === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium dark:text-white">{log.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {log.resource} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            {policies.map(policy => (
              <div
                key={policy.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${
                      policy.enabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {policy.enabled ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm dark:text-white">{policy.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        타입: {policy.type} • 우선순위: {policy.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {policy.rules.length} 규칙
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {log.result === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : log.result === 'denied' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm dark:text-white">{log.action}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${
                          log.result === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : log.result === 'denied'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {log.result}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        리소스: {log.resource}
                        {log.resourceId && ` (${log.resourceId})`}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {log.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.userId && ` • User: ${log.userId}`}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {securityEvents.map(event => (
              <div
                key={event.id}
                className={`p-4 rounded-lg ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {event.severity === 'critical' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : event.severity === 'error' ? (
                        <XCircle className="w-4 h-4" />
                      ) : event.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{event.type}</h4>
                        <span className="text-xs opacity-75">
                          {event.severity}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-90">{event.message}</p>
                      <p className="text-xs mt-2 opacity-70">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.userId && ` • User: ${event.userId}`}
                        {event.appId && ` • App: ${event.appId}`}
                      </p>
                    </div>
                  </div>
                  {!event.handled && (
                    <span className="px-2 py-1 text-xs bg-white/20 rounded">
                      미처리
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================================
// Export all components
// ===========================================

export default {
  PermissionRequestDialog,
  PermissionSettingsPanel,
  SecurityDashboard
}