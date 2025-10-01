// DOT Platform V0.2 - App Error Boundary Component
// 앱 격리를 위한 에러 바운더리 컴포넌트

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import type { AppError, ErrorBoundaryState, ErrorRecoveryOptions } from '../../lib/platform/types'
import { platformEventManager } from '../../lib/platform/shell'

interface AppErrorBoundaryProps {
  appId: string
  children: ReactNode
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  onRecover?: () => void
  recoveryOptions?: Partial<ErrorRecoveryOptions>
}

const defaultRecoveryOptions: ErrorRecoveryOptions = {
  autoRecover: false,
  maxRetries: 3,
  retryDelay: 1000,
  showRetryButton: true,
  allowReload: true,
  allowSwitch: true,
  reportError: true,
  reportDetails: false
}

// 에러 아이콘 컴포넌트
const ErrorIcon = () => (
  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

const DetailsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

// 에러 상세 정보 컴포넌트
interface ErrorDetailsProps {
  error: AppError
  errorInfo: ErrorInfo
  isOpen: boolean
  onToggle: () => void
}

const ErrorDetails: React.FC<ErrorDetailsProps> = ({ error, errorInfo, isOpen, onToggle }) => {
  return (
    <div className="mt-6 w-full max-w-2xl">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1"
      >
        <DetailsIcon />
        <span>{isOpen ? '세부 정보 숨기기' : '세부 정보 보기'}</span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-left">
          <div className="space-y-4">
            {/* 에러 메시지 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">에러 메시지</h4>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800 font-mono break-all">{error.message}</p>
              </div>
            </div>

            {/* 에러 코드 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">에러 코드</h4>
              <p className="text-sm text-gray-600 font-mono">{error.code}</p>
            </div>

            {/* 발생 시간 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">발생 시간</h4>
              <p className="text-sm text-gray-600">
                {error.timestamp.toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>

            {/* 재시도 횟수 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">재시도 횟수</h4>
              <p className="text-sm text-gray-600">{error.retryCount}회</p>
            </div>

            {/* 스택 트레이스 */}
            {error.stack && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">스택 트레이스</h4>
                <div className="bg-gray-100 border rounded p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                </div>
              </div>
            )}

            {/* 컴포넌트 스택 */}
            {errorInfo.componentStack && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">컴포넌트 스택</h4>
                <div className="bg-gray-100 border rounded p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 에러 UI 컴포넌트
interface ErrorUIProps {
  appId: string
  error: AppError
  errorInfo: ErrorInfo
  recoveryOptions: ErrorRecoveryOptions
  onRetry: () => void
  onGoHome: () => void
  onReload: () => void
}

const ErrorUI: React.FC<ErrorUIProps> = ({
  appId,
  error,
  errorInfo,
  recoveryOptions,
  onRetry,
  onGoHome,
  onReload
}) => {
  const [showDetails, setShowDetails] = React.useState(false)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // 시각적 피드백
      onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorTitle = () => {
    switch (error.code) {
      case 'APP_LOAD_ERROR':
        return '앱을 불러올 수 없습니다'
      case 'APP_MOUNT_ERROR':
        return '앱을 실행할 수 없습니다'
      case 'APP_RUNTIME_ERROR':
        return '앱 실행 중 오류가 발생했습니다'
      case 'NETWORK_ERROR':
        return '네트워크 연결에 문제가 있습니다'
      case 'PERMISSION_ERROR':
        return '앱 실행 권한이 없습니다'
      default:
        return '앱에서 오류가 발생했습니다'
    }
  }

  const getErrorDescription = () => {
    if (!error.recoverable) {
      return '이 오류는 복구할 수 없습니다. 다른 앱을 선택하거나 페이지를 새로고침하세요.'
    }

    if (error.retryCount >= recoveryOptions.maxRetries) {
      return '최대 재시도 횟수에 도달했습니다. 페이지를 새로고침하거나 다른 앱을 선택하세요.'
    }

    return '일시적인 문제일 수 있습니다. 다시 시도하거나 페이지를 새로고침해보세요.'
  }

  const canRetry = error.recoverable &&
                   error.retryCount < recoveryOptions.maxRetries &&
                   recoveryOptions.showRetryButton

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md w-full space-y-6">
        {/* 에러 아이콘 */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ErrorIcon />
          </div>
        </div>

        {/* 에러 정보 */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">{getErrorTitle()}</h2>
          <p className="text-gray-600 leading-relaxed">{getErrorDescription()}</p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`
                inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isRetrying
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                }
              `}
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  재시도 중...
                </>
              ) : (
                <>
                  <RefreshIcon />
                  <span className="ml-2">다시 시도</span>
                </>
              )}
            </button>
          )}

          {recoveryOptions.allowSwitch && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <HomeIcon />
              <span className="ml-2">홈으로 가기</span>
            </button>
          )}

          {recoveryOptions.allowReload && (
            <button
              onClick={onReload}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <RefreshIcon />
              <span className="ml-2">페이지 새로고침</span>
            </button>
          )}
        </div>

        {/* 에러 세부 정보 */}
        <ErrorDetails
          error={error}
          errorInfo={errorInfo}
          isOpen={showDetails}
          onToggle={() => setShowDetails(!showDetails)}
        />

        {/* 추가 도움말 */}
        <div className="text-xs text-gray-500 border-t pt-4">
          문제가 계속 발생하면 시스템 관리자에게 문의하세요.
          <br />
          앱 ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{appId}</code>
        </div>
      </div>
    </div>
  )
}

