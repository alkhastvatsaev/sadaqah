import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRASBOURG_MOSQUES } from "../../../data/mosques";
import {
  getAppUrl,
  noStoreJson,
  requireAdmin,
  signConnectAccount,
} from "@/lib/server/security";
import {
  isPlainObject,
  requiredString,
  validEmail,
} from "@/lib/server/validation";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const body: unknown = await req.json();
    if (!isPlainObject(body)) throw new Error("Request body must be an object.");

    const mosqueId = requiredString(String(body.mosqueId ?? ""), "mosqueId", 32);
    const mosque = STRASBOURG_MOSQUES.find(
      (item) => String(item.id) === mosqueId,
    );
    if (!mosque) throw new Error("Unknown mosque.");

    const email = validEmail(body.email);
    const siret = requiredString(body.siret, "siret", 14);
    if (!/^\d{14}$/.test(siret)) {
      throw new Error("siret must contain exactly 14 digits.");
    }
    const baseUrl = getAppUrl();

    const account = await getStripe().accounts.create({
      type: "express",
      country: "FR",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "non_profit",
      business_profile: {
        name: mosque.name,
      },
      metadata: {
        mosqueId,
        siret,
      },
    });

    const state = signConnectAccount(account.id);
    const accountLink = await getStripe().accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/api/stripe/refresh?account=${account.id}&state=${state}`,
      return_url: `${baseUrl}/admin/mosquee?onboarding=success&accountId=${account.id}`,
      type: "account_onboarding",
    });

    return noStoreJson({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error: unknown) {
    console.error("Stripe Connect account creation failed:", error);
    return NextResponse.json(
      { error: "Unable to create the connected account." },
      { status: 500 },
    );
  }
}
