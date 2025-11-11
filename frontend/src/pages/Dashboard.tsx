import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  LogOut,
  Shield,
  RefreshCw,
  History
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DepositFlow } from "@/components/DepositFlow";
import { WithdrawalFlow } from "@/components/WithdrawalFlow";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Check admin role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Handle Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Payment successful! Your deposit will be reflected shortly.');
      setSearchParams({});
      // Refresh data after a short delay to allow webhook to process
      setTimeout(() => {
        refreshData();
      }, 2000);
    } else if (canceled === 'true') {
      toast.error('Payment was canceled. Please try again if needed.');
      setSearchParams({});
    }
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    
    setLoading(true);
    toast.info("Refreshing data...");
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (profileData) setProfile(profileData);

    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (transactionsData) setTransactions(transactionsData);
    
    setLoading(false);
    toast.success("Data refreshed!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  const balance = parseFloat(profile?.balance || "0");
  const totalInterest = parseFloat(profile?.total_interest_earned || "0");
  const dailyInterest = balance * 0.0005; // 0.05% daily


  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-secondary" />
            <span className="font-bold text-xl">GrowthFund</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name}!</h1>
            <p className="text-muted-foreground">Here's your investment overview</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +5.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Interest</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">${dailyInterest.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Earned today
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">${totalInterest.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button 
            className="bg-gradient-secondary shadow-glow"
            onClick={() => setShowDepositModal(true)}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Deposit Funds
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowWithdrawalModal(true)}
          >
            <ArrowDownRight className="h-4 w-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>

        {/* Transaction History */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent account activity</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/transactions")}
              >
                <History className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet. Make your first deposit to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === "deposit" ? "bg-secondary/20" :
                        transaction.type === "withdraw" ? "bg-destructive/20" :
                        "bg-accent/20"
                      }`}>
                        {transaction.type === "deposit" ? (
                          <ArrowUpRight className="h-5 w-5 text-secondary" />
                        ) : transaction.type === "withdraw" ? (
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{transaction.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.type === "withdraw" ? "text-destructive" : "text-secondary"
                      }`}>
                        {transaction.type === "withdraw" ? "-" : "+"}${parseFloat(transaction.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">{transaction.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogTitle className="sr-only">Deposit Funds</DialogTitle>
          <DialogDescription className="sr-only">
            Complete the deposit process to add funds to your account
          </DialogDescription>
          <DepositFlow
            userEmail={profile?.email || ""}
            userName={profile?.full_name || "User"}
            onSuccess={() => {
              setShowDepositModal(false);
              refreshData();
            }}
            onCancel={() => setShowDepositModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogTitle className="sr-only">Withdraw Funds</DialogTitle>
          <DialogDescription className="sr-only">
            Complete the withdrawal process to withdraw funds from your account
          </DialogDescription>
          <WithdrawalFlow
            userEmail={profile?.email || ""}
            userName={profile?.full_name || "User"}
            currentBalance={balance}
            onSuccess={() => {
              setShowWithdrawalModal(false);
              refreshData();
            }}
            onCancel={() => setShowWithdrawalModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
