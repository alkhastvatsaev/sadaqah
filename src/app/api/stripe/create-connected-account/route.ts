import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  let baseUrl = '';
  try {
    const { mosqueId, email, name, siret } = await req.json();

    // Détection ultra-robuste de l'URL de base
    const host = req.headers.get('host');
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `https://${host}` : '');

    // Sécurité: Si l'URL n'a pas de protocole, on l'ajoute
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Nettoyage: Enlever les slashs de fin
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log(`Debug URL - Host: ${host}, Env: ${process.env.NEXT_PUBLIC_BASE_URL}, Final: ${baseUrl}`);

    if (!baseUrl || !baseUrl.startsWith('http')) {
       throw new Error(`URL de base invalide ou manquante: "${baseUrl}"`);
    }

    // 1. Créer le compte Stripe Express
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
        // On enlève momentanément l'URL ici pour isoler le problème
      },
      metadata: {
        mosqueId: mosqueId.toString(),
        siret: siret,
      },
    });

    console.log(`Compte Stripe créé: ${account.id}`);

    // 2. Générer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/api/stripe/refresh?account=${account.id}`,
      return_url: `${baseUrl}/admin/mosquee?onboarding=success`,
      type: "account_onboarding",
    });

    console.log(`Lien d'onboarding généré: ${accountLink.url}`);

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (err: any) {
    console.error("Erreur complète Stripe:", err);
    return NextResponse.json({ 
      error: err.message,
      debug: {
        baseUrl: typeof baseUrl !== 'undefined' ? baseUrl : 'undefined',
        env: process.env.NEXT_PUBLIC_BASE_URL || 'missing',
        host: req.headers.get('host') || 'missing',
      }
    }, { status: 500 });
  }
}
