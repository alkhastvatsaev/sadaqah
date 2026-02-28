import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  let baseUrl = "";
  try {
    const { mosqueId, email, name, siret } = await req.json();

    // Récupération sécurisée du host via next/headers
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    
    // On construit l'URL de base à partir du host actuel pour être sûr
    baseUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_BASE_URL || "");
    
    // Nettoyage final
    baseUrl = baseUrl.replace(/\/$/, "");
    if (baseUrl && !baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;

    console.log(`[Stripe] Tentative création compte. Host: ${host} | BaseURL: ${baseUrl}`);

    if (!baseUrl) {
      throw new Error("Impossible de déterminer l'URL de base du site.");
    }

    // 1. Créer le compte Stripe Express (Minimum strict)
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: email,
      capabilities: {
        transfers: { requested: true }, // On ne demande que le transfert pour l'instant
      },
      business_type: "non_profit",
      business_profile: {
        name: name,
      },
      metadata: {
        mosqueId: mosqueId.toString(),
        siret: siret,
      },
    });

    console.log(`[Stripe] Compte créé: ${account.id}`);

    // 2. Générer le lien d'onboarding
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
