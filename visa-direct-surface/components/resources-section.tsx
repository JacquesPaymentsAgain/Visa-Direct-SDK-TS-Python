import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CreditCard, Zap, Shield, TrendingUp } from "lucide-react"

export function ResourcesSection() {
  return (
    <section className="py-12 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Will there be any sessions about Payment Security?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the latest in payment technologies, security protocols, and fintech innovations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CreditCard className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Digital Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore the future of digital transactions and mobile payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Real-time Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Learn about instant payment systems and high-frequency trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Security & Fraud</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Advanced security measures and fraud detection systems</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Blockchain & DeFi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Decentralized finance and cryptocurrency payment solutions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Newsletter Signup */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Join our newsletter</CardTitle>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter and get notified for future events.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input type="email" placeholder="Email address" className="flex-1" />
              <Button type="submit">Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
