import { NextResponse } from "next/server";
import Stripe from "stripe";

// Utilisation de la version spécifiée ou par défaut pour V2
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  let baseUrl = "";
  try {
    const { mosqueId, email, name, siret } = await req.json();

    // Détection de l'URL de base
    const host = req.headers.get("host");
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `https://${host}` : "");
    if (baseUrl && !baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log(`[Stripe V2] Création de compte pour ${name} (${email})`);

    // 1. Créez un compte (Node Node Nodes: create-account)
    // On utilise l'API V2 via fetch car le support SDK peut varier selon la config
    // mais ici on tente via le SDK si possible, sinon via fetch standard
    
    // Pour suivre exactement le blueprint /v2/core/accounts
    const accountResponse = await fetch("https://api.stripe.com/v2/core/accounts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: name || "Test account",
        contact_email: email || "testaccount@example.com",
        configuration: {
          merchant: {
            simulate_accept_tos_obo: true,
          },
        },
        include: [
          "configuration.merchant",
          "configuration.recipient",
          "identity",
          "defaults",
          "configuration.customer",
        ],
        identity: {
          country: "FR", // Adapté à la France
          business_details: {
            phone: "0000000000",
          },
        },
        dashboard: "full",
        defaults: {
          responsibilities: {
            losses_collector: "stripe",
            fees_collector: "stripe",
          },
        },
      }),
    });

    const account = await accountResponse.json();

    if (account.error) {
       throw new Error(`Erreur Stripe V2 Account: ${account.error.message}`);
    }

    console.log(`[Stripe V2] Compte créé: ${account.id}`);

    // 2. Créez un lien de compte (Blueprint step: create-account-link)
    const linkResponse = await fetch("https://api.stripe.com/v2/core/account_links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account: account.id,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["merchant", "customer"],
            refresh_url: `${baseUrl}/api/stripe/refresh?account=${account.id}`,
            return_url: `${baseUrl}/admin/mosquee?onboarding=success&accountId=${account.id}`,
          },
        },
      }),
    });

    const accountLink = await linkResponse.json();

    if (accountLink.error) {
       throw new Error(`Erreur Stripe V2 Link: ${accountLink.error.message}`);
    }

    console.log(`[Stripe V2] Lien d'onboarding généré: ${accountLink.url}`);

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (err: any) {
    console.error("Erreur Blueprint Stripe Connect:", err);
    return NextResponse.json({ 
      error: err.message,
      debug: {
        baseUrl: baseUrl,
        env: process.env.NEXT_PUBLIC_BASE_URL || "missing",
      }
    }, { status: 500 });
  }
}
