'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Load Stripe outside of component to avoid recreating it
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

// Predefined donation amounts
const PRESET_AMOUNTS = [5, 10, 20, 50, 100, 200];

// Internal component for the form inside Elements provider
function CheckoutForm({ amount, mosqueName, onCancel }: { amount: number, mosqueName: string, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?success=true&mosqueName=${encodeURIComponent(mosqueName)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'Une erreur est survenue.');
      setIsSubmitting(false);
    }
    // If success, Stripe redirects automatically
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div style={{ marginBottom: '1.5rem' }}>
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          {errorMessage}
        </div>
      )}

      <button 
        type="submit" 
        disabled={!stripe || isSubmitting}
        className="donate-button"
        style={{ marginTop: 0 }}
      >
        {isSubmitting ? 'Traitement...' : `Payer ${amount}€`}
      </button>
      
      <button 
        type="button" 
        onClick={onCancel}
        className="card-button"
        style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)' }}
      >
        Annuler
      </button>
    </form>
  );
}

export default function Home() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [mosqueName, setMosqueName] = useState('Grande Mosquée');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentAmount = selectedAmount || (customAmount ? Number(customAmount) : 0);
  const isValidAmount = currentAmount > 0;

  // Check for success redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const query = new URLSearchParams(window.location.search);
      if (query.get('success')) {
        setIsSuccess(true);
        const name = query.get('mosqueName');
        if (name) setMosqueName(decodeURIComponent(name));
      }
    }
  }, []);

  const handleStartPayment = async () => {
    if (!isValidAmount) return;
    
    setIsLoadingSecret(true);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: currentAmount, mosqueName }),
      });
      
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        alert('Erreur lors de l\'initialisation du paiement');
      }
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue');
    } finally {
      setIsLoadingSecret(false);
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
              window.location.href = '/'; 
            }}
          >
            Faire un autre don
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container">
      <Link href="/mosquee/register" className="mosque-portal-link">
        Vous êtes une mosquée ?
      </Link>

      <div className="glass-card" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            Sadaqah App
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            La plateforme de don sécurisée et transparente.
          </p>
        </div>

        {/* If we have a client secret, show the payment form directly */}
        {clientSecret ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
             <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Montant du don</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{currentAmount}€</p>
             </div>
             <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret, 
                  appearance: { 
                    theme: 'night', 
                    variables: { colorPrimary: '#10b981', colorBackground: '#1f2937', colorText: '#ffffff' } 
                  } 
                }}
              >
              <CheckoutForm 
                amount={currentAmount} 
                mosqueName={mosqueName} 
                onCancel={() => setClientSecret(null)} 
              />
            </Elements>
          </div>
        ) : (
          /* Selection Step */
          <>
            <div className="form-group">
              <input 
                type="text" 
                value={mosqueName}
                onChange={(e) => setMosqueName(e.target.value)}
                className="title-input"
                placeholder="Nom de la mosquée"
              />
              <p className="subtitle">Soutenez votre communauté.</p>
            </div>

            <div className="amount-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {PRESET_AMOUNTS.map((amount) => (
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

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type="number"
                placeholder="Autre montant..."
                className="custom-amount-input"
                style={{ marginBottom: 0 }}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
              />
              <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>EUR</span>
            </div>

            <button 
              className="donate-button"
              disabled={!isValidAmount || isLoadingSecret}
              onClick={handleStartPayment}
            >
              {isLoadingSecret ? 'Chargement...' : 'Continuer vers le paiement'}
            </button>
          </>
        )}

        {/* Security Footer */}
        {!clientSecret && (
           <div style={{ textAlign: 'center', marginTop: '1.5rem', opacity: 0.5, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Paiement 100% sécurisé via Stripe
          </div>
        )}
      </div>

       <footer style={{ 
        marginTop: '3rem',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.75rem',
        textAlign: 'center',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <span>© 2026 Sadaqah App</span>
        <span style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }}></span>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Mentions légales</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>CGV</a>
        <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Confidentialité</a>
      </footer>
    </main>
  );
}
