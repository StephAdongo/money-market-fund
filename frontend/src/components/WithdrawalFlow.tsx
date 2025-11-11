import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmailOTPPrompt } from "./EmailOTPPrompt";
import { OTPVerification } from "./OTPVerification";

interface WithdrawalFlowProps {
  userEmail: string;
  userName: string;
  currentBalance: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const WithdrawalFlow = ({ userEmail, userName, currentBalance, onSuccess, onCancel }: WithdrawalFlowProps) => {
  const [step, setStep] = useState<"amount" | "feedback" | "email" | "otp">("amount");
  const [amount, setAmount] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [reason, setReason] = useState("");
  const [reinvestPlan, setReinvestPlan] = useState("");
  const [experienceFeedback, setExperienceFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNum > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (amountNum < 10) {
      toast.error("Minimum withdrawal amount is $10");
      return;
    }

    setStep("feedback");
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error("Please select a reason for withdrawal");
      return;
    }

    setStep("email");
  };

  const handleEmailConfirmed = (email: string) => {
    setConfirmedEmail(email);
    setStep("otp");
  };

  const handleOTPVerified = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amountNum = parseFloat(amount);

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: amountNum,
          type: "withdraw",
          status: "completed",
          description: "Withdrawal via OTP verification",
        })
        .select()
        .single();

      if (txError) throw txError;

      // Update user balance
      const newBalance = currentBalance - amountNum;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Save withdrawal reason
      const { error: reasonError } = await supabase
        .from("withdrawal_reasons")
        .insert({
          user_id: user.id,
          transaction_id: transaction.id,
          reason,
          reinvest_plan: reinvestPlan || null,
          experience_feedback: experienceFeedback || null,
        });

      if (reasonError) throw reasonError;

      toast.success(`Successfully withdrawn $${amountNum.toLocaleString()}`);
      onSuccess();
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  if (step === "feedback") {
    return (
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Before We Continue</CardTitle>
          <CardDescription>
            Please help us understand your withdrawal (${parseFloat(amount).toLocaleString()})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Withdrawal *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency_expenses">Emergency Expenses</SelectItem>
                  <SelectItem value="better_opportunity">Better Investment Opportunity</SelectItem>
                  <SelectItem value="dissatisfied_returns">Dissatisfied with Returns</SelectItem>
                  <SelectItem value="need_liquidity">Need Liquidity</SelectItem>
                  <SelectItem value="closing_account">Closing Account</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reinvestPlan">Future Plans (Optional)</Label>
              <Select value={reinvestPlan} onValueChange={setReinvestPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reinvest_later">Will Reinvest Later</SelectItem>
                  <SelectItem value="different_platform">Moving to Different Platform</SelectItem>
                  <SelectItem value="traditional_banking">Traditional Banking</SelectItem>
                  <SelectItem value="stock_market">Stock Market</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="no_plans">No Investment Plans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Your Experience (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts about using GrowthFund..."
                value={experienceFeedback}
                onChange={(e) => setExperienceFeedback(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("amount")}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || !reason}
                className="flex-1 bg-gradient-secondary shadow-glow"
              >
                Continue to Verification
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "otp") {
    return (
      <OTPVerification
        email={confirmedEmail}
        type="withdraw"
        userName={userName}
        onVerified={handleOTPVerified}
        onCancel={onCancel}
      />
    );
  }

  if (step === "email") {
    return (
      <EmailOTPPrompt
        defaultEmail={userEmail}
        type="withdraw"
        userName={userName}
        onEmailConfirmed={handleEmailConfirmed}
        onCancel={() => setStep("feedback")}
      />
    );
  }

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center">
            <ArrowDownRight className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Withdraw Funds</CardTitle>
        <CardDescription>
          Enter the amount you want to withdraw
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAmountSubmit} className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-secondary">${currentBalance.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="10"
              max={currentBalance}
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Minimum withdrawal: $10
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
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
