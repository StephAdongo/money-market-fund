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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transactionId, otp } = await req.json();

    if (!transactionId || !otp) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get transaction
    const { data: transaction, error: fetchError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !transaction) {
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP is expired
    if (new Date(transaction.otp_expires_at) < new Date()) {
      await supabaseClient
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);

      return new Response(
        JSON.stringify({ error: "OTP expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP
    if (transaction.otp_code !== otp) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current account balance
    const { data: account } = await supabaseClient
      .from("accounts")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let newBalance = account.balance;
    
    if (transaction.type === "deposit") {
      newBalance += transaction.amount;
    } else if (transaction.type === "withdrawal") {
      if (account.balance < transaction.amount) {
        await supabaseClient
          .from("transactions")
          .update({ status: "failed" })
          .eq("id", transactionId);

        return new Response(
          JSON.stringify({ error: "Insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      newBalance -= transaction.amount;
    }

    // Update account balance
    const { error: updateError } = await supabaseClient
      .from("accounts")
      .update({ balance: newBalance })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update transaction status
    await supabaseClient
      .from("transactions")
      .update({ 
        status: "completed",
        otp_verified: true,
        balance_after: newBalance
      })
      .eq("id", transactionId);

    return new Response(
      JSON.stringify({ 
        success: true,
        newBalance
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