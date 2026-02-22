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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmountInEuros * 100), // En centimes
      currency: "eur",
      metadata: {
        mosque_name: mosqueName,
        original_donation_amount: amount,
        covered_fees: coverFees ? "yes" : "no",
      },
      description: `Don pour ${mosqueName || "la mosquée"}`,
      payment_method_types: ["card"],
    });

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
