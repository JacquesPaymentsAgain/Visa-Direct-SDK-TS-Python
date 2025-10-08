const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? 'https://visa-direct-docs.vercel.app/quickstart'
const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://visa-direct-surface.vercel.app/dashboard'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4 py-8">
      <div className="text-center max-w-5xl mx-auto">
        <div className="mb-16">
          <div className="h-20 w-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white font-bold text-3xl">V</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
          Build on Visa Direct with confidence
        </h1>

        <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-8 leading-relaxed max-w-4xl mx-auto">
          Production-grade dual-language SDKs with unified orchestration framework, comprehensive DevX platform, and professional documentation.
        </p>

        <p className="text-base sm:text-lg text-slate-400 mb-16 leading-relaxed max-w-3xl mx-auto">
          TypeScript and Python SDKs with identical APIs, built for production scale with security by default.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 inline-block"
          >
            Get Started
          </a>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-700 hover:bg-slate-600 text-white px-12 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 inline-block"
          >
            Open Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
