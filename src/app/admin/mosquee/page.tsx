'use client';

import { useState } from 'react';
import { STRASBOURG_MOSQUES } from '../../data/mosques';

export default function AdminMosquePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOnboard = async (mosque: any) => {
    setLoading(mosque.name);
    try {
      const res = await fetch('/api/stripe/create-connected-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mosqueId: mosque.id,
          email: 'contact@elsau.mosquee.fr', // Email de test
          name: mosque.name,
          siret: mosque.siret || '00000000000000',
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erreur: ' + (data.error || 'Impossible de générer le lien'));
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>Administration Connect</h1>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {STRASBOURG_MOSQUES.map((m) => (
          <div key={m.id} style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '1rem', 
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>
              <h3 style={{ margin: 0 }}>{m.name}</h3>
              <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', opacity: 0.6 }}>{m.address}</p>
              {m.siret && <span style={{ fontSize: '0.7rem', background: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>SIRET: {m.siret}</span>}
            </div>
            
            <button 
              onClick={() => handleOnboard(m)}
              disabled={loading === m.name}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: loading === m.name ? 0.5 : 1
              }}
            >
              {loading === m.name ? 'Chargement...' : 'Générer Lien Stripe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
