import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account");

  if (!accountId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/mosquee?error=missing_account`);
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/refresh?account=${accountId}`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/mosquee?onboarding=success`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error("Refresh Link Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/mosquee?error=refresh_failed`);
  }
}
