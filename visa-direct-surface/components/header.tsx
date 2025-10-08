import Image from "next/image"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/images/payments-again-logo.png"
            alt="Value Realization Framework"
            width={240}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#framework" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            The Framework
          </Link>
          <Link href="#thesis" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Our Thesis
          </Link>
          <Link href="#whitepaper" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Read the White Paper
          </Link>
        </nav>
      </div>
    </header>
  )
}
