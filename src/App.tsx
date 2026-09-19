import { Link, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
        Parut frontend
      </p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
        서비스 화면을 만들어갈 준비가 됐어요.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
        React, Vite, TypeScript, Axios, TanStack Query, React Router, Tailwind CSS 기반의 프론트엔드
        프로젝트입니다.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/health"
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          기본 라우팅 확인
        </Link>
      </div>
    </main>
  )
}

function HealthPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8">
      <p className="text-sm font-semibold text-emerald-600">READY</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
        라우팅이 정상적으로 동작합니다.
      </h1>
      <Link to="/" className="mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        홈으로 돌아가기 →
      </Link>
    </main>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6 sm:px-8">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-950">
            parut
          </Link>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
    </div>
  )
}

export default App
