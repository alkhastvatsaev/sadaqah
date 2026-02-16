'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminPortal() {
  const systemStatus = [
    { name: 'API Gateway', status: 'online' },
    { name: 'Stripe Integration', status: 'online' },
    { name: 'Mail Service (Resend)', status: 'online' },
    { name: 'Database Connect', status: 'online' },
  ];

  const pendingMosques = [
    { id: 101, name: 'Mosquée Al-Fath', city: 'Lyon', email: 'contact@alfath.fr', date: 'Aujourd\'hui' },
    { id: 102, name: 'Association Annour', city: 'Marseille', email: 'annour@gmail.com', date: 'Hier' },
  ];

  const devLogs = [
    '[15:42:01] INFO: Stripe Session Created (id: cs_test_123)',
    '[15:43:10] WARN: Multiple checkout attempts for session cs_test_123',
    '[15:45:05] SUCCESS: Mosque Registration Email sent to alkhastvatsaev@gmail.com',
    '[15:46:12] INFO: New Admin Portal accessed by manager_01',
  ];

  return (
    <div className="dashboard-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Centre de Contrôle</h1>
            <span className="admin-badge badge-dev">Dev</span>
            <span className="admin-badge badge-manager">Manager</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Vue globale du système et gestion des mosquées</p>
        </div>
        <Link href="/" className="mosque-portal-link" style={{ position: 'relative', top: 0, right: 0 }}>
          Quitter l&apos;Admin
        </Link>
      </header>

      <div className="dashboard-grid">
        {/* Section Manager: Statistiques Globales */}
        <div className="stat-card">
          <div className="stat-label">Total Dons Plateforme</div>
          <div className="stat-value">1,450,230 €</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mosquées Actives</div>
          <div className="stat-value">124</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Donateurs Uniques</div>
          <div className="stat-value">45,892</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '3rem' }}>
        
        {/* Section Manager: Mosquées en attente */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Validation des Mosquées</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mosquée</th>
                <th>Ville</th>
                <th>E-mail</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingMosques.map((mosque) => (
                <tr key={mosque.id}>
                  <td>{mosque.name}</td>
                  <td>{mosque.city}</td>
                  <td style={{ fontSize: '0.8rem' }}>{mosque.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>Valider</button>
                      <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Refuser</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Dev: État du système */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>État Système</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {systemStatus.map((s, i) => (
              <div key={i} className="system-card">
                <div className={`status-indicator status-${s.status}`}></div>
                <div style={{ fontSize: '0.9rem', flex: 1 }}>{s.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>Stable</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: '2rem' }}>Logs Serveur</h2>
          <div className="log-scroll">
            {devLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.5rem' }}>{log}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
