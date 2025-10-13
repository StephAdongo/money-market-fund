import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TransactionModalProps {
  type: "deposit" | "withdrawal";
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TransactionModal = ({ type, isOpen, onClose, onComplete }: TransactionModalProps) => {
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"amount" | "otp">("amount");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = () => {
    setAmount("");
    setOtp("");
    setStep("amount");
    setTransactionId(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("initiate-transaction", {
      body: { amount: parseFloat(amount), type },
    });

    setLoading(false);

    if (error || data.error) {
      toast({
        title: "Error",
        description: error?.message || data.error,
        variant: "destructive",
      });
    } else {
      setTransactionId(data.transactionId);
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("verify-transaction", {
      body: { transactionId, otp },
    });

    setLoading(false);

    if (error || data.error) {
      toast({
        title: "Verification Failed",
        description: error?.message || data.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `${type === "deposit" ? "Deposit" : "Withdrawal"} completed successfully`,
      });
      onComplete();
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{type}</DialogTitle>
          <DialogDescription>
            {step === "amount"
              ? `Enter the amount you want to ${type}`
              : "Enter the OTP sent to your email"}
          </DialogDescription>
        </DialogHeader>

        {step === "amount" ? (
          <form onSubmit={handleAmountSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("amount")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;