import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Percent, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const InterestRateConfig = () => {
  const [dailyRate, setDailyRate] = useState("0.05");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchCurrentRate();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "daily_interest_rate")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDailyRate(data.setting_value);
      }
    } catch (error: any) {
      console.error("Error fetching interest rate:", error);
      toast.error("Failed to load current rate");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    const rate = parseFloat(dailyRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Please enter a valid rate between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("setting_key", "daily_interest_rate")
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from("admin_settings")
          .update({
            setting_value: dailyRate,
            updated_at: new Date().toISOString(),
            updated_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq("setting_key", "daily_interest_rate");

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("admin_settings")
          .insert({
            setting_key: "daily_interest_rate",
            setting_value: dailyRate,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (insertError) throw insertError;
      }

      toast.success("Interest rate updated successfully");
    } catch (error: any) {
      console.error("Error saving interest rate:", error);
      toast.error("Failed to save interest rate");
    } finally {
      setLoading(false);
    }
  };

  const annualRate = (parseFloat(dailyRate) * 365).toFixed(2);
  const monthlyRate = (parseFloat(dailyRate) * 30).toFixed(2);

  if (fetching) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-secondary" />
          Interest Rate Configuration
        </CardTitle>
        <CardDescription>
          Set the daily interest rate for all user balances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="dailyRate">Daily Interest Rate (%)</Label>
          <div className="flex gap-3">
            <Input
              id="dailyRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              placeholder="0.05"
              className="max-w-xs"
            />
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-gradient-secondary shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Rate
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Current daily rate: {dailyRate}%
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Rate (30 days)</p>
            <p className="text-2xl font-bold text-secondary">{monthlyRate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Annual Rate (365 days)</p>
            <p className="text-2xl font-bold text-accent">{annualRate}%</p>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4 text-accent" />
            Example Calculations
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">$1,000 daily interest:</span>
              <span className="font-semibold">${(1000 * parseFloat(dailyRate) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">$10,000 daily interest:</span>
              <span className="font-semibold">${(10000 * parseFloat(dailyRate) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">$100,000 daily interest:</span>
              <span className="font-semibold">${(100000 * parseFloat(dailyRate) / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
