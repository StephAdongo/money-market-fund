import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  action: string;
  user_email: string;
  user_name: string;
  timestamp: string;
  details: string;
}

export const ActivityAuditLog = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch recent transactions as audit log entries
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select(`
          id,
          type,
          amount,
          status,
          created_at,
          profiles!transactions_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (txError) throw txError;

      // Fetch recent OTP verifications
      const { data: otps, error: otpError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (otpError) throw otpError;

      // Combine and format logs
      const txLogs: AuditEntry[] = transactions?.map(t => ({
        id: t.id,
        action: `Transaction ${t.type}`,
        user_email: (t.profiles as any)?.email || "Unknown",
        user_name: (t.profiles as any)?.full_name || "Unknown",
        timestamp: t.created_at,
        details: `${t.status} - $${parseFloat(String(t.amount)).toLocaleString()}`,
      })) || [];

      const otpLogs: AuditEntry[] = otps?.map(o => ({
        id: o.id,
        action: `OTP Verified`,
        user_email: o.email,
        user_name: o.email.split('@')[0],
        timestamp: o.created_at,
        details: `Type: ${o.type}`,
      })) || [];

      // Merge and sort by timestamp
      const allLogs = [...txLogs, ...otpLogs].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setLogs(allLogs.slice(0, 100));
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("deposit")) return "default";
    if (action.includes("withdraw")) return "destructive";
    if (action.includes("OTP")) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Activity Audit Log
            </CardTitle>
            <CardDescription>
              Comprehensive log of all system activities
            </CardDescription>
          </div>
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.user_name}</div>
                        <div className="text-sm text-muted-foreground">{log.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
