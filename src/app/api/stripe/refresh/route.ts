import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account");

  // Détection d'URL robuste
  const host = req.headers.get('host');
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `https://${host}` : "https://sadaqah-mosque-ruddy.vercel.app");
  if (baseUrl && !baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
  baseUrl = baseUrl.replace(/\/$/, "");

  if (!accountId) {
    return NextResponse.redirect(`${baseUrl}/admin/mosquee?error=missing_account`);
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/stripe/refresh?account=${accountId}`,
      return_url: `${baseUrl}/admin/mosquee?onboarding=success`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error("Refresh Link Error:", error);
    return NextResponse.redirect(`${baseUrl}/admin/mosquee?error=refresh_failed`);
  }
}
