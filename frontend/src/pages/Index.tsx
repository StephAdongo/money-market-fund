import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Shield, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-white mb-16">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <DollarSign className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            MoneyMarket Fund
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Grow your wealth with daily interest on your deposits
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Log In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
            <div className="h-12 w-12 bg-success rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Daily Interest</h3>
            <p className="text-white/80">
              Earn competitive daily interest on all your deposits automatically
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Transactions</h3>
            <p className="text-white/80">
              All transactions are protected with email OTP verification
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
            <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Access</h3>
            <p className="text-white/80">
              Deposit and withdraw funds anytime with instant processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;