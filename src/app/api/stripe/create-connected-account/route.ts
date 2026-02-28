import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  try {
    const { mosqueId, email, name, siret } = await req.json();

    // Détection de l'URL de base (priorité à l'env var, sinon détection via headers)
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    console.log(`Utilisation de l'URL de base: ${baseUrl}`);

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
