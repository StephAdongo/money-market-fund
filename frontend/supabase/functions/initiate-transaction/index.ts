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

    const { amount, type } = await req.json();

    if (!amount || !type || (type !== "deposit" && type !== "withdrawal")) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For withdrawals, check if user has sufficient balance
    if (type === "withdrawal") {
      const { data: account } = await supabaseClient
        .from("accounts")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!account || account.balance < amount) {
        return new Response(
          JSON.stringify({ error: "Insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create transaction
    const { data: transaction, error } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: user.id,
        type,
        amount,
        status: "pending",
        otp_code: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
        otp_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create transaction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP email (logging for now as email setup is separate)
    console.log(`OTP for user ${user.email}: ${otp}`);
    console.log(`Transaction ${transaction.id} - Type: ${type}, Amount: ${amount}`);

    return new Response(
      JSON.stringify({ 
        transactionId: transaction.id,
        message: "OTP sent to your email" 
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