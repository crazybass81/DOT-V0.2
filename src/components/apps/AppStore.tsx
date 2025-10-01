'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { App } from '../../lib/database/types'
import type {
  AppStoreState,
  AppSearchFilters,
  AppCategory,
  AppInstallProgress
} from '../../lib/platform/types'
import { appRegistryService } from '../../lib/platform/app-registry'

// ===========================================
// AppStore 메인 컴포넌트
// ===========================================

interface AppStoreProps {
  isOpen: boolean
  onClose: () => void
  onInstallApp: (appId: string) => Promise<void>
  onUninstallApp: (appId: string) => Promise<void>
  installedApps: Set<string>
  installingApps: Map<string, AppInstallProgress>
}

export default function AppStore({
  isOpen,
  onClose,
  onInstallApp,
  onUninstallApp,
  installedApps,
  installingApps
}: AppStoreProps) {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'category' | 'app-detail' | 'installed'>('home')
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<App[]>([])
  const [featuredApps, setFeaturedApps] = useState<App[]>([])
  const [popularApps, setPopularApps] = useState<App[]>([])
  const [categories] = useState<AppCategory[]>([
    { id: 'productivity', name: 'productivity', display_name_ko: '생산성', app_count: 0, sort_order: 1 },
    { id: 'communication', name: 'communication', display_name_ko: '커뮤니케이션', app_count: 0, sort_order: 2 },
    { id: 'entertainment', name: 'entertainment', display_name_ko: '엔터테인먼트', app_count: 0, sort_order: 3 },
    { id: 'business', name: 'business', display_name_ko: '비즈니스', app_count: 0, sort_order: 4 },
    { id: 'developer', name: 'developer', display_name_ko: '개발도구', app_count: 0, sort_order: 5 },
    { id: 'system', name: 'system', display_name_ko: '시스템', app_count: 0, sort_order: 6 }
  ])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchFilters, setSearchFilters] = useState<AppSearchFilters>({
    sortBy: 'popularity',
    limit: 20
  })

  // 초기 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  // 검색 실행
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setSearchResults([])
      setCurrentView('home')
    }
  }, [searchQuery, searchFilters])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [featured, popular] = await Promise.all([
        appRegistryService.getFeaturedApps(),
        appRegistryService.getPopularApps()
      ])
      setFeaturedApps(featured)
      setPopularApps(popular)
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const results = await appRegistryService.searchApps(searchQuery, searchFilters)
      setSearchResults(results)
      setCurrentView('search')
    } catch (error) {
      console.error('검색 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryApps = async (category: string) => {
    setLoading(true)
    try {
      const results = await appRegistryService.getAppsByCategory(category)
      setSearchResults(results)
      setSelectedCategory(category)
      setCurrentView('category')
    } catch (error) {
      console.error('카테고리 앱 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAppSelect = (app: App) => {
    setSelectedApp(app)
    setCurrentView('app-detail')
  }

  const handleBack = () => {
    if (currentView === 'app-detail') {
      setCurrentView('home')
      setSelectedApp(null)
    } else if (currentView === 'category') {
      setCurrentView('home')
      setSelectedCategory(null)
    } else if (currentView === 'search') {
      setSearchQuery('')
      setCurrentView('home')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">

        {/* 헤더 */}
        <AppStoreHeader
          onClose={onClose}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentView={currentView}
          selectedCategory={selectedCategory}
          categories={categories}
          onBack={handleBack}
        />

        {/* 메인 콘텐츠 */}
        <div className="flex h-full">

          {/* 사이드바 */}
          <AppStoreSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            currentView={currentView}
            onCategorySelect={loadCategoryApps}
            onViewChange={setCurrentView}
          />

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {currentView === 'home' && (
                  <AppStoreHome
                    featuredApps={featuredApps}
                    popularApps={popularApps}
                    onAppSelect={handleAppSelect}
                    installedApps={installedApps}
                    installingApps={installingApps}
                    onInstallApp={onInstallApp}
                    onUninstallApp={onUninstallApp}
                  />
                )}

                {(currentView === 'search' || currentView === 'category') && (
                  <AppGrid
                    apps={searchResults}
                    onAppSelect={handleAppSelect}
                    installedApps={installedApps}
                    installingApps={installingApps}
                    onInstallApp={onInstallApp}
                    onUninstallApp={onUninstallApp}
                  />
                )}

                {currentView === 'app-detail' && selectedApp && (
                  <AppDetail
                    app={selectedApp}
                    isInstalled={installedApps.has(selectedApp.app_id)}
                    installProgress={installingApps.get(selectedApp.app_id)}
                    onInstallApp={onInstallApp}
                    onUninstallApp={onUninstallApp}
                    onBack={handleBack}
                  />
                )}

                {currentView === 'installed' && (
                  <InstalledAppsView
                    installedApps={installedApps}
                    onAppSelect={handleAppSelect}
                    onUninstallApp={onUninstallApp}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// 헤더 컴포넌트
// ===========================================

interface AppStoreHeaderProps {
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  currentView: string
  selectedCategory: string | null
  categories: AppCategory[]
  onBack: () => void
}

function AppStoreHeader({
  onClose,
  searchQuery,
  onSearchChange,
  currentView,
  selectedCategory,
  categories,
  onBack
}: AppStoreHeaderProps) {
  const getTitle = () => {
    switch (currentView) {
      case 'search':
        return `검색 결과: "${searchQuery}"`
      case 'category':
        const category = categories.find(c => c.id === selectedCategory)
        return category?.display_name_ko || '카테고리'
      case 'app-detail':
        return '앱 상세정보'
      case 'installed':
        return '설치된 앱'
      default:
        return 'DOT 앱 스토어'
    }
  }

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center space-x-4">
        {currentView !== 'home' && (
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* 검색바 */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="앱 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

// ===========================================
// 사이드바 컴포넌트
// ===========================================

interface AppStoreSidebarProps {
  categories: AppCategory[]
  selectedCategory: string | null
  currentView: string
  onCategorySelect: (category: string) => void
  onViewChange: (view: 'home' | 'installed') => void
}

function AppStoreSidebar({
  categories,
  selectedCategory,
  currentView,
  onCategorySelect,
  onViewChange
}: AppStoreSidebarProps) {
  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">

      {/* 네비게이션 메뉴 */}
      <div className="space-y-2 mb-8">
        <button
          onClick={() => onViewChange('home')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            currentView === 'home'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <HomeIcon className="inline w-4 h-4 mr-2" />
          홈
        </button>

        <button
          onClick={() => onViewChange('installed')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            currentView === 'installed'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <CheckCircleIcon className="inline w-4 h-4 mr-2" />
          설치된 앱
        </button>
      </div>

      {/* 카테고리 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          카테고리
        </h3>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category.display_name_ko}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===========================================
// 홈 뷰 컴포넌트
// ===========================================

interface AppStoreHomeProps {
  featuredApps: App[]
  popularApps: App[]
  onAppSelect: (app: App) => void
  installedApps: Set<string>
  installingApps: Map<string, AppInstallProgress>
  onInstallApp: (appId: string) => Promise<void>
  onUninstallApp: (appId: string) => Promise<void>
}

function AppStoreHome({
  featuredApps,
  popularApps,
  onAppSelect,
  installedApps,
  installingApps,
  onInstallApp,
  onUninstallApp
}: AppStoreHomeProps) {
  return (
    <div className="p-6 space-y-8">
      {/* 추천 앱 */}
      {featuredApps.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">추천 앱</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredApps.slice(0, 6).map((app) => (
              <AppCard
                key={app.app_id}
                app={app}
                onSelect={onAppSelect}
                isInstalled={installedApps.has(app.app_id)}
                installProgress={installingApps.get(app.app_id)}
                onInstallApp={onInstallApp}
                onUninstallApp={onUninstallApp}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      {/* 인기 앱 */}
      {popularApps.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">인기 앱</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularApps.slice(0, 8).map((app) => (
              <AppCard
                key={app.app_id}
                app={app}
                onSelect={onAppSelect}
                isInstalled={installedApps.has(app.app_id)}
                installProgress={installingApps.get(app.app_id)}
                onInstallApp={onInstallApp}
                onUninstallApp={onUninstallApp}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ===========================================
// 앱 그리드 컴포넌트
// ===========================================

interface AppGridProps {
  apps: App[]
  onAppSelect: (app: App) => void
  installedApps: Set<string>
  installingApps: Map<string, AppInstallProgress>
  onInstallApp: (appId: string) => Promise<void>
  onUninstallApp: (appId: string) => Promise<void>
}

function AppGrid({
  apps,
  onAppSelect,
  installedApps,
  installingApps,
  onInstallApp,
  onUninstallApp
}: AppGridProps) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <SearchIcon className="w-12 h-12 mb-4" />
        <p>앱을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apps.map((app) => (
          <AppCard
            key={app.app_id}
            app={app}
            onSelect={onAppSelect}
            isInstalled={installedApps.has(app.app_id)}
            installProgress={installingApps.get(app.app_id)}
            onInstallApp={onInstallApp}
            onUninstallApp={onUninstallApp}
          />
        ))}
      </div>
    </div>
  )
}

// ===========================================
// 앱 카드 컴포넌트
// ===========================================

interface AppCardProps {
  app: App
  onSelect: (app: App) => void
  isInstalled: boolean
  installProgress?: AppInstallProgress
  onInstallApp: (appId: string) => Promise<void>
  onUninstallApp: (appId: string) => Promise<void>
  variant?: 'default' | 'featured'
}

function AppCard({
  app,
  onSelect,
  isInstalled,
  installProgress,
  onInstallApp,
  onUninstallApp,
  variant = 'default'
}: AppCardProps) {
  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInstalled) {
      onUninstallApp(app.app_id)
    } else {
      onInstallApp(app.app_id)
    }
  }

  const isInstalling = installProgress?.status === 'downloading' ||
                      installProgress?.status === 'installing' ||
                      installProgress?.status === 'configuring'

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
        variant === 'featured' ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
      }`}
      onClick={() => onSelect(app)}
    >
      {/* 앱 아이콘 및 기본 정보 */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          {app.icon || app.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {app.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {app.developer}
          </p>

          {/* 평점 */}
          <div className="flex items-center mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(app.average_rating || 0)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              ({app.review_count || 0})
            </span>
          </div>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
        {app.description}
      </p>

      {/* 태그 */}
      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {app.tags.slice(0, 3).map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 설치 버튼 */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {app.price === 0 ? (
            <span className="text-green-600 dark:text-green-400 font-medium">무료</span>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              ₩{app.price?.toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isInstalled
              ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300'
              : isInstalling
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {isInstalling ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>{Math.round(installProgress?.progress || 0)}%</span>
            </div>
          ) : isInstalled ? (
            '제거'
          ) : (
            '설치'
          )}
        </button>
      </div>
    </div>
  )
}

// ===========================================
// 앱 상세정보 컴포넌트
// ===========================================

interface AppDetailProps {
  app: App
  isInstalled: boolean
  installProgress?: AppInstallProgress
  onInstallApp: (appId: string) => Promise<void>
  onUninstallApp: (appId: string) => Promise<void>
  onBack: () => void
}

function AppDetail({
  app,
  isInstalled,
  installProgress,
  onInstallApp,
  onUninstallApp,
  onBack
}: AppDetailProps) {
  const handleInstallClick = () => {
    if (isInstalled) {
      onUninstallApp(app.app_id)
    } else {
      onInstallApp(app.app_id)
    }
  }

  const isInstalling = installProgress?.status === 'downloading' ||
                      installProgress?.status === 'installing' ||
                      installProgress?.status === 'configuring'

  return (
    <div className="p-6">
      {/* 앱 헤더 */}
      <div className="flex items-start space-x-6 mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
          {app.icon || app.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {app.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            {app.developer}
          </p>

          {/* 평점 및 통계 */}
          <div className="flex items-center space-x-6 mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(app.average_rating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {app.average_rating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({app.review_count || 0}개 리뷰)
              </span>
            </div>

            <div className="text-gray-500 dark:text-gray-400">
              {app.install_count?.toLocaleString() || 0}회 설치
            </div>
          </div>

          {/* 설치 버튼 */}
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              isInstalled
                ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300'
                : isInstalling
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
          >
            {isInstalling ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>설치 중... {Math.round(installProgress?.progress || 0)}%</span>
              </div>
            ) : isInstalled ? (
              '앱 제거'
            ) : app.price === 0 ? (
              '무료 설치'
            ) : (
              `₩${app.price?.toLocaleString()} 구매 후 설치`
            )}
          </button>
        </div>
      </div>

      {/* 앱 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* 설명 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              앱 설명
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {app.description}
            </p>
          </section>

          {/* 스크린샷 (추후 구현) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              스크린샷
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-64 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center"
                >
                  <span className="text-gray-500 dark:text-gray-400">스크린샷 {i}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* 앱 정보 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              정보
            </h2>
            <div className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">버전</dt>
                <dd className="text-gray-900 dark:text-white">{app.version}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">카테고리</dt>
                <dd className="text-gray-900 dark:text-white">{app.category}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">크기</dt>
                <dd className="text-gray-900 dark:text-white">약 {Math.floor(Math.random() * 10) + 1}MB</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">업데이트</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(app.updated_at || app.created_at).toLocaleDateString('ko-KR')}
                </dd>
              </div>
            </div>
          </section>

          {/* 태그 */}
          {app.tags && app.tags.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                태그
              </h2>
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ===========================================
// 설치된 앱 뷰 컴포넌트
// ===========================================

interface InstalledAppsViewProps {
  installedApps: Set<string>
  onAppSelect: (app: App) => void
  onUninstallApp: (appId: string) => Promise<void>
}

function InstalledAppsView({
  installedApps,
  onAppSelect,
  onUninstallApp
}: InstalledAppsViewProps) {
  return (
    <div className="p-6">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p>설치된 앱을 표시하는 기능은 곧 구현됩니다.</p>
        <p className="text-sm mt-2">현재 {installedApps.size}개의 앱이 설치되어 있습니다.</p>
      </div>
    </div>
  )
}

// ===========================================
// 로딩 스피너 컴포넌트
// ===========================================

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

// ===========================================
// 아이콘 컴포넌트들 (Heroicons 대체)
// ===========================================

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)