import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Code } from "lucide-react"

export function InfoPanel() {
  return (
    <div className="space-y-6">
      {/* Intro Text */}
      <div className="text-gray-600 text-sm leading-relaxed">
        If you know what you're doing, you can grab these files and make your own apps for the conference. Share it with
        us on socials!
      </div>

      {/* Resource Buttons */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start h-auto p-4 bg-white hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <Download className="h-4 w-4 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">View Payments.txt</div>
              <div className="text-xs text-gray-500">High level short info about the conference and each track</div>
            </div>
          </div>
        </Button>

        <Button className="w-full justify-start h-auto p-4 bg-blue-600 hover:bg-blue-700">
          <div className="flex items-center space-x-3">
            <Download className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">View Payments-Full.txt</div>
              <div className="text-xs text-blue-100">Payments.txt + includes every talk and speaker</div>
            </div>
          </div>
        </Button>

        <Button variant="outline" className="w-full justify-start h-auto p-4 bg-gray-900 text-white hover:bg-gray-800">
          <div className="flex items-center space-x-3">
            <Code className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Official Payments API GitHub Repo</div>
              <div className="text-xs text-gray-400">API talks were accepted via Payment Protocol</div>
            </div>
          </div>
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-sm text-gray-600 leading-relaxed">
        <p className="mb-3">
          To import all sessions to your calendar, click this{" "}
          <a href="#" className="text-blue-600 hover:underline">
            iCal
          </a>{" "}
          link.
        </p>
        <p className="mb-3">
          For hackers:{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Get all sessions in JSON
          </a>{" "}
          (or{" "}
          <a href="#" className="text-blue-600 hover:underline">
            raw JSON
          </a>
          ) for your own payment-coded view, like{" "}
          <a href="#" className="text-blue-600 hover:underline">
            @cryptodev's app
          </a>{" "}
          (Tinder-style talk discovery) or{" "}
          <a href="#" className="text-blue-600 hover:underline">
            @fintechbro's app
          </a>{" "}
          (list+bookmarking) or{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Sarah Chen's app
          </a>
          or{" "}
          <a href="#" className="text-blue-600 hover:underline">
            @BlockchainBob's iOS TestFlight
          </a>{" "}
          (payment-coded).
        </p>
      </div>

      {/* Newsletter Signup */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Join our newsletter</h3>
          <p className="text-sm text-gray-600 mb-4">Subscribe to our newsletter and get notified for future events.</p>
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Subscribe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
