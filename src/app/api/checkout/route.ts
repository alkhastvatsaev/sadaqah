import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27-acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { amount, mosqueName } = await req.json();

    const session = await (stripe.checkout.sessions.create as any)({
      automatic_payment_methods: { 
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Don pour ${mosqueName || 'la mosquée'}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        mosque_name: mosqueName,
      },
      success_url: `${req.headers.get('origin')}/?success=true`,
      cancel_url: `${req.headers.get('origin')}/`,
    });

    return NextResponse.json({ id: session.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
