import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            From Signed Contract
            <br />
            <span className="text-gray-700">to Realized Value.</span>
          </h1>
          <p className="text-xl text-gray-600 mt-6 max-w-4xl mx-auto leading-relaxed">
            For decades, a silent gap has defined B2B software: the chasm between a closed deal and a successful,
            revenue-generating customer. This is the value realization gap.
          </p>
          <p className="text-lg text-gray-800 mt-4 font-medium">
            We've created a new framework to understand and conquer it.
          </p>
          <div className="mt-8">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
              Explore the Framework
            </Button>
          </div>
        </div>

        <div className="space-y-24">
          {/* Problem Section */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              The "Sign-Not-Live" Chasm is a Systemic Failure.
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-4xl mx-auto">
              The industry has long treated stalled deals as an implementation detail. It's a strategic crisis. It's the
              compounding interest of misaligned teams, technical friction, and broken workflows.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Delayed Value</h3>
                <p className="text-gray-600">
                  Enterprise deals stall for months, stuck in a maze of security, legal, and operational reviews that
                  negate the initial sales momentum.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Organizational Silos</h3>
                <p className="text-gray-600">
                  Success depends on a complex "buying group," yet we provide tools for only one of them: the developer.
                  This leaves product, compliance, and legal teams unguided and unequipped.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Unrealized Potential</h3>
                <p className="text-gray-600">
                  The ultimate cost is not just lost revenue, but eroded trust and a failure to deliver on the
                  fundamental promise of technology.
                </p>
              </div>
            </div>
          </div>

          {/* Framework Section */}
          <div id="framework" className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              A Unified Framework for Value Realization.
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-4xl mx-auto">
              The journey from contract to cash is not a single path, but an evolutionary process. Our research has
              codified this into four distinct stages of maturity. Understanding where you are is the first step to
              getting where you need to go.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. The Classic Approach (DX)</h3>
                <p className="text-sm text-gray-600">
                  The foundation. An intense focus on Developer Experience and Product-Led Growth to solve the core
                  technical integration bottleneck. Necessary, but insufficient for the modern enterprise.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. The Modern Approach (PX)</h3>
                <p className="text-sm text-gray-600">
                  The evolution. A holistic view of Product Experience that orchestrates the entire multi-stakeholder
                  team—from developer to CISO to product manager—towards a shared business outcome.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. The Frontier Approach (AIX)</h3>
                <p className="text-sm text-gray-600">
                  The scaling factor. Embedding AI as a foundational primitive to automate workflows and scale the
                  high-touch expertise required for complex onboarding, making it efficient and repeatable.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. The Agent Experience (AX)</h3>
                <p className="text-sm text-gray-600">
                  The horizon. A future where autonomous AI agents, not humans, are the primary consumers of APIs,
                  enabling a new paradigm of zero-touch, autonomous integration.
                </p>
              </div>
            </div>
          </div>

          {/* Thesis Section */}
          <div id="thesis" className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Beyond the Developer.</h2>
            <div className="max-w-4xl mx-auto text-lg text-gray-600 space-y-6">
              <p>
                For too long, we believed the path to value was paved with perfect documentation and elegant SDKs. We
                optimized for the developer, the builder of the technical solution.
              </p>
              <p className="text-xl font-medium text-gray-800">But the builder is not the only actor.</p>
              <p>
                A successful go-live is an act of organizational change, requiring buy-in from{" "}
                <strong>The Product Leader</strong> who must align the solution with the user journey,{" "}
                <strong>The Go-to-Market Leader</strong> who is accountable for predictable revenue, and{" "}
                <strong>The Executive Team</strong> that needs to see a clear return on their investment.
              </p>
              <p>
                A true solution must serve them all. It must provide a single pane of glass that connects the technical
                reality of the code with the strategic imperatives of the business.
              </p>
            </div>
          </div>

          {/* Vision Section */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              The Future of Integration is Autonomous.
            </h2>
            <div className="max-w-4xl mx-auto text-lg text-gray-600 space-y-6">
              <p>Today, we use AI to assist humans. Tomorrow, AI agents will be the primary consumers of your API.</p>
              <p>
                This shift to an <strong>Agent Experience (AX)</strong> is inevitable. It demands a new kind of platform
                architecture—one built not just to be human-friendly, but machine-consumable. The next generation of
                market leaders will be those who design for this autonomous future, turning their products into
                fundamental building blocks for a new, intelligent economy.
              </p>
            </div>
          </div>

          {/* Final CTA */}
          <div id="whitepaper" className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Explore Our Research.</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              This framework is the foundation of our work. Dive deeper into the data, case studies, and strategic
              implications in our full white paper.
            </p>
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
              Read the Full White Paper
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
