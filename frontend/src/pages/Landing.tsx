import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  DollarSign, 
  ChevronRight,
  BarChart3,
  Lock,
  Clock
} from "lucide-react";

const Landing = () => {
  const [amount, setAmount] = useState("10000");
  const dailyRate = 0.05; // 5% daily interest
  
  const calculateReturns = (principal: number) => {
    const daily = principal * (dailyRate / 100);
    const monthly = daily * 30;
    const yearly = daily * 365;
    return { daily, monthly, yearly };
  };

  const returns = calculateReturns(parseFloat(amount) || 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-secondary" />
            <span className="font-bold text-xl">GrowthFund</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-secondary transition-colors">Features</a>
            <a href="#calculator" className="text-sm font-medium hover:text-secondary transition-colors">Calculator</a>
            <a href="#faq" className="text-sm font-medium hover:text-secondary transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-secondary shadow-glow">
                Get Started <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground">
              Grow Your Wealth with Daily Returns
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
              Earn consistent daily interest on your investments. Secure, transparent, and designed for growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-lg px-8">
                  Start Earning Today
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8">
                View Demo
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-accent">{dailyRate}%</div>
                <div className="text-sm text-primary-foreground/80">Daily Interest</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">$10M+</div>
                <div className="text-sm text-primary-foreground/80">Assets Under Management</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">50K+</div>
                <div className="text-sm text-primary-foreground/80">Active Investors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose GrowthFund?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for modern investors who demand transparency, security, and consistent returns.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Daily Returns</CardTitle>
                <CardDescription>
                  Earn {dailyRate}% daily interest on your balance, automatically calculated and credited every 24 hours.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Bank-Level Security</CardTitle>
                <CardDescription>
                  Your funds are protected with email OTP verification, encrypted storage, and multi-layer authentication.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Instant Liquidity</CardTitle>
                <CardDescription>
                  Deposit and withdraw anytime with OTP confirmation. Your money, your control, always available.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>24/7 Access</CardTitle>
                <CardDescription>
                  Monitor your portfolio, track interest, and manage transactions around the clock from any device.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>OTP Protection</CardTitle>
                <CardDescription>
                  Every deposit and withdrawal requires email OTP verification for maximum account security.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>No Hidden Fees</CardTitle>
                <CardDescription>
                  What you see is what you get. Transparent pricing with no surprise charges or management fees.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="calculator" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Calculate Your Returns</h2>
              <p className="text-lg text-muted-foreground">
                See how much you could earn with our consistent daily interest rate
              </p>
            </div>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>ROI Calculator</CardTitle>
                <CardDescription>Enter your investment amount to see potential returns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Investment Amount ($)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="text-lg"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Daily Return</div>
                    <div className="text-2xl font-bold text-secondary">
                      ${returns.daily.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Monthly Return</div>
                    <div className="text-2xl font-bold text-secondary">
                      ${returns.monthly.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Yearly Return</div>
                    <div className="text-2xl font-bold text-secondary">
                      ${returns.yearly.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-secondary rounded-lg p-4 text-center">
                  <div className="text-sm text-secondary-foreground/90 mb-1">Total After 1 Year</div>
                  <div className="text-3xl font-bold text-secondary-foreground">
                    ${(parseFloat(amount) + returns.yearly).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How does the daily interest work?</CardTitle>
                  <CardDescription>
                    Interest is calculated daily at {dailyRate}% of your account balance and automatically credited to your account every 24 hours.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is my money safe?</CardTitle>
                  <CardDescription>
                    Yes. We use bank-level encryption, OTP verification for all transactions, and follow industry-leading security practices.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I withdraw anytime?</CardTitle>
                  <CardDescription>
                    Absolutely. You can withdraw your funds at any time. All withdrawals require OTP verification for security.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Are there any fees?</CardTitle>
                  <CardDescription>
                    No hidden fees. What you see is what you get. No management fees, no withdrawal fees, no surprises.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Ready to Start Growing Your Wealth?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of investors earning daily returns with GrowthFund
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <span className="font-bold">GrowthFund</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 GrowthFund. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-secondary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-secondary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
