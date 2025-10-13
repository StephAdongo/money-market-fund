import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, ArrowUpFromLine, LogOut, DollarSign, TrendingUp } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import TransactionModal from "@/components/TransactionModal";
import TransactionHistory from "@/components/TransactionHistory";

interface Account {
  balance: number;
  interest_rate: number;
}

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchAccount();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAccount = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("balance, interest_rate")
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch account information",
        variant: "destructive",
      });
    } else {
      setAccount(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleTransactionComplete = () => {
    fetchAccount();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">MoneyMarket Fund</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardDescription>Account Balance</CardDescription>
              <CardTitle className="text-4xl">
                ${loading ? "..." : (account?.balance || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardDescription>Daily Interest Rate</CardDescription>
              <CardTitle className="text-4xl flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-success" />
                {loading ? "..." : ((account?.interest_rate || 0) * 100).toFixed(2)}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-card col-span-full lg:col-span-1">
            <CardContent className="pt-6 space-y-3">
              <Button 
                className="w-full bg-gradient-success" 
                onClick={() => setIsDepositOpen(true)}
              >
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setIsWithdrawOpen(true)}
              >
                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </CardContent>
          </Card>
        </div>

        <TransactionHistory />
      </main>

      <TransactionModal
        type="deposit"
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onComplete={handleTransactionComplete}
      />

      <TransactionModal
        type="withdrawal"
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onComplete={handleTransactionComplete}
      />
    </div>
  );
};

export default Dashboard;