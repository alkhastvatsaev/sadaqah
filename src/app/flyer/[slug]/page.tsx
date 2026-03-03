'use client';

import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { STRASBOURG_MOSQUES } from '../../data/mosques';
import Link from 'next/link';

export default function MosqueFlyer() {
  const params = useParams();
  const slug = params.slug as string;
  const mosque = STRASBOURG_MOSQUES.find(m => m.slug === slug);

  if (!mosque) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Mosquée non trouvée</div>;

  const url = `https://sadaqah-mosque-ruddy.vercel.app/?m=${mosque.slug}`;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'white', 
      color: '#040702', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div id="flyer-content" style={{
        width: '100%',
        maxWidth: '500px',
        border: '2px solid #f0f0f0',
        borderRadius: '40px',
        padding: '3.5rem 2.5rem',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 800, 
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #040702 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '0.9'
          }}>
            Sadaqah<br />App
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#666', 
            marginBottom: '2.5rem',
            fontWeight: 500
          }}>
            Faites un don en 3 secondes
          </p>

          <div style={{ 
            background: 'white',
            padding: '1.5rem',
            borderRadius: '30px',
            display: 'inline-block',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginBottom: '2.5rem',
            border: '1px solid #f0f0f0'
          }}>
            <QRCode 
              value={url}
              size={250}
              level="H"
            />
          </div>

          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            marginBottom: '0.5rem' 
          }}>
            {mosque.name}
          </h2>
          
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#888',
            maxWidth: '280px',
            margin: '0 auto 2.5rem'
          }}>
            Scannez pour soutenir votre mosquée via Apple Pay, Google Pay ou Carte Bancaire.
          </p>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1.5rem',
            opacity: 0.6
          }}>
             {/* Simple representations of Apple/Google pay logos */}
             <div style={{ fontWeight: 600, fontSize: '0.8rem' }}> Pay</div>
             <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>G Pay</div>
             <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Card</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }} className="no-print">
        <button 
          onClick={() => window.print()}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(16,185,129,0.3)'
          }}
        >
          Imprimer le Flyer
        </button>
        <Link href="/" style={{
          textDecoration: 'none',
          color: '#666',
          padding: '1rem',
          fontSize: '0.9rem'
        }}>
          Retour à l'accueil
        </Link>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body { background: white !important; }
          #flyer-content { border: none !important; box-shadow: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
      `}</style>
    </div>
  );
}
