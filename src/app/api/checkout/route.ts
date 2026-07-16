import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRASBOURG_MOSQUES } from '../../data/mosques';
import { getAppUrl } from '@/lib/server/security';
import { isPlainObject, requiredString, validAmount } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured.');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isPlainObject(body)) throw new Error('Request body must be an object.');
    const amount = validAmount(body.amount);
    const mosqueName = requiredString(body.mosqueName, 'mosqueName', 120);
    const mosque = STRASBOURG_MOSQUES.find((item) => item.name === mosqueName);
    if (!mosque) throw new Error('Unknown mosque.');

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Don pour ${mosqueName || 'la mosquée'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        mosque_name: mosqueName,
      },
      success_url: `${getAppUrl()}/?success=true`,
    });
    
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: unknown) {
    console.error('Checkout Session creation failed:', err);
    const isInputError =
      err instanceof Error && !err.message.includes('configured');
    return NextResponse.json(
      { error: isInputError ? err.message : 'Unable to initialize checkout.' },
      { status: isInputError ? 400 : 500 },
    );
  }
}
