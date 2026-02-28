import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  try {
    const { mosqueId, email, name, siret } = await req.json();

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
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
      metadata: {
        mosqueId: mosqueId.toString(),
        siret: siret,
      },
      // Note: L'IBAN peut être ajouté via external_account plus tard 
      // ou lors de l'onboarding Stripe Hosted
    });

    // 2. Générer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/refresh?account=${account.id}`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/mosquee?onboarding=success`,
      type: "account_onboarding",
    });

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
