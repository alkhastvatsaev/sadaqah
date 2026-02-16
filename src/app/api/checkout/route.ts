import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Initialisation paresseuse de Stripe
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { amount, mosqueName } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('La clé Stripe n\'est pas configurée dans les variables d\'environnement.');
    }

    const session = await (getStripe().checkout.sessions.create as any)({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Don pour ${mosqueName || 'la mosquée'}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        mosque_name: mosqueName,
      },
      success_url: `${req.headers.get('origin')}/?success=true`,
    });
    
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: unknown) {
    console.error('Stripe Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
