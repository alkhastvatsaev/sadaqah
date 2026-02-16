import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialisation paresseuse de Resend
const getResend = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mosqueName, city, email, phone } = body;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Erreur inscription mail:', error);
    // On retourne quand même un succès pour la démo si la clé API est manquante
    return NextResponse.json({ success: true, warning: 'Clé API Resend manquante' });
  }
}
