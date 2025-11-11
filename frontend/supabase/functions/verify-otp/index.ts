import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  code: string;
  type: "registration" | "login" | "deposit" | "withdraw" | "password_reset";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { email, code, type } = await req.json() as VerifyOTPRequest;

    console.log(`Verifying OTP for ${email}, type: ${type}`);

    // Find the OTP code
    const { data: otpRecords, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("type", type)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      throw new Error("Failed to verify OTP");
    }

    if (!otpRecords || otpRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No OTP found. Please request a new code." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const otpRecord = otpRecords[0];

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase
        .from("otp_codes")
        .delete()
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OTP code has expired. Please request a new code." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if code matches
    if (otpRecord.code !== code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid OTP code. Please try again." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Error updating OTP:", updateError);
      throw new Error("Failed to verify OTP");
    }

    console.log(`OTP verified successfully for ${email}`);

    // Clean up old OTP codes for this email
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email)
      .neq("id", otpRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        otpId: otpRecord.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
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
