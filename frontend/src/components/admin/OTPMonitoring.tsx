import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OTPLog {
  id: string;
  email: string;
  type: string;
  code: string;
  verified: boolean;
  created_at: string;
  expires_at: string;
  user_id: string | null;
}

export const OTPMonitoring = () => {
  const [otpLogs, setOtpLogs] = useState<OTPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    expired: 0,
    pending: 0,
  });
  const { toast } = useToast();

  const fetchOTPLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("otp_codes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setOtpLogs(data || []);

      // Calculate stats
      const now = new Date();
      const verified = data?.filter((log) => log.verified).length || 0;
      const expired = data?.filter((log) => new Date(log.expires_at) < now && !log.verified).length || 0;
      const pending = data?.filter((log) => new Date(log.expires_at) >= now && !log.verified).length || 0;

      setStats({
        total: data?.length || 0,
        verified,
        expired,
        pending,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTPLogs();
  }, []);

  const getStatusBadge = (log: OTPLog) => {
    const isExpired = new Date(log.expires_at) < new Date();

    if (log.verified) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }

    if (isExpired) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      registration: "bg-blue-500",
      login: "bg-purple-500",
      deposit: "bg-green-500",
      withdraw: "bg-orange-500",
      password_reset: "bg-red-500",
    };

    return (
      <Badge className={colors[type] || "bg-gray-500"}>
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">OTP Monitoring</h2>
          <p className="text-muted-foreground">Track OTP delivery and verification status</p>
        </div>
        <Button onClick={fetchOTPLogs} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total OTPs</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expired/Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent OTP Logs</CardTitle>
          <CardDescription>Last 100 OTP delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : otpLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No OTP logs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otpLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.email}</TableCell>
                    <TableCell>{getTypeBadge(log.type)}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{log.code}</code>
                    </TableCell>
                    <TableCell>{getStatusBadge(log)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.expires_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
