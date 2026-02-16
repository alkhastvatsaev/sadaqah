'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Predefined donation amounts
const PRESET_AMOUNTS = [5, 10, 20, 50, 100, 200];

export default function Home() {
  // State management
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [mosqueName, setMosqueName] = useState('Grande Mosquée');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const currentAmount = selectedAmount || (customAmount ? Number(customAmount) : 0);
  const isValidAmount = currentAmount > 0;

  // Handle donation flow
  const handleDonate = async () => {
    if (!isValidAmount) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currentAmount,
          mosqueName: mosqueName.trim() || 'Mosquée',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la préparation du don.');
      }

      if (data.url) {
        // Server-side redirect is reliable and secure
        window.location.href = data.url;
      } else {
        throw new Error('Erreur de configuration Stripe (URL manquante).');
      }

    } catch (err) {
      console.error('Donation error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="main-container">
      {/* Mosque Portal Link */}
      <Link 
        href="/mosquee/register"
        className="mosque-portal-link"
      >
        Vous êtes une mosquée ?
      </Link>

      <div className="glass-card">
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            Sadaqah App
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            La plateforme de don sécurisée et transparente.
          </p>
        </div>

        {/* Mosque Name Input */}
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

        {/* Amount Selection Grid */}
        <div className="amount-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              className={`amount-button ${selectedAmount === amount ? 'selected' : ''}`}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
                setError(null);
              }}
            >
              {amount}€
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
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
              setError(null);
            }}
          />
          <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>EUR</span>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.1)', 
            border: '1px solid rgba(220, 38, 38, 0.5)', 
            color: '#f87171', 
            padding: '0.75rem', 
            borderRadius: '12px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Payment Actions */}
        <div className="payment-methods">
          {/* Quick Pay Buttons (Visual only, they all trigger standard checkout) */}
          <div className="express-pay">
            <button 
              className="apple-pay-button"
              disabled={!isValidAmount || isProcessing}
              onClick={handleDonate}
              title="Payer avec Apple Pay"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.67 8.35c.01-1.67 1.37-2.43 1.43-2.47-.79-1.13-2-1.28-2.45-1.3-.98-.1-2 .57-2.5.57-.49 0-1.39-.56-2.22-.55-1.09.02-2.1.63-2.66 1.6-.71 1.25-.54 3.09.15 4.09.34.48.74.83 1.13.84.38.01.53-.22.99-.22.45 0 .61.22 1.01.21s.75-.41 1.09-.89c.39-.55.55-1.07.56-1.1-.01 0-1.12-.42-1.13-1.68zm-.89-5.41c.44-.52.73-1.25.65-1.98-.64.03-1.42.42-1.89.96-.41.48-.77 1.23-.67 1.94.72.05 1.44-.37 1.91-.92z"/>
              </svg>
              Pay
            </button>
            <button 
              className="google-pay-button" 
              disabled={!isValidAmount || isProcessing}
              onClick={handleDonate}
              title="Payer avec Google Pay"
            >
              <svg width="34" height="16" viewBox="0 0 42 16" fill="currentColor">
                <path d="M6.46 6.84v2.07h4.94c-.2 1.13-1.33 3.32-4.94 3.32-2.98 0-5.41-2.45-5.41-5.47s2.43-5.47 5.41-5.47c1.69 0 2.82.72 3.47 1.34l1.63-1.63C10.51.05 8.7 0 6.46 0 2.92 0 0 2.97 0 6.58S2.92 13.16 6.46 13.16c3.73 0 6.2-2.7 6.2-6.38 0-.43-.05-.76-.11-1.08H6.46z"/>
                <path d="M16.94 4.54c-2.1 0-3.86 1.63-3.86 3.86s1.76 3.86 3.86 3.86 3.86-1.63 3.86-3.86-1.76-3.86-3.86-3.86zm0 6.25c-1.32 0-2.46-1.05-2.46-2.39s1.14-2.39 2.46-2.39 2.46 1.05 2.46 2.39-1.14 2.39-2.46 2.39zM25.43 4.54c-2.1 0-3.86 1.63-3.86 3.86s1.76 3.86 3.86 3.86 3.86-1.63 3.86-3.86-1.77-3.86-3.86-3.86zm0 6.25c-1.32 0-2.46-1.05-2.46-2.39s1.14-2.39 2.46-2.39 2.46 1.05 2.46 2.39-1.14 2.39-2.46 2.39z"/>
              </svg>
            </button>
          </div>

          <div className="separator">ou</div>

          <button 
            className="donate-button"
            disabled={!isValidAmount || isProcessing}
            onClick={handleDonate}
            style={{ marginTop: 0 }}
          >
            {isProcessing ? (
              <span>Redirection sécurisée...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Donner par Carte Bancaire
              </>
            )}
          </button>
        </div>

        {/* Security Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', opacity: 0.5, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Paiement 100% sécurisé via Stripe
        </div>
      </div>

      {/* Legal Footer for Stripe Compliance */}
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
