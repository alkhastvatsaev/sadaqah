import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { db } from "@/lib/firebase"; // On utilisera le client pour l'instant si possible, ou firebase-admin
import { doc, setDoc, updateDoc } from "firebase/firestore";

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
  const eventType = event.type;
  
  switch (eventType) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const mosqueId = account.metadata?.mosqueId;
      
      console.log(`[Stripe Webhook] Account update for: ${account.id}, MosqueId: ${mosqueId}`);

      if (mosqueId) {
        // Sauvegarder/Mettre à jour dans Firestore
        // On utilise l'ID de la mosquée pour le document
        const mosqueRef = doc(db, "mosques", mosqueId);
        
        await setDoc(mosqueRef, {
          stripeAccountId: account.id,
          stripeEmail: account.email,
          onboardingComplete: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`[Firestore] Mosquée ${mosqueId} mise à jour avec le compte ${account.id}`);
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id} (Montant: ${paymentIntent.amount/100}€)`);
      
      if (paymentIntent.metadata.mosque_name) {
        console.log(`Donation reçue pour: ${paymentIntent.metadata.mosque_name}`);
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
