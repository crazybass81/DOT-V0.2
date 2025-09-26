export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          DOT Platform V0.2
        </h1>
        <p className="text-xl text-gray-600">
          레스토랑 관리 시스템
        </p>
        <div className="mt-8 space-x-4">
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
          >
            로그인
          </a>
          <a
            href="/signup"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            회원가입
          </a>
        </div>
      </div>
    </main>
  )
}