import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface EmailOTPPromptProps {
  defaultEmail?: string;
  type: "registration" | "login" | "deposit" | "withdraw" | "password_reset";
  userName?: string;
  onEmailConfirmed: (email: string) => void;
  onCancel: () => void;
}

export const EmailOTPPrompt = ({ defaultEmail, type, userName, onEmailConfirmed, onCancel }: EmailOTPPromptProps) => {
  const [email, setEmail] = useState(defaultEmail || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    onEmailConfirmed(email);
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
            <Mail className="h-6 w-6 text-secondary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verify Email</CardTitle>
        <CardDescription>
          Enter your email to receive a verification code for {typeLabels[type].toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              A 6-digit code will be sent to this email address
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-secondary shadow-glow"
            >
              Send Code
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
