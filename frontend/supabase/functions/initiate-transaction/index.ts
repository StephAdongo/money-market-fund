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

    // Send OTP email via Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Daily Grow Vault <onboarding@resend.dev>",
          to: [user.email!],
          subject: "Your Transaction OTP Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0A2540;">Transaction Verification</h1>
              <p>Hello,</p>
              <p>You've initiated a <strong>${type}</strong> transaction for <strong>$${amount.toFixed(2)}</strong>.</p>
              <p>Your OTP code is:</p>
              <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h2 style="color: #0A2540; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h2>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this transaction, please ignore this email.</p>
              <p style="color: #64748b; font-size: 12px; margin-top: 30px;">Daily Grow Vault - Secure Money Market Fund</p>
            </div>
          `,
        }),
      });

      if (emailResponse.ok) {
        console.log(`OTP email sent to ${user.email} for transaction ${transaction.id}`);
      } else {
        const errorData = await emailResponse.text();
        console.error("Failed to send OTP email:", errorData);
        console.log(`Fallback - OTP for user ${user.email}: ${otp}`);
      }
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      console.log(`Fallback - OTP for user ${user.email}: ${otp}`);
    }

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