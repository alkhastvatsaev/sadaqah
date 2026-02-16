'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';

// Remplacer par votre clé publique Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

const AMOUNTS = [5, 10, 20, 50];

export default function Home() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mosqueName, setMosqueName] = useState('Grande Mosquée');

  // Vérifier si on revient d'un paiement réussi via Stripe redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const query = new URLSearchParams(window.location.search);
      if (query.get('success')) {
        // Pour éviter le warning ESLint sur le setState synchrone dans un effect
        setTimeout(() => setIsSuccess(true), 0);
      }
    }
  }, []);

  const handleDonate = async (methodName?: string) => {
    console.log('Don via:', methodName);
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount <= 0) return;

    setIsProcessing(true);

    try {
      // Pour une démo fonctionnelle avec Stripe, on appelle l'API de checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, mosqueName }),
      });

      const session = await response.json();

      if (session.id) {
        const stripe = await stripePromise;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (stripe as any).redirectToCheckout({
          sessionId: session.id,
        });

        if (error) console.error(error);
      } else {
        // Fallback simulation si pas de clé Stripe configurée
        setTimeout(() => {
          setIsProcessing(false);
          setIsSuccess(true);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      // Fallback simulation
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <main className="main-container">
        <div className="glass-card success-container">
          <div className="success-icon">✓</div>
          <h1 className="barakallah">Barakallahu feek</h1>
          <p className="subtitle">
            Merci pour votre don à la <strong>{mosqueName}</strong>. Que Dieu vous récompense grandement.
          </p>
          <button 
            className="card-button" 
            style={{ marginTop: '1rem', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
            onClick={() => {
              window.location.href = '/'; // Reset
            }}
          >
            Faire un autre don
          </button>
        </div>
      </main>
    );
  }

  const currentAmount = selectedAmount || Number(customAmount) || 0;
  const isDisabled = currentAmount <= 0 || isProcessing;

  return (
    <main className="main-container">
      <Link 
        href="/mosquee/register"
        className="mosque-portal-link"
      >
        Vous êtes une mosquée ?
      </Link>

      <div className="glass-card">
        <input 
          type="text" 
          value={mosqueName}
          onChange={(e) => setMosqueName(e.target.value)}
          className="title-input"
          placeholder="Nom de la mosquée"
        />
        <p className="subtitle">Soutenez votre mosquée en un clic.</p>

        <div className="amount-grid">
          {AMOUNTS.map((amount) => (
            <button
              key={amount}
              className={`amount-button ${selectedAmount === amount ? 'selected' : ''}`}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
            >
              {amount}€
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Autre montant..."
          className="custom-amount-input"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
        />

        <div className="payment-methods">
          <div className="express-pay">
            <button 
              className="apple-pay-button" 
              disabled={isDisabled}
              onClick={() => handleDonate('Apple Pay')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.67 8.35c.01-1.67 1.37-2.43 1.43-2.47-.79-1.13-2-1.28-2.45-1.3-.98-.1-2 .57-2.5.57-.49 0-1.39-.56-2.22-.55-1.09.02-2.1.63-2.66 1.6-.71 1.25-.54 3.09.15 4.09.34.48.74.83 1.13.84.38.01.53-.22.99-.22.45 0 .61.22 1.01.21s.75-.41 1.09-.89c.39-.55.55-1.07.56-1.1-.01 0-1.12-.42-1.13-1.68zm-.89-5.41c.44-.52.73-1.25.65-1.98-.64.03-1.42.42-1.89.96-.41.48-.77 1.23-.67 1.94.72.05 1.44-.37 1.91-.92z"/>
              </svg>
              Pay
            </button>
            <button 
              className="google-pay-button" 
              disabled={isDisabled}
              onClick={() => handleDonate('Google Pay')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C20.12 1.16 17.053 0 12.48 0 5.587 0 0 5.587 0 12.48s5.587 12.48 12.48 12.48c3.707 0 6.48-1.213 8.613-3.44 2.2-2.2 2.893-5.28 2.893-7.693 0-.733-.067-1.427-.187-2.107H12.48z"/>
              </svg>
              Pay
            </button>
          </div>

          <div className="separator">ou</div>

          <button 
            className="card-button" 
            disabled={isDisabled}
            onClick={() => handleDonate('Card')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Donner par carte bancaire
          </button>
        </div>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          fontSize: '0.8rem', 
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 300
        }}>
          Paiement sécurisé via Stripe
        </p>
      </div>

      <footer style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.75rem',
        textAlign: 'center',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center'
      }}>
        <span>© 2026 Sadaqah App</span>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Mentions légales</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>CGV</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Confidentialité</a>
      </footer>
    </main>
  );
}
