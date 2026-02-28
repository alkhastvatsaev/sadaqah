import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: "accountId est requis" }, { status: 400 });
    }

    console.log(`[Stripe Blueprint] Création de l'offre d'abonnement pour ${accountId}`);

    // 1. Configurez une offre d'abonnement (Blueprint Node: create-product)
    const product = await stripe.products.create({
      name: "Sadaqah Platform Subscription",
      default_price_data: {
        currency: "eur",
        recurring: {
          interval: "month",
        },
        unit_amount: 1000, // 10.00€
      },
    });

    console.log(`Produit créé: ${product.id}`);

    // 2. Associez au compte un moyen de paiement par défaut (Blueprint Node: create-setup-intent)
    // On utilise le solde du compte pour payer (stripe_balance)
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["stripe_balance"],
      confirm: true,
      customer_account: accountId, // Utilisation de customer_account pour le compte connecté
      usage: "off_session",
      payment_method_data: {
        type: "stripe_balance",
      } as any, // Cast any because stripe_balance is a specific Connect v2/v1 feature
    });

    console.log(`SetupIntent confirmé: ${setupIntent.id}`);

    // 3. Débitez l'abonnement (Blueprint Node: create-subscription)
    const subscription = await stripe.subscriptions.create({
      customer_account: accountId,
      default_payment_method: setupIntent.payment_method as string,
      items: [
        {
          price: product.default_price as string,
          quantity: 1,
        },
      ],
      payment_settings: {
        payment_method_types: ["stripe_balance"] as any,
      },
    } as any);

    console.log(`Abonnement créé: ${subscription.id}`);

    return NextResponse.json({
      subscriptionId: subscription.id,
      productId: product.id,
    });
  } catch (err: any) {
    console.error("Erreur Abonnement Blueprint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
