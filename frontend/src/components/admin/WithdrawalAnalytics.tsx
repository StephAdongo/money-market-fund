import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WithdrawalReason {
  reason: string;
  reinvest_plan: string | null;
  experience_feedback: string | null;
  created_at: string;
}

export const WithdrawalAnalytics = () => {
  const [reasons, setReasons] = useState<WithdrawalReason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawalReasons();
  }, []);

  const fetchWithdrawalReasons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("withdrawal_reasons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReasons(data || []);
    } catch (error: any) {
      console.error("Error fetching withdrawal reasons:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
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

  // Process reasons data
  const reasonCounts = reasons.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reasonData = Object.entries(reasonCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  // Process reinvestment plans
  const reinvestCounts = reasons.reduce((acc, r) => {
    if (r.reinvest_plan) {
      acc[r.reinvest_plan] = (acc[r.reinvest_plan] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const reinvestData = Object.entries(reinvestCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  const COLORS = ['hsl(160 84% 39%)', 'hsl(43 96% 56%)', 'hsl(222 47% 11%)', 'hsl(0 84% 60%)', 'hsl(220 9% 46%)'];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Withdrawal Analytics Overview</CardTitle>
          <CardDescription>
            Total withdrawals analyzed: {reasons.length}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Reasons Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Withdrawal Reasons</CardTitle>
            <CardDescription>Distribution of why users withdraw funds</CardDescription>
          </CardHeader>
          <CardContent>
            {reasonData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No withdrawal data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Reinvestment Plans Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Reinvestment Plans</CardTitle>
            <CardDescription>What users plan to do after withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            {reinvestData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No reinvestment data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reinvestData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(160 84% 39%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent User Feedback</CardTitle>
          <CardDescription>Latest feedback from users who withdrew funds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reasons.filter(r => r.experience_feedback).slice(0, 10).map((reason, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium capitalize">
                    {reason.reason.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reason.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "{reason.experience_feedback}"
                </p>
                {reason.reinvest_plan && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Plan: {reason.reinvest_plan.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            ))}
            {reasons.filter(r => r.experience_feedback).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No feedback available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
