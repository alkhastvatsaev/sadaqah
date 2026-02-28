import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  try {
    const { mosqueId, email, name, siret } = await req.json();

    // Détection ultra-robuste de l'URL de base
    const host = req.headers.get('host');
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `https://${host}` : '');

    // Sécurité: Si l'URL n'a pas de protocole, on l'ajoute
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Nettoyage: Enlever les slashs de fin
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log(`URL de base finale pour Stripe: ${baseUrl}`);

    if (!baseUrl || baseUrl.includes('localhost') === false && !baseUrl.startsWith('https')) {
       console.error("URL de base invalide détectée");
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
        url: baseUrl, // URL du site de l'association ou de la plateforme
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

    // 3. Ici vous feriez normalement une mise à jour de votre DB
    // await db.mosque.update({ where: { id: mosqueId }, data: { stripeAccountId: account.id } })
    console.log(`Compte créé pour ${name}: ${account.id}`);

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (err: any) {
    console.error("Erreur Create Connected Account:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
