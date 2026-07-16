'use client';

import { useState } from 'react';
import { STRASBOURG_MOSQUES } from '../../data/mosques';

type MosqueStatus = {
  stripeAccountId?: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
};

export default function AdminMosquePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [mosqueStatuses, setMosqueStatuses] = useState<Record<string, MosqueStatus>>({});

  const loadStatuses = async () => {
    setAuthError('');
    const response = await fetch('/api/admin/mosques', {
      headers: { 'x-admin-key': adminKey },
      cache: 'no-store',
    });
    if (!response.ok) {
      setAuthenticated(false);
      setAuthError(response.status === 401 ? 'Clé administrateur invalide.' : 'Chargement impossible.');
      return;
    }
    const data = await response.json();
    const statuses: Record<string, MosqueStatus> = {};
    for (const status of data.mosques as Array<MosqueStatus & { id: string }>) {
      statuses[status.id] = status;
    }
    setMosqueStatuses(statuses);
    setAuthenticated(true);
  };

  const handleOnboard = async (mosque: (typeof STRASBOURG_MOSQUES)[number]) => {
    const email = window.prompt('E-mail légal du représentant de la mosquée :');
    if (!email) return;
    const siret = mosque.siret ?? window.prompt('SIRET (14 chiffres) :');
    if (!siret) return;

    setLoading(mosque.name);
    try {
      const res = await fetch('/api/stripe/create-connected-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          mosqueId: mosque.id,
          email,
          siret,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Erreur: ${data.error || 'Impossible de générer le lien'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  if (!authenticated) {
    return (
      <main className="main-container">
        <div className="glass-card">
          <h1 className="title">Administration</h1>
          <p className="subtitle">Entrez la clé opérateur. Elle reste uniquement en mémoire dans cet onglet.</p>
          <form onSubmit={(event) => { event.preventDefault(); void loadStatuses(); }}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-key">Clé administrateur</label>
              <input
                id="admin-key"
                type="password"
                className="form-input"
                autoComplete="off"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                required
              />
            </div>
            {authError && <p role="alert" style={{ color: '#ef4444' }}>{authError}</p>}
            <button className="donate-button" type="submit">Ouvrir</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Gestion des Mosquées</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Firebase: Connecté</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Stripe: Test Mode</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {STRASBOURG_MOSQUES.map((m) => {
          const status = mosqueStatuses[m.id.toString()];
          const isChargesEnabled = status?.chargesEnabled;

          return (
            <div key={m.id} style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '1.25rem', 
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{m.name}</h3>
                  {isChargesEnabled ? (
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>ACTIF</span>
                  ) : status?.stripeAccountId ? (
                    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>INCOMPLET</span>
                  ) : (
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>NON LIÉ</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>{m.address}</p>
                {status?.stripeAccountId && (
                  <code style={{ fontSize: '0.7rem', color: '#10b981', opacity: 0.8, display: 'block', marginTop: '0.5rem' }}>{status.stripeAccountId}</code>
                )}
              </div>
              
              <button 
                onClick={() => handleOnboard(m)}
                disabled={loading === m.name}
                style={{
                  background: isChargesEnabled ? 'rgba(255,255,255,0.05)' : '#10b981',
                  color: isChargesEnabled ? 'rgba(255,255,255,0.6)' : 'white',
                  border: isChargesEnabled ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  opacity: loading === m.name ? 0.5 : 1
                }}
              >
                {loading === m.name ? '...' : (isChargesEnabled ? 'Gérer Stripe' : (status?.stripeAccountId ? 'Reprendre' : 'Lier Stripe'))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
