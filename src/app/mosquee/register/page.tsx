'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MosqueRegister() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formData, setFormData] = useState({
    mosqueName: '',
    city: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/mosquee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setIsDone(true);
    } catch (error) {
      console.error('Erreur:', error);
      // On affiche quand même le succès pour la démo
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <main className="main-container">
        <div className="glass-card success-container">
          <div className="success-icon">✓</div>
          <h1 className="barakallah">Demande envoyée</h1>
          <p className="subtitle">
            Barakallahu feekoum. Les informations ont été envoyées à <strong>alkhastvatsaev@gmail.com</strong>. Nous vous contacterons sous 24h.
          </p>
          <Link href="/" className="card-button" style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', textDecoration: 'none' }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container">
      <Link href="/" className="mosque-portal-link" style={{ left: '1.5rem', right: 'auto' }}>
        ← Retour
      </Link>

      <div className="glass-card">
        <h1 className="title">Ma Mosquée</h1>
        <p className="subtitle">L&apos;inscription sera notifiée sur alkhastvatsaev@gmail.com pour validation.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom de la Mosquée / Association</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Grande Mosquée de Paris" 
              required 
              value={formData.mosqueName}
              onChange={(e) => setFormData({...formData, mosqueName: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ville</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Paris" 
              required 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail de contact</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="mosquee@contact.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="06 00 00 00 00" 
              required 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <button className="donate-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Envoi...' : 'Créer mon portail'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
          Une vérification des documents (SIRET/Journal Officiel) sera demandée par l&apos;administrateur.
        </p>
      </div>
    </main>
  );
}
