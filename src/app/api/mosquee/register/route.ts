import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  escapeHtml,
  isPlainObject,
  requiredString,
  validEmail,
} from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

const attempts = new Map<string, { count: number; resetsAt: number }>();

const getResend = () => {
  if (!process.env.RESEND_API_KEY) throw new Error('Resend is not configured.');
  return new Resend(process.env.RESEND_API_KEY);
};

function isRateLimited(request: Request): boolean {
  const key =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const existing = attempts.get(key);
  if (!existing || existing.resetsAt <= now) {
    attempts.set(key, { count: 1, resetsAt: now + 10 * 60 * 1000 });
    return false;
  }
  existing.count += 1;
  return existing.count > 5;
}

export async function POST(req: Request) {
  if (isRateLimited(req)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  try {
    const contentLength = Number(req.headers.get('content-length') ?? 0);
    if (contentLength > 10_000) throw new Error('Request body is too large.');

    const body: unknown = await req.json();
    if (!isPlainObject(body)) throw new Error('Request body must be an object.');
    const mosqueName = requiredString(body.mosqueName, 'mosqueName', 120);
    const city = requiredString(body.city, 'city', 100);
    const email = validEmail(body.email);
    const phone = requiredString(body.phone, 'phone', 32);
    if (!/^[+\d][\d\s().-]{6,31}$/.test(phone)) {
      throw new Error('phone is invalid.');
    }

    const recipient = process.env.REGISTRATION_TO_EMAIL;
    const sender = process.env.RESEND_FROM_EMAIL;
    if (!recipient || !sender) throw new Error('Email delivery is not configured.');

    await getResend().emails.send({
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `Nouvelle inscription : ${mosqueName}`,
      html: `
        <h1>Nouvelle demande d'inscription mosquée</h1>
        <p><strong>Nom :</strong> ${escapeHtml(mosqueName)}</p>
        <p><strong>Ville :</strong> ${escapeHtml(city)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>
        <hr />
        <p>Veuillez vérifier ces informations et contacter la mosquée pour activer leur portail.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Mosque registration failed:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to submit the registration.' },
      { status: 400 },
    );
  }
}
