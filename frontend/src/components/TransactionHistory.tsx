import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  balance_after: number;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-5 w-5 text-success" />;
      case "withdrawal":
        return <ArrowUpFromLine className="h-5 w-5 text-destructive" />;
      case "interest":
        return <TrendingUp className="h-5 w-5 text-accent" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your transaction history</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {transaction.type === "withdrawal" ? "-" : "+"}$
                    {transaction.amount.toFixed(2)}
                  </p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;