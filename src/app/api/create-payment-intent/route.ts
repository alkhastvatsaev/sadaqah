import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRASBOURG_MOSQUES } from "../../data/mosques";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

const STRIPE_FEE_PERCENTAGE = 0.017; // 1.7%
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
      // Calcul propre en centimes pour éviter les erreurs de virgule flottante
      const amountInCents = amount * 100;
      const fixedFeeInCents = STRIPE_FIXED_FEE * 100;
      const finalCents = Math.round((amountInCents + fixedFeeInCents) / (1 - STRIPE_FEE_PERCENTAGE));
      finalAmountInEuros = finalCents / 100;
    }

    // 1. Trouver l'ID de compte connecté de la mosquée
    const mosque = STRASBOURG_MOSQUES.find((m: any) => m.name === mosqueName);
    const connectedAccountId = mosque?.stripeAccountId;

    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(finalAmountInEuros * 100), // En centimes
      currency: "eur",
      metadata: {
        mosque_name: mosqueName || "Inconnue",
        original_donation_amount: amount.toString(),
        covered_fees: coverFees ? "yes" : "no",
      },
      description: `Don pour ${mosqueName || "la mosquée"}`,
      automatic_payment_methods: { enabled: true },
    };

    // On ne passe l'objet d'options que si on a un compte Stripe connecté
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentOptions,
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error("Erreur Stripe détaillée:", err);
    return NextResponse.json({ 
      error: err.message || "Erreur lors de la création du PaymentIntent",
      code: err.code,
      type: err.type
    }, { status: 500 });
  }
}
