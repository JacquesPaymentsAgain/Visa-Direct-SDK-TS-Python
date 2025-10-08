import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Footer() {
  const footerSections = [
    {
      title: "Framework",
      links: [
        { name: "The Four Stages", href: "#framework" },
        { name: "DX to PX Evolution", href: "#dx-px" },
        { name: "AI Integration", href: "#aix" },
        { name: "Agent Experience", href: "#ax" },
        { name: "Case Studies", href: "#case-studies" },
      ],
    },
    {
      title: "Research",
      links: [
        { name: "White Paper", href: "#whitepaper" },
        { name: "Our Thesis", href: "#thesis" },
        { name: "Industry Analysis", href: "#analysis" },
        { name: "Implementation Guide", href: "#guide" },
        { name: "Contact Us", href: "#contact" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#about" },
        { name: "Leadership", href: "#leadership" },
        { name: "Careers", href: "#careers" },
        { name: "Privacy Policy", href: "#privacy" },
        { name: "Terms of Service", href: "#terms" },
      ],
    },
  ]

  return (
    <footer className="border-t bg-white">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Image
              src="/images/payments-again-logo.png"
              alt="Value Realization Framework"
              width={180}
              height={36}
              className="h-7 w-auto"
            />
            <p className="text-sm text-gray-600">
              Pioneering the framework that bridges the gap between signed contracts and realized value in B2B software.
            </p>
            <div className="flex space-x-4">
              <a href="#linkedin" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#twitter" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-gray-600">© 2025 Your Company, Inc. All rights reserved.</p>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white">Download White Paper</Button>
        </div>
      </div>
    </footer>
  )
}
