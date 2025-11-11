import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DepositFlowProps {
  userEmail: string;
  userName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DepositFlow = ({ userEmail, userName, onSuccess, onCancel }: DepositFlowProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNum < 10) {
      toast.error("Minimum deposit amount is $10");
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { amount: amountNum },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Opening payment page...');
        onCancel(); // Close the modal
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 text-secondary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Deposit Funds</CardTitle>
        <CardDescription>
          Enter the amount you want to deposit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAmountSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="10"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Minimum deposit: $10
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-secondary shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Stripe
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
