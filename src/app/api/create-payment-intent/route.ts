import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

const STRIPE_FEE_PERCENTAGE = 0.017; // 1.7% to match 0.43€ for 10€
const STRIPE_FIXED_FEE = 0.25; // 0.25€

export async function POST(req: Request) {
  try {
    const { amount, mosqueName, coverFees } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 },
      );
    }

    let finalAmountInEuros = amount;

    if (coverFees) {
      // Calculate the gross amount needed so the net amount equals 'amount'
      // gross = (net + 0.25) / (1 - rate)
      // We round to 2 decimal places to be cent-precise as shown in the UI
      finalAmountInEuros = Math.round(((amount + STRIPE_FIXED_FEE) / (1 - STRIPE_FEE_PERCENTAGE)) * 100) / 100;
    }

    // 1. Trouver l'ID de compte connecté de la mosquée (Normalement via DB)
    // Pour la démo on cherche dans notre fichier de données
    const { STRASBOURG_MOSQUES } = require("../../data/mosques");
    const mosque = STRASBOURG_MOSQUES.find((m: any) => m.name === mosqueName);
    const destinationId = mosque?.stripeAccountId;

    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(finalAmountInEuros * 100), // En centimes
      currency: "eur",
      metadata: {
        mosque_name: mosqueName,
        original_donation_amount: amount,
        covered_fees: coverFees ? "yes" : "no",
      },
      description: `Don pour ${mosqueName || "la mosquée"}`,
      automatic_payment_methods: { enabled: true },
    };

    // Si on a un compte connecté, on utilise Destination Charges
    if (destinationId) {
      paymentIntentOptions.transfer_data = {
        destination: destinationId,
      };
      // Note: application_fee_amount peut être ajouté ici si besoin
      // paymentIntentOptions.application_fee_amount = 0; 
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: unknown) {
    console.error("Erreur Stripe :", err);
    const errorMessage =
      err instanceof Error ? err.message : "Une erreur inconnue est survenue";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
