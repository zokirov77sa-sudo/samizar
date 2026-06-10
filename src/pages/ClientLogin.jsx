import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Gem, Phone, Lock, LogIn, Loader2 } from 'lucide-react';

export default function ClientLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format phone number to numbers only for search if needed, or just exact match
      const q = query(collection(db, 'customers'), where('phone', '==', phone), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const customer = querySnapshot.docs[0];
        localStorage.setItem('bmc_customer_id', customer.id);
        navigate('/profile');
      } else {
        setError("Telefon raqam yoki parol noto'g'ri.");
      }
    } catch (err) {
      console.error(err);
      setError("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#0a0a0a', color: '#fff' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '1.25rem' }}>
            <Gem size={30} color="#d4af37" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>Shaxsiy Profil</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Mijozlar uchun xotiralarni boshqarish</p>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(20,20,20,0.9)' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.84rem', color: '#bbb' }}>Telefon raqamingiz</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+998901234567" 
                  required 
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.85rem 1rem 0.85rem 2.8rem', color: '#fff', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.84rem', color: '#bbb' }}>Parol (Admin bergan)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.85rem 1rem 0.85rem 2.8rem', color: '#fff', outline: 'none' }} 
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#f87171' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #d4af37, #f1cf5b)', color: '#000', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Tekshirilmoqda...</> : <><LogIn size={18} /> Profilga Kirish</>}
            </button>
          </form>
        </div>
      </div>
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
