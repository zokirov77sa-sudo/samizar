import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowRight, Zap, Shield, Repeat } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '2rem 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
            <div style={{ background: 'var(--accent)', color: '#000', padding: '0.5rem', borderRadius: '8px' }}>
              <QrCode size={24} />
            </div>
            <span>BMC Dynamic QR</span>
          </div>
          <div>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Admin Panel
            </button>
          </div>

        </div>
      </nav>

      <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="animate-fade-in" style={{ inlineSize: 'fit-content', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', marginBottom: '1.5rem', background: 'rgba(212, 175, 55, 0.05)' }}>
          Zargarlik do'konlari uchun maxsus
        </div>
        
        <h1 className="title animate-fade-in delay-1" style={{ maxWidth: '800px', lineHeight: '1.1' }}>
          Sevishganlar uchun <br/>
          <span style={{ color: 'var(--accent)' }}>O'lmas Xotiralar.</span>
        </h1>
        
        <p className="subtitle animate-fade-in delay-2" style={{ maxWidth: '600px', margin: '1.5rem auto 3rem auto' }}>
          Zirak va sepochkalarga bo'sh QR kodlarni bosing va xaridor xohlagan video/rasmni istalgan payt yuklang.
        </p>

        <div className="animate-fade-in delay-3" style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '1rem 2rem' }}>
            Start Managing Now <ArrowRight size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', marginTop: '6rem' }}>
          <div className="glass-card animate-fade-in delay-1">
            <Zap color="var(--accent)" size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Boshida Bo'sh QR</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>Oldindan yuzlab QR kodlarni qog'ozga chiqarib zargarlik buyumlariga yopishtirib tayyorlab qo'yasiz.</p>
          </div>
          <div className="glass-card animate-fade-in delay-2">
            <Repeat color="var(--accent)" size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Video v Rasm Yuklash</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>Xaridor sotib olgandan so'ng u bergan faly yoki videoni o'sha QR kodga tizim orqali yuklab biliktirib qo'yasiz.</p>
          </div>
          <div className="glass-card animate-fade-in delay-3">
            <Shield color="var(--accent)" size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Abadiy Xotira</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>Telefonidan QR kodni skaner qilganda o'zlarining sevgi tarixi yoki videosi ochiladi va saqlanib qoladi.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