// 메인 에러 바운더리 클래스
export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private recoveryOptions: ErrorRecoveryOptions

  constructor(props: AppErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }

    this.recoveryOptions = {
      ...defaultRecoveryOptions,
      ...props.recoveryOptions
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: {
        code: 'APP_RUNTIME_ERROR',
        message: error.message || '앱에서 알 수 없는 오류가 발생했습니다',
        stack: error.stack,
        timestamp: new Date(),
        recoverable: true,
        retryCount: 0
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError: AppError = this.state.error || {
      code: 'APP_RUNTIME_ERROR',
      message: error.message || '앱에서 알 수 없는 오류가 발생했습니다',
      stack: error.stack,
      timestamp: new Date(),
      recoverable: true,
      retryCount: 0
    }

    // 상태 업데이트
    this.setState({
      error: appError,
      errorInfo
    })

    // 에러 리포팅
    if (this.recoveryOptions.reportError) {
      this.reportError(appError, errorInfo)
    }

    // 콜백 호출
    if (this.props.onError) {
      this.props.onError(appError, errorInfo)
    }

    // 자동 복구 시도
    if (this.recoveryOptions.autoRecover && appError.recoverable) {
      this.scheduleAutoRecovery()
    }

    console.error(`[AppErrorBoundary] ${this.props.appId}에서 에러 발생:`, error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private reportError = (error: AppError, errorInfo: ErrorInfo) => {
    // 플랫폼 이벤트 발생
    platformEventManager.emit('app:error', {
      timestamp: new Date(),
      appId: this.props.appId,
      data: {
        error,
        errorInfo: this.recoveryOptions.reportDetails ? errorInfo : undefined
      }
    })

    // 실제 구현에서는 외부 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'development') {
      console.group(`[Error Report] ${this.props.appId}`)
      console.error('Error:', error)
      if (this.recoveryOptions.reportDetails) {
        console.error('Error Info:', errorInfo)
      }
      console.groupEnd()
    }
  }

  private scheduleAutoRecovery = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, this.recoveryOptions.retryDelay)
  }

  private handleRetry = () => {
    const { error } = this.state

    if (!error || !error.recoverable || error.retryCount >= this.recoveryOptions.maxRetries) {
      return
    }

    // 재시도 횟수 증가
    const updatedError = {
      ...error,
      retryCount: error.retryCount + 1
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // 복구 콜백 호출
    if (this.props.onRecover) {
      this.props.onRecover()
    }

    console.log(`[AppErrorBoundary] ${this.props.appId} 재시도 중... (${updatedError.retryCount}/${this.recoveryOptions.maxRetries})`)
  }

  private handleGoHome = () => {
    // 홈으로 이동하는 로직
    if (typeof window !== 'undefined') {
      window.location.hash = '#/home'
      window.location.reload()
    }
  }

  private handleReload = () => {
    // 페이지 새로고침
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      return (
        <ErrorUI
          appId={this.props.appId}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          recoveryOptions={this.recoveryOptions}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onReload={this.handleReload}
        />
      )
    }

    return this.props.children
  }
}

// HOC (Higher-Order Component) 제공
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  appId: string,
  options?: Partial<ErrorRecoveryOptions>
) {
  const WrappedComponent = (props: P) => (
    <AppErrorBoundary appId={appId} recoveryOptions={options}>
      <Component {...props} />
    </AppErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}