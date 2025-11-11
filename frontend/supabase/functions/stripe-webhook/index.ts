import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log('Webhook event type:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        const userId = session.metadata?.user_id;
        const amount = parseFloat(session.metadata?.amount || '0');
        const type = session.metadata?.type;

        if (!userId || !amount || !type) {
          console.error('Missing metadata:', session.metadata);
          break;
        }

        // Initialize Supabase client with service role key
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Create transaction record
        const { error: txError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            amount: amount,
            type: type,
            status: 'completed',
            description: `Stripe payment - ${session.id}`,
          });

        if (txError) {
          console.error('Error creating transaction:', txError);
          throw txError;
        }

        // Update user balance
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        const currentBalance = parseFloat(String(profile.balance || '0'));
        const newBalance = currentBalance + amount;

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating balance:', updateError);
          throw updateError;
        }

        console.log(`Updated balance for user ${userId}: ${newBalance}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        // Could log failed payments or notify user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});