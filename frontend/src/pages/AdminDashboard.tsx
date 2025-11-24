import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserManagement } from "@/components/admin/UserManagement";
import { InterestRateConfig } from "@/components/admin/InterestRateConfig";
import { TransactionMonitoring } from "@/components/admin/TransactionMonitoring";
import { WithdrawalAnalytics } from "@/components/admin/WithdrawalAnalytics";
import { ActivityAuditLog } from "@/components/admin/ActivityAuditLog";
import { OTPMonitoring } from "@/components/admin/OTPMonitoring";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast.error("Access denied. Admin privileges required.");
          navigate("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (error: any) {
        console.error("Error checking admin role:", error);
        toast.error("Failed to verify admin access");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-secondary" />
            <span className="font-bold text-xl">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              User View
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
          <p className="text-muted-foreground">Manage users, transactions, and system settings</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="interest">Interest Rate</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="otp">OTP Logs</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="interest">
            <InterestRateConfig />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionMonitoring />
          </TabsContent>

          <TabsContent value="analytics">
            <WithdrawalAnalytics />
          </TabsContent>

          <TabsContent value="otp">
            <OTPMonitoring />
          </TabsContent>

          <TabsContent value="audit">
            <ActivityAuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
