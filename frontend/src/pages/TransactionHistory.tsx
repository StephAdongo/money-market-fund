import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TransactionHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-secondary" />
            <span className="font-bold text-xl">GrowthFund</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-muted-foreground">All your account transactions</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchTransactions}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              {transactions.length} total transaction{transactions.length !== 1 ? "s" : ""}
            </CardDescription>
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
                          {new Date(transaction.created_at).toLocaleString()}
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {transaction.description}
                          </div>
                        )}
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
    </div>
  );
};

export default TransactionHistory;
