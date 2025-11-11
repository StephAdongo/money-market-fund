import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OTPVerificationProps {
  email: string;
  type: "registration" | "login" | "deposit" | "withdraw" | "password_reset";
  userName?: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OTPVerification = ({ email, type, userName, onVerified, onCancel }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    // Send OTP when component mounts
    sendOTP();

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sendOTP = async () => {
    try {
      setResending(true);
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email, type, userName },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("OTP code sent to your email");
        setTimeLeft(600); // Reset timer
      } else {
        throw new Error(data?.error || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, code: otp, type },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("OTP verified successfully!");
        onVerified();
      } else {
        throw new Error(data?.error || "Invalid OTP code");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const typeLabels: Record<string, string> = {
    registration: "Registration",
    login: "Login",
    deposit: "Deposit",
    withdraw: "Withdrawal",
    password_reset: "Password Reset",
  };

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center">
            <Shield className="h-6 w-6 text-secondary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to <strong>{email}</strong> for {typeLabels[type].toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-mono"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {timeLeft > 0 ? (
                <span>Code expires in <strong>{formatTime(timeLeft)}</strong></span>
              ) : (
                <span className="text-destructive">Code expired</span>
              )}
            </div>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={sendOTP}
              disabled={resending || timeLeft > 540} // Can resend after 1 minute
              className="p-0 h-auto"
            >
              {resending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  Resend Code
                </>
              )}
            </Button>
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
              disabled={loading || otp.length !== 6 || timeLeft === 0}
              className="flex-1 bg-gradient-secondary shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-xs text-muted-foreground text-center">
          <p>Didn't receive the code? Check your spam folder.</p>
          <p className="mt-1">Need help? Contact support.</p>
        </div>
      </CardContent>
    </Card>
  );
};
