import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getAppUrl,
  signConnectAccount,
  verifyConnectAccount,
} from "@/lib/server/security";
import { validStripeAccount } from "@/lib/server/validation";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = getAppUrl();

  try {
    const accountId = validStripeAccount(searchParams.get("account"));
    if (!verifyConnectAccount(accountId, searchParams.get("state"))) {
      return NextResponse.redirect(`${baseUrl}/admin/mosquee?error=invalid_link`);
    }

    const state = signConnectAccount(accountId);
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/stripe/refresh?account=${accountId}&state=${state}`,
      return_url: `${baseUrl}/admin/mosquee?onboarding=success`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error("Stripe Connect refresh failed:", error);
    return NextResponse.redirect(`${baseUrl}/admin/mosquee?error=missing_account`);
  }
}
