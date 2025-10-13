import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get all accounts that haven't received interest today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: accounts, error } = await supabaseClient
      .from("accounts")
      .select("*")
      .lt("last_interest_date", yesterday.toISOString());

    if (error) {
      console.error("Error fetching accounts:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;

    for (const account of accounts || []) {
      if (account.balance > 0) {
        const interest = account.balance * account.interest_rate;
        const newBalance = account.balance + interest;

        // Update account balance and last interest date
        await supabaseClient
          .from("accounts")
          .update({
            balance: newBalance,
            last_interest_date: new Date().toISOString(),
          })
          .eq("id", account.id);

        // Create interest transaction
        await supabaseClient
          .from("transactions")
          .insert({
            user_id: account.user_id,
            type: "interest",
            amount: interest,
            status: "completed",
            otp_verified: true,
            balance_after: newBalance,
          });

        processed++;
        console.log(`Processed interest for account ${account.id}: $${interest.toFixed(2)}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        message: `Calculated interest for ${processed} accounts`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});