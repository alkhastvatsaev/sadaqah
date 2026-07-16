import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRASBOURG_MOSQUES } from "../../data/mosques";
import {
  isPlainObject,
  requiredString,
  validAmount,
} from "@/lib/server/validation";

export const dynamic = "force-dynamic";

const STRIPE_FEE_PERCENTAGE = 0.017; // 1.7%
const STRIPE_FIXED_FEE_CENTS = 25;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured.");
  return new Stripe(secretKey);
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isPlainObject(body)) throw new Error("Request body must be an object.");

    const amountInCents = validAmount(body.amount);
    const mosqueName = requiredString(body.mosqueName, "mosqueName", 120);
    const mosque = STRASBOURG_MOSQUES.find((item) => item.name === mosqueName);
    if (!mosque) throw new Error("Unknown mosque.");

    const coverFees = body.coverFees === true;
    const finalAmountInCents = coverFees
      ? Math.round(
          (amountInCents + STRIPE_FIXED_FEE_CENTS) /
            (1 - STRIPE_FEE_PERCENTAGE),
        )
      : amountInCents;

    const connectedAccountId = mosque?.stripeAccountId;

    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: finalAmountInCents,
      currency: "eur",
      metadata: {
        mosque_name: mosqueName,
        mosque_id: String(mosque.id),
        original_donation_amount: (amountInCents / 100).toFixed(2),
        covered_fees: coverFees ? "yes" : "no",
      },
      description: `Don pour ${mosqueName}`,
      automatic_payment_methods: { enabled: true },
    };

    const paymentIntent = await getStripe().paymentIntents.create(
      paymentIntentOptions,
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined,
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error("PaymentIntent creation failed:", error);
    const isInputError =
      error instanceof Error &&
      !("type" in error) &&
      !error.message.includes("configured");
    return NextResponse.json(
      {
        error: isInputError
          ? error.message
          : "Unable to initialize the payment.",
      },
      { status: isInputError ? 400 : 500 },
    );
  }
}
