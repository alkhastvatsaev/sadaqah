import { getAdminDb } from "@/lib/server/firebase-admin";
import { noStoreJson, requireAdmin } from "@/lib/server/security";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const snapshot = await getAdminDb().collection("mosques").get();
    const mosques = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        stripeAccountId:
          typeof data.stripeAccountId === "string"
            ? data.stripeAccountId
            : undefined,
        onboardingComplete: data.onboardingComplete === true,
        chargesEnabled: data.chargesEnabled === true,
        payoutsEnabled: data.payoutsEnabled === true,
      };
    });

    return noStoreJson({ mosques });
  } catch (error) {
    console.error("Unable to load admin mosque data:", error);
    return noStoreJson(
      { error: "Unable to load mosque data." },
      { status: 500 },
    );
  }
}
