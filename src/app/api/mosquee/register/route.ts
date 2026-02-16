import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// Initialisation paresseuse de Resend
const getResend = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mosqueName, city, email, phone } = body;

    if (!process.env.RESEND_API_KEY) {
      throw new Error('La clé Resend n\'est pas configurée.');
    }

    // Envoi de l'e-mail à l'administrateur
    await getResend().emails.send({
      from: 'Mosque Connect <onboarding@resend.dev>',
      to: 'alkhastvatsaev@gmail.com',
      subject: `Nouvelle inscription : ${mosqueName}`,
      html: `
        <h1>Nouvelle demande d'inscription mosquée</h1>
        <p><strong>Nom :</strong> ${mosqueName}</p>
        <p><strong>Ville :</strong> ${city}</p>
        <p><strong>E-mail :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        <hr />
        <p>Veuillez vérifier ces informations et contacter la mosquée pour activer leur portail.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erreur inscription mail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Détails non disponibles';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
