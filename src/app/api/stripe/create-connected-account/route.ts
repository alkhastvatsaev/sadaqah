import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  let baseUrl = "";
  try {
    const { mosqueId, email, name, siret } = await req.json();

    // Détection de l'URL de base (priorité à l'env, sinon headers)
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `https://${host}` : "");
    
    // Fallback de secours si tout est undefined
    if (!baseUrl) {
      baseUrl = "https://sadaqah-mosque-ruddy.vercel.app";
    }

    if (baseUrl && !baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log(`[Stripe V1] Déclenchement onboarding pour ${name} sur ${baseUrl}`);

    // 1. Créer le compte Stripe Express (API V1 - Compatible Test Mode)
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "non_profit",
      business_profile: {
        name: name,
        url: baseUrl,
      },
      metadata: {
        mosqueId: mosqueId.toString(),
        siret: siret,
      },
    });

    console.log(`[Stripe V1] Compte créé: ${account.id}`);

    // 2. Générer le lien d'onboarding (API V1)
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/api/stripe/refresh?account=${account.id}`,
      return_url: `${baseUrl}/admin/mosquee?onboarding=success&accountId=${account.id}`,
      type: "account_onboarding",
    });

    console.log(`[Stripe V1] Lien généré: ${accountLink.url}`);

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (err: any) {
    console.error("Erreur Stripe Connect V1:", err);
    return NextResponse.json({ 
      error: err.message,
      debug: {
        baseUrl: baseUrl,
        env: process.env.NEXT_PUBLIC_BASE_URL || "missing",
      }
    }, { status: 500 });
  }
}
