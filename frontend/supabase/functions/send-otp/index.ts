import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  type: "registration" | "login" | "deposit" | "withdraw" | "password_reset";
  userId?: string;
  userName?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { email, type, userId, userName } = await req.json() as SendOTPRequest;

    console.log(`Sending OTP to ${email} for ${type}`);

    // Generate 6-digit OTP
    const { data: otpData, error: otpError } = await supabase
      .rpc('generate_otp');

    if (otpError) {
      console.error("Error generating OTP:", otpError);
      throw new Error("Failed to generate OTP");
    }

    const code = otpData;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up old OTP codes for this email/type
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email)
      .eq("type", type);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        user_id: userId || null,
        email,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to store OTP");
    }

    // Prepare email content based on type
    const typeLabels: Record<string, string> = {
      registration: "Registration",
      login: "Login",
      deposit: "Deposit Confirmation",
      withdraw: "Withdrawal Confirmation",
      password_reset: "Password Reset",
    };

    const subject = `${typeLabels[type]} - Your OTP Code`;
    const greeting = userName ? `Hi ${userName}` : "Hello";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .otp-box { background: #f1f5f9; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981; font-family: monospace; }
            .warning { color: #ef4444; font-size: 14px; margin-top: 20px; }
            .footer { color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">GrowthFund</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${typeLabels[type]}</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #334155;">${greeting},</p>
              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                Your verification code for ${typeLabels[type].toLowerCase()} is:
              </p>
              <div class="otp-box">
                <div class="otp-code">${code}</div>
              </div>
              <p style="font-size: 14px; color: #64748b;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="font-size: 14px; color: #64748b;">
                If you didn't request this code, please ignore this email or contact support if you have concerns.
              </p>
              <div class="warning">
                ⚠️ Never share this code with anyone. GrowthFund staff will never ask for your OTP code.
              </div>
            </div>
            <div class="footer">
              <p>© 2024 GrowthFund. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GrowthFund <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Error sending email:", errorData);
      throw new Error("Failed to send email");
    }

    console.log(`OTP sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        expiresIn: 600 // 10 minutes in seconds
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
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
