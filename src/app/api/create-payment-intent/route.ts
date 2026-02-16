import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { amount, mosqueName } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à 0' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // En centimes
      currency: 'eur',
      metadata: {
        mosque_name: mosqueName,
      },
      description: `Don pour ${mosqueName || 'la mosquée'}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: unknown) {
    console.error('Erreur Stripe :', err);
    const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
