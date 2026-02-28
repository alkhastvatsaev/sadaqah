'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import QRCode from 'react-qr-code';
import { STRASBOURG_MOSQUES, type Mosque } from './data/mosques';

// Load Stripe outside of component to avoid recreating it
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

// Predefined donation amounts
const PRESET_AMOUNTS = [2, 5, 10, 20, 50, 100, 'Autre'];


// Calculate distance between two GPS coordinates (Haversine formula)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Independent background component to avoid hydration issues
function BackgroundCalligraphy() {
  return (
    <div className="background-calligraphy">
      مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ
    </div>
  );
}

// Apple-style vertical wheel picker
function WheelPicker({ options, selectedIndex, onChange }: { options: (number | string)[], selectedIndex: number, onChange: (index: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 60; // Has to match the css and scroll logic

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const targetTop = selectedIndex * itemHeight;
      if (Math.abs(containerRef.current.scrollTop - targetTop) > 5) {
        containerRef.current.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    const newIndex = Math.round(top / itemHeight);
    
    // Clear any existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only update if it's a valid new index
    if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < options.length) {
      // Small delay to ensure smooth scrolling isn't interrupted by re-renders
      timeoutRef.current = setTimeout(() => {
        onChange(newIndex);
      }, 50);
    }
  };

  const handleOptionClick = (idx: number) => {
    onChange(idx);
  };

  return (
    <div className="wheel-picker-container">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="hide-scrollbar"
      >
        <div style={{ height: '70px' }}></div>
        {options.map((opt, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div 
              key={typeof opt === 'string' ? opt : `preset-${opt}`}
              style={{
                height: `${itemHeight}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '3rem' : '1.5rem',
                fontWeight: isSelected ? 800 : 500,
                color: isSelected ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s ease-out'
              }}
            >
              <div 
                style={{ cursor: 'pointer', width: '100%', textAlign: 'center', pointerEvents: 'auto' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(idx);
                }}
              >
                {typeof opt === 'number' ? `${opt}€` : opt}
              </div>
            </div>
          )
        })}
        <div style={{ height: '70px' }}></div>
      </div>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Internal component for the form inside Elements provider
function CheckoutForm({ amount, finalAmount, mosqueName, onCancel }: { amount: number, finalAmount: number, mosqueName: string, onCancel: () => void }) {
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
  };

  const handleExpressConfirm = async (event: any) => {
    if (!stripe || !elements) return;

    // The event already contains the confirmation logic for ExpressCheckout
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?success=true&mosqueName=${encodeURIComponent(mosqueName)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'Une erreur est survenue.');
    }
  };


  return (
    <form onSubmit={handleSubmit} className="payment-form">
      {/* Bouton Apple Pay / Google Pay explicite */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ExpressCheckoutElement onConfirm={handleExpressConfirm as any} />
      </div>

      <div style={{ position: 'relative', margin: '2rem 0', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '50%', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
        <span style={{ position: 'relative', background: '#1f293700', padding: '0 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', zIndex: 1 }}>ou par carte</span>
      </div>

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
        {isSubmitting ? 'Traitement...' : `Payer ${finalAmount.toFixed(2)}€`}
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
// Separate component for the Express Checkout on the landing page to use Stripe hooks
function ExpressCheckoutSection({ amount, mosqueName, coverFees, isValid }: { amount: number, mosqueName: string, coverFees: boolean, isValid: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isValid) return null;

  const handleConfirm = async (event: any) => {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    try {
      // 1. Create the Payment Intent on the fly
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, mosqueName, coverFees }),
      });
      
      const { clientSecret } = await res.json();

      // 2. Confirm the payment with the secret we just got
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/?success=true&mosqueName=${encodeURIComponent(mosqueName)}`,
        },
      });

      if (error) {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors du paiement express');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem', minHeight: '48px' }}>
      <ExpressCheckoutElement 
        onConfirm={handleConfirm}
        options={{
          buttonType: {
            applePay: 'donate',
            googlePay: 'donate',
          },
          buttonTheme: {
            applePay: 'white-outline',
            googlePay: 'black',
          }
        }}
      />
    </div>
  );
}
function HomeContent() {
  const [sliderIndex, setSliderIndex] = useState<number>(2); // defaults to 10€
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMosque, setSelectedMosque] = useState<Mosque>(STRASBOURG_MOSQUES[0]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [coverFees, setCoverFees] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMosqueSelector, setShowMosqueSelector] = useState(false);
  const [mosqueSearch, setMosqueSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const mosqueName = selectedMosque.name;

  const presetVal = PRESET_AMOUNTS[sliderIndex];
  const currentAmount = isCustom ? (customAmount ? Number(customAmount) : 0) : (typeof presetVal === 'number' ? presetVal : 0);
  const isValidAmount = currentAmount > 0;

  const STRIPE_FEE_PERCENTAGE = 0.017;
  const STRIPE_FIXED_FEE = 0.25;
  const totalAmount = (isValidAmount && coverFees)
    ? Math.round(((currentAmount + STRIPE_FIXED_FEE) / (1 - STRIPE_FEE_PERCENTAGE)) * 100) / 100
    : currentAmount;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const success = searchParams.get('success');
      if (success) {
        setIsSuccess(true);
        const name = searchParams.get('mosqueName');
        if (name) {
          const m = STRASBOURG_MOSQUES.find(m => m.name === decodeURIComponent(name));
          if (m) setSelectedMosque(m);
        }
      }

      // Check for mosque in URL (slug or siret)
      const mosqueId = searchParams.get('m');
      if (mosqueId) {
        const m = STRASBOURG_MOSQUES.find(m => 
          m.slug === mosqueId || m.siret === mosqueId || m.id.toString() === mosqueId
        );
        if (m) {
          setSelectedMosque(m);
          setIsLocked(true); // Lock the selection for QR scans
        }
      }

      // Request geolocation
      if (navigator.geolocation && !mosqueId) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {} // silently fail
        );
      }
    }
  }, [searchParams]);

  // Auto-select nearest mosque when location is obtained (ONLY if not locked by URL)
  useEffect(() => {
    if (!userLocation || isLocked) return;
    let nearest = STRASBOURG_MOSQUES[0];
    let minDist = Infinity;
    for (const m of STRASBOURG_MOSQUES) {
      const d = getDistanceKm(userLocation.lat, userLocation.lng, m.lat, m.lng);
      if (d < minDist) {
        minDist = d;
        nearest = m;
      }
    }
    setSelectedMosque(nearest);
  }, [userLocation]);

  // Filter and sort mosques
  const filteredMosques = STRASBOURG_MOSQUES
    .filter(m => 
      m.name.toLowerCase().includes(mosqueSearch.toLowerCase()) ||
      m.address.toLowerCase().includes(mosqueSearch.toLowerCase()) ||
      m.neighborhood.toLowerCase().includes(mosqueSearch.toLowerCase())
    )
    .map(m => ({
      ...m,
      distance: userLocation ? getDistanceKm(userLocation.lat, userLocation.lng, m.lat, m.lng) : null
    }))
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

  if (!mounted) {
    return <main className="main-container"><BackgroundCalligraphy /></main>;
  }

  const handleStartPayment = async () => {
    if (!isValidAmount) return;
    
    setIsLoadingSecret(true);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: currentAmount, mosqueName, coverFees }),
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
        <BackgroundCalligraphy />
        <div className="glass-card success-container">
          <div className="success-icon">✓</div>
          <h1 className="barakallah">Barakallahu feek</h1>
          <p className="subtitle">
            Merci pour votre don. Que Dieu vous récompense grandement.
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
      <BackgroundCalligraphy />
      
      <div className="glass-card" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 
            className="app-logo" 
            onClick={() => setShowQRModal(true)}
            style={{ cursor: 'pointer', lineHeight: '0.9', marginBottom: '0.4rem' }}
          >
            Sadaqah<br />App
          </h1>

          <button
            onClick={() => setShowMosqueSelector(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.82rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s',
              maxWidth: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontWeight: 600 
              }}>
                {mosqueName}
              </span>
              {!isLocked ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(16,185,129,0.6)">
                  <path d="M2 4L5 7L8 4" stroke="rgba(16,185,129,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <div title="Destination vérifiée" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>
            {isLocked && (
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>
                {selectedMosque.address} {selectedMosque.siret ? `• SIRET: ${selectedMosque.siret}` : ''}
              </div>
            )}
            {isLocked && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsLocked(false); setShowMosqueSelector(true); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.2rem 0', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Changer de destination
              </button>
            )}
          </button>
        </div>

        {/* If we have a client secret, show the payment form directly */}
        {clientSecret ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
             <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Montant de la transaction</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{totalAmount.toFixed(2)}€</p>
                {coverFees && <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Dont {(totalAmount - currentAmount).toFixed(2)}€ de frais couverts</p>}
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
                finalAmount={totalAmount}
                mosqueName={mosqueName} 
                onCancel={() => setClientSecret(null)} 
              />
            </Elements>
          </div>
        ) : (
          /* Selection Step */
          <>
            <div style={{ margin: '1rem 0', padding: '1.5rem 0' }}>
              {!isCustom ? (
                <>
                  <WheelPicker 
                    options={PRESET_AMOUNTS}
                    selectedIndex={sliderIndex}
                    onChange={(idx) => {
                      setSliderIndex(idx);
                      if (PRESET_AMOUNTS[idx] === 'Autre') {
                        // Briefly show 'Autre' then switch to custom mode
                        setTimeout(() => setIsCustom(true), 150);
                      }
                    }}
                  />
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '1.5rem',
                      position: 'relative'
                    }}>
                      <input
                        type="number"
                        style={{ 
                          fontSize: '3.5rem', 
                          fontWeight: 700,
                          width: '100%', 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'white', 
                          textAlign: 'center', 
                          outline: 'none',
                          padding: 0,
                          letterSpacing: '-2px',
                          caretColor: 'transparent'
                        }}
                        placeholder="0"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        autoFocus
                      />
                      {customAmount && <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginLeft: '0.5rem', position: 'absolute', right: '3.5rem' }}>€</span>}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => { setIsCustom(false); setCustomAmount(''); }} 
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '24px', 
                          padding: '0.75rem 2rem', 
                          color: 'rgba(255,255,255,0.8)', 
                          fontSize: '0.95rem', 
                          fontWeight: 500, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s', 
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(10px)'
                        }} 
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-1px)'; }} 
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                         Retour
                      </button>
                    </div>
                </div>
              )}
            </div>

            {isValidAmount && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  mode: 'payment',
                  amount: Math.max(Math.round(totalAmount * 100), 50),
                  currency: 'eur',
                  appearance: { theme: 'night' }
                }}
              >
                <ExpressCheckoutSection 
                  amount={currentAmount}
                  mosqueName={mosqueName}
                  coverFees={coverFees}
                  isValid={isValidAmount}
                />
              </Elements>
            )}

            <button 
              className="donate-button"
              disabled={!isValidAmount || isLoadingSecret}
              onClick={handleStartPayment}
              style={{ marginBottom: '0.75rem' }}
            >
              {isLoadingSecret ? 'Chargement...' : (isValidAmount ? `Donner ${totalAmount.toFixed(2)}€` : 'Continuer')}
            </button>

            {isValidAmount && (
              <div 
                style={{ 
                  margin: '0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '1.5rem',
                  padding: '0.5rem 0 1rem', 
                  cursor: 'pointer'
                }}
                onClick={() => setCoverFees(!coverFees)}
              >
                <div style={{ paddingRight: '0.5rem', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    +{(totalAmount - currentAmount).toFixed(2).replace('.', ',')}€ de frais Stripe
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  className="ios-toggle"
                  checked={coverFees} 
                  onChange={(e) => setCoverFees(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}

      </div>


      {/* Apple-style QR Code Modal (Billboard / Flyer Quality) */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '2rem',
          animation: 'fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }} onClick={() => setShowQRModal(false)}>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '40px',
            padding: '3rem 2rem',
            textAlign: 'center',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            {/* Background Glow Effect inside the card for that premium feel */}
            <div style={{
              position: 'absolute',
              top: '-20%', left: '-20%', right: '-20%', bottom: '-20%',
              background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 className="app-logo" style={{ lineHeight: '0.9' }}>
                Sadaqah<br />App
              </h1>
              
              {/* Premium QR Code Container */}
              <div style={{ 
                background: '#ffffff', 
                padding: '1.25rem', 
                borderRadius: '28px',
                display: 'inline-block',
                marginBottom: '3rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(0,0,0,0.05)',
                transform: 'scale(1.05)',
                position: 'relative'
              }}>


                <QRCode 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?m=${selectedMosque.slug}`} 
                  size={220} 
                  bgColor="#ffffff" 
                  fgColor="#040702" 
                  level="H"
                />
              </div>
              
              <button 
                onClick={() => setShowQRModal(false)}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.08)', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '1.2rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Fermer
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link href="/mosquee/register" className="mosque-portal-link">
                  Vous êtes une mosquée ?
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mosque Selector Modal */}
      {showMosqueSelector && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          animation: 'fadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          padding: 'env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0',
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem 1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0 }}>
                Choisir une mosquée
              </h2>
              <button
                onClick={() => { setShowMosqueSelector(false); setMosqueSearch(''); }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Rechercher une mosquée, quartier..."
                value={mosqueSearch}
                onChange={(e) => setMosqueSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem 0.9rem 2.8rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <svg style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.4,
              }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>

            {userLocation && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Triées par distance
              </p>
            )}
          </div>

          {/* Mosque List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 1.5rem 2rem',
            WebkitOverflowScrolling: 'touch',
          }}>
            {filteredMosques.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.4)' }}>
                <p>Aucune mosquée trouvée</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {filteredMosques.map((m) => (
                  <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMosque(m);
                        setShowMosqueSelector(false);
                        setMosqueSearch('');
                        // Update URL with the mosque slug
                        router.push(`/?m=${m.slug}`, { scroll: false });
                      }}
                    style={{
                      background: selectedMosque?.id === m.id
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(255,255,255,0.05)',
                      border: selectedMosque?.id === m.id
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '18px',
                      padding: '1rem 1.2rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{m.name}</p>
                      <p style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '0.75rem',
                        margin: '0.25rem 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{m.address}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {m.distance !== null && (
                        <span style={{
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}>
                          {m.distance < 1
                            ? `${Math.round(m.distance * 1000)}m`
                            : `${m.distance.toFixed(1)}km`
                          }
                        </span>
                      )}
                      <p style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '0.7rem',
                        margin: '0.15rem 0 0 0',
                      }}>{m.neighborhood}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="main-container">
        <div className="background-calligraphy">
          Sadaqah App
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
