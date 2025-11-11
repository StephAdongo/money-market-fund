import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Starting daily interest calculation...");

    // Get the current interest rate from admin settings
    const { data: settingData, error: settingError } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "daily_interest_rate")
      .maybeSingle();

    if (settingError) {
      console.error("Error fetching interest rate:", settingError);
      throw new Error("Failed to fetch interest rate");
    }

    const dailyRate = settingData ? parseFloat(settingData.setting_value) : 0.05; // Default 0.05%
    console.log(`Using daily interest rate: ${dailyRate}%`);

    // Get all profiles with positive balances
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, balance, total_interest_earned")
      .gt("balance", 0);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error("Failed to fetch profiles");
    }

    if (!profiles || profiles.length === 0) {
      console.log("No profiles with positive balances found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No profiles to process",
          processed: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let processedCount = 0;
    let totalInterestPaid = 0;

    // Process each profile
    for (const profile of profiles) {
      const currentBalance = parseFloat(String(profile.balance || "0"));
      const currentTotalInterest = parseFloat(String(profile.total_interest_earned || "0"));
      
      // Calculate interest
      const interestAmount = currentBalance * (dailyRate / 100);
      const newBalance = currentBalance + interestAmount;
      const newTotalInterest = currentTotalInterest + interestAmount;

      console.log(`Processing ${profile.email}: Balance $${currentBalance}, Interest $${interestAmount.toFixed(2)}`);

      // Update profile balance and total interest
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          total_interest_earned: newTotalInterest,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error(`Error updating profile ${profile.email}:`, updateError);
        continue;
      }

      // Create interest transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: profile.id,
          amount: interestAmount,
          type: "interest",
          status: "completed",
          description: `Daily interest at ${dailyRate}%`,
        });

      if (txError) {
        console.error(`Error creating transaction for ${profile.email}:`, txError);
        continue;
      }

      processedCount++;
      totalInterestPaid += interestAmount;
    }

    console.log(`Successfully processed ${processedCount} accounts`);
    console.log(`Total interest paid: $${totalInterestPaid.toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Interest calculation completed",
        processed: processedCount,
        totalInterestPaid: totalInterestPaid.toFixed(2),
        rate: dailyRate
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in calculate-interest function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
