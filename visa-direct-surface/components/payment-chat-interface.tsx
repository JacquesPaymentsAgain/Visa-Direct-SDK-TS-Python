import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

export function PaymentChatInterface() {
  return (
    <div className="bg-gray-900 rounded-lg p-6 text-white min-h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-gray-700">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="font-medium">PAYMENTS AI</span>
        <span className="text-gray-400 text-sm">Ask me about payment systems, APIs, or the conference schedule</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 space-y-4 mb-6">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
            <div className="text-xs text-blue-200 mb-1">ME</div>
            <div className="text-sm">Who is building the next-generation payment infrastructure?</div>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-gray-800 text-white px-4 py-3 rounded-lg max-w-md">
            <div className="text-xs text-gray-400 mb-2">PAYMENTS AI</div>
            <div className="text-sm leading-relaxed">
              Several companies are pioneering next-gen payment infrastructure including Stripe with their global
              payment platform, Square with point-of-sale innovations, and emerging blockchain-based solutions. The
              focus is on real-time processing, lower fees, and better developer experiences.
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
            <div className="text-xs text-blue-200 mb-1">ME</div>
            <div className="text-sm">Can you tell me about cryptocurrency payment integration?</div>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-gray-800 text-white px-4 py-3 rounded-lg max-w-md">
            <div className="text-xs text-gray-400 mb-2">PAYMENTS AI</div>
            <div className="text-sm leading-relaxed">
              Crypto payment integration involves connecting traditional payment systems with blockchain networks. Key
              considerations include wallet connectivity, transaction fees, settlement times, and regulatory compliance.
              Popular solutions include Coinbase Commerce, BitPay, and custom Web3 integrations.
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Ask about payment systems, fintech trends, or APIs..."
          className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Button size="icon" className="bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Powered by <span className="text-white">PaymentGPT X5</span> from{" "}
          <span className="text-white">FinTech Labs</span> and <span className="text-white">CryptoChain</span>
        </p>
      </div>
    </div>
  )
}
