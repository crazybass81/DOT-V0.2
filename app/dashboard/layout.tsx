export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">DOT Dashboard</h1>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900">
                대시보드
              </a>
              <a href="/dashboard/attendance" className="text-gray-700 hover:text-gray-900">
                출퇴근
              </a>
              <a href="/dashboard/schedule" className="text-gray-700 hover:text-gray-900">
                일정
              </a>
              <a href="/dashboard/payroll" className="text-gray-700 hover:text-gray-900">
                급여
              </a>
              <button className="text-gray-700 hover:text-gray-900">
                로그아웃
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 푸터 */}
      <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 DOT Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}