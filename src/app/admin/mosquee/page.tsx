'use client';

import { useState, useEffect } from 'react';
import { STRASBOURG_MOSQUES } from '../../data/mosques';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function AdminMosquePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [mosqueStatuses, setMosqueStatuses] = useState<Record<string, any>>({});

  // Écouter les changements dans Firestore en temps réel
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "mosques"), (snapshot) => {
      const statuses: Record<string, any> = {};
      snapshot.forEach(doc => {
        statuses[doc.id] = doc.data();
      });
      setMosqueStatuses(statuses);
    });
    return () => unsub();
  }, []);

  const handleOnboard = async (mosque: any) => {
    setLoading(mosque.name);
    try {
      const res = await fetch('/api/stripe/create-connected-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosqueId: mosque.id,
          email: mosque.email || `contact@${mosque.slug}.fr`, // On génère un email si absent
          name: mosque.name,
          siret: mosque.siret || '00000000000000',
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
          const isComplete = status?.onboardingComplete;
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
