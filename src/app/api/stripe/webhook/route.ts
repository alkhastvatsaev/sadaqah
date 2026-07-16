import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    if (!signature) throw new Error("Missing Stripe signature.");
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: unknown) {
    console.error("Stripe webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const mosqueId = account.metadata?.mosqueId;

        if (mosqueId) {
          await getAdminDb().collection("mosques").doc(mosqueId).set(
            {
              stripeAccountId: account.id,
              stripeEmail: account.email,
              onboardingComplete: account.details_submitted,
              chargesEnabled: account.charges_enabled,
              payoutsEnabled: account.payouts_enabled,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.info("Donation payment succeeded", {
          paymentIntentId: paymentIntent.id,
          mosqueId: paymentIntent.metadata.mosque_id,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
