import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Gem, Mail, Lock, LogIn, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
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
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-samizar-burgundy p-4 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-samizar-rosegold/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-samizar-rosegold/10 border border-samizar-rosegold/30 mb-5 shadow-[0_8px_32px_rgba(200,140,117,0.15)]">
            <Gem size={30} className="text-samizar-rosegold" />
          </div>
          <h1 className="text-3xl font-serif text-samizar-light mb-2 tracking-wide">SAMIZAR</h1>
          <p className="text-samizar-rosegold/80 text-sm tracking-wider uppercase font-medium">Memory Cloud</p>
        </div>

        <div className="p-8 border border-samizar-rosegold/15 bg-samizar-dark/90 backdrop-blur-md rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleAuth}>
            <div className="mb-5">
              <label className="block mb-2 text-sm text-samizar-rosegold/70 font-medium uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@example.com" 
                  required 
                  className="w-full pl-11 pr-4 py-3 bg-[#11070a] border border-samizar-rosegold/20 rounded-xl focus:outline-none focus:border-samizar-rosegold text-samizar-light transition-colors"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block mb-2 text-sm text-samizar-rosegold/70 font-medium uppercase tracking-wider">Parol</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="w-full pl-11 pr-12 py-3 bg-[#11070a] border border-samizar-rosegold/20 rounded-xl focus:outline-none focus:border-samizar-rosegold text-samizar-light transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-samizar-rosegold transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-samizar-dark bg-gradient-to-r from-samizar-rosegold to-[#e2b19e] shadow-[0_4px_20px_rgba(200,140,117,0.3)] hover:opacity-90 transition-opacity"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              Tizimga kirish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
