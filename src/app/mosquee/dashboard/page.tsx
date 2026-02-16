'use client';

import React from 'react';
import Link from 'next/link';

export default function MosqueDashboard() {
  // Mock data for display
  const totalDonations = 12450.50;
  const countDonations = 342;
  const lastDonations = [
    { id: 1, name: 'Anonyme', amount: 50, timestamp: 'Il y a 2 min', method: 'Apple Pay' },
    { id: 2, name: 'Sami B.', amount: 20, timestamp: 'Il y a 15 min', method: 'Carte' },
    { id: 3, name: 'Ahmed K.', amount: 100, timestamp: 'Il y a 1h', method: 'Google Pay' },
    { id: 4, name: 'Anonyme', amount: 10, timestamp: 'Il y a 2h', method: 'Apple Pay' },
    { id: 5, name: 'Karima L.', amount: 5, timestamp: 'Il y a 4h', method: 'Carte' },
  ];

  return (
    <div className="dashboard-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Tableau de bord</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Grande Mosquée de Paris</p>
        </div>
        <Link href="/" className="mosque-portal-link" style={{ position: 'relative', top: 0, right: 0 }}>
          Déconnexion
        </Link>
      </header>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Total Récolté</div>
          <div className="stat-value">{totalDonations.toLocaleString('fr-FR')} €</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem' }}>+12% ce mois-ci</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Nombre de Dons</div>
          <div className="stat-value">{countDonations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Moyenne par Don</div>
          <div className="stat-value">{(totalDonations / countDonations).toFixed(2)} €</div>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Derniers dons reçus</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Donateur</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Temps</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lastDonations.map((donation) => (
                <tr key={donation.id}>
                  <td style={{ fontWeight: 500 }}>{donation.name}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{donation.amount} €</td>
                  <td>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}>
                      {donation.method}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{donation.timestamp}</td>
                  <td>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
        Besoin d&apos;aide ? Contactez le support technique au 01 00 00 00 00
      </footer>
    </div>
  );
}
