import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Gem, Mail, Lock, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/dashboard', { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email yoki parol noto'g'ri.");
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '1.25rem', boxShadow: '0 8px 32px rgba(212,175,55,0.15)' }}>
            <Gem size={30} color="#d4af37" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>BMC Admin</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Boshqaruv paneliga kirish</p>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(20,20,20,0.9)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.84rem', color: '#bbb', fontWeight: 500 }}>Email manzil</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input type="email" className="input-glass" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bmc.uz" required style={{ paddingLeft: '2.8rem', background: '#1a1a1a', borderRadius: '12px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.84rem', color: '#bbb', fontWeight: 500 }}>Parol</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input type={showPass ? 'text' : 'password'} className="input-glass" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingLeft: '2.8rem', paddingRight: '3rem', background: '#1a1a1a', borderRadius: '12px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#f87171' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '12px', fontSize: '1rem', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Tekshirilmoqda...</> : <><LogIn size={18} /> Kirish</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.78rem', color: '#3a3a3a' }}>
          © {new Date().getFullYear()} BMC Luxury Jewelry
        </p>
      </div>
    </div>
  );
}
