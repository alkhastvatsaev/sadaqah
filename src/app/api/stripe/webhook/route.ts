import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  const eventType = event.type as string;
  switch (eventType) {
    case "account.updated":
    case "v2.core.account[configuration.merchant].capability_status_updated":
      const account = event.data.object as any;
      console.log(`[Stripe Webhook] Account status update: ${account.id || (event.data as any).id}`);
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id} (Montant: ${paymentIntent.amount/100}€)`);
      // Metadata help identification
      if (paymentIntent.metadata.mosque_name) {
        console.log(`Donation reçue pour: ${paymentIntent.metadata.mosque_name}`);
      }
      break;

    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout Session completed: ${session.id}`);
      break;

    case "invoice.payment_succeeded":
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Invoice payment succeeded: ${invoice.id}`);
      break;

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
