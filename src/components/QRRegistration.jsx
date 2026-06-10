import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, User, Calendar, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function QRRegistration({ qrLink, onRegistered }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    coupleNames: '',
    estDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      
      const user = authData.user;
      if (!user) throw new Error("Foydalanuvchi yaratilmadi!");

      // 2. Create profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          couple_names: formData.coupleNames,
          est_date: formData.estDate,
        }
      ]);

      if (profileError) {
        // If it already exists it's fine, but mostly it shouldn't
        console.warn(profileError);
      }

      // 3. Update qr_link to sold and link to user_id
      const { error: qrError } = await supabase.from('qr_links').update({
        status: 'sold',
        user_id: user.id,
        soldAt: new Date().toISOString(),
        customerEmail: formData.email
      }).eq('id', qrLink.id);

      if (qrError) throw qrError;

      // Successfully registered and linked!
      onRegistered();

    } catch (err) {
      console.error(err);
      setError(err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-[#3b1c24] flex items-center justify-center p-4 text-[#fdfcfc] font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-[#c88c75]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#4a2530] border border-[#c88c75]/20 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#c88c75]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c88c75]/30">
            <Heart size={28} className="text-[#c88c75]" />
          </div>
          <h1 className="text-2xl font-serif text-[#c88c75] mb-2">Maxsus Xotira</h1>
          <p className="text-[#ae939a] text-sm">O'zingizning "Living Album"ingizni yaratish uchun quyidagi ma'lumotlarni kiriting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#dcbfc6] mb-1 uppercase tracking-wider">Ismlaringiz (Siz va U)</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ae939a]" />
              <input 
                type="text" name="coupleNames" required
                value={formData.coupleNames} onChange={handleChange}
                placeholder="Masalan: Sardor & Madina"
                className="w-full bg-[#5a2d3a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#c88c75]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#dcbfc6] mb-1 uppercase tracking-wider">Tanishgan yoki To'y Sanasi</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ae939a]" />
              <input 
                type="text" name="estDate" required
                value={formData.estDate} onChange={handleChange}
                placeholder="01.01.2026"
                className="w-full bg-[#5a2d3a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#c88c75]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#dcbfc6] mb-1 uppercase tracking-wider">Elektron Pochta</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ae939a]" />
              <input 
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                placeholder="Sizning pochtangiz"
                className="w-full bg-[#5a2d3a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#c88c75]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#dcbfc6] mb-1 uppercase tracking-wider">Parol o'ylab toping</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ae939a]" />
              <input 
                type="password" name="password" required minLength="6"
                value={formData.password} onChange={handleChange}
                placeholder="Kamida 6 ta belgi"
                className="w-full bg-[#5a2d3a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#c88c75]/50 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-[#c88c75] to-[#e2b19e] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Albumni Yaratish'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
