import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock, Unlock, Play, Pause, Loader2, Settings } from 'lucide-react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function LivingAlbum({ userId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scratched, setScratched] = useState({});
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [memories, setMemories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setLoading(true);

      const [profRes, memRes, coupRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('memories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').eq('user_id', userId).order('created_at', { ascending: true })
      ]);

      if (profRes.data) setProfile(profRes.data);
      if (memRes.data) {
        // assign random rotation and yOffset to memories for the cascade effect
        const positionedMemories = memRes.data.map(m => ({
          ...m,
          rotation: (Math.random() * 10) - 5,
          yOffset: (Math.random() * 40) - 20
        }));
        setMemories(positionedMemories);
      }
      if (coupRes.data) setCoupons(coupRes.data);

      setLoading(false);
    }
    fetchData();
  }, [userId]);

  const handleScratch = async (couponId) => {
    setScratched(prev => ({ ...prev, [couponId]: true }));
    // Update it in database to 'claimed'
    await supabase.from('coupons').update({ is_claimed: true }).eq('id', couponId);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#3b1c24] flex items-center justify-center"><Loader2 className="text-[#c88c75] animate-spin" size={40}/></div>;
  }

  const displayProfile = profile || { couple_names: 'Sizning Albomingiz', est_date: new Date().getFullYear().toString() };

  return (
    <div className="min-h-screen bg-[#3b1c24] font-sans text-[#fdfcfc] overflow-x-hidden selection:bg-[#c88c75] selection:text-[#3b1c24] relative">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-[#c88c75]/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar / Top */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="flex flex-col items-center mx-auto">
          <Heart className="w-8 h-8 text-[#c88c75] mb-1" strokeWidth={1.5} />
          <span className="font-serif tracking-[0.3em] text-sm text-[#c88c75] uppercase">Samizar</span>
        </div>
        <div className="absolute right-6 flex items-center gap-3">
          <Link to="/dashboard" className="p-3 rounded-full bg-[#141414]/50 backdrop-blur-md border border-[#c88c75]/30 text-[#c88c75] transition-all hover:bg-[#c88c75]/20">
            <Settings size={18} />
          </Link>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-[#141414]/50 backdrop-blur-md border border-[#c88c75]/30 text-[#c88c75] transition-all hover:bg-[#c88c75]/20"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-md mx-auto relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p className="text-[#c88c75]/70 text-xs tracking-widest uppercase mb-4">{displayProfile.est_date}</p>
          <h1 className="font-serif text-5xl text-[#fdfcfc] mb-4 leading-tight">
            Our <br /> Memories
          </h1>
          <p className="text-[#c88c75] font-serif italic text-xl">{displayProfile.couple_names}</p>
          <div className="h-16 w-px bg-gradient-to-b from-[#c88c75]/50 to-transparent mx-auto mt-8" />
        </motion.div>

        {/* Memory Grid (Cascade Style) */}
        <div className="flex flex-col items-center gap-12 mb-24">
          {memories.map((mem, i) => (
            <motion.div
              key={mem.id}
              initial={{ opacity: 0, y: 50, rotate: 0 }}
              whileInView={{ opacity: 1, y: mem.yOffset, rotate: mem.rotation }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
              className="relative w-72 bg-[#fdfcfc] p-3 pb-12 shadow-2xl rounded-sm group cursor-pointer transition-all"
              style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
            >
              <div className="w-full aspect-square overflow-hidden bg-gray-200">
                <img 
                  src={mem.image_url} 
                  alt={mem.caption} 
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <p className="absolute bottom-4 left-0 w-full text-center text-[#3b1c24] font-serif italic text-sm">
                {mem.caption}
              </p>
            </motion.div>
          ))}
          {memories.length === 0 && <p className="text-[#c88c75]/50">Xotiralar hali yuklanmagan.</p>}
        </div>

        {/* Love Coupons Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h2 className="font-serif text-3xl text-[#fdfcfc] mb-8 text-center">Your Love <br/> Coupons</h2>
          
          <div className="flex flex-col gap-4">
            {coupons.map((coupon, idx) => (
              <div 
                key={coupon.id}
                onClick={() => !coupon.is_claimed && !scratched[coupon.id] && handleScratch(coupon.id)}
                className="relative h-24 rounded-lg overflow-hidden cursor-pointer group"
              >
                {/* Underneath (Revealed state) */}
                <div className="absolute inset-0 bg-[#141414] border border-[#c88c75]/30 rounded-lg flex items-center justify-between px-6">
                  <div>
                    <p className="text-[#c88c75]/60 text-xs tracking-wider mb-1">COUPON #{String(idx + 1).padStart(3, '0')}</p>
                    <p className="text-[#fdfcfc] font-medium">{coupon.title}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#c88c75]/10 flex items-center justify-center text-[#c88c75]">
                    <Heart size={16} className={scratched[coupon.id] || coupon.is_claimed ? "fill-current" : ""} />
                  </div>
                </div>

                {/* Cover (Scratch state) */}
                <motion.div 
                  initial={false}
                  animate={{ 
                    opacity: scratched[coupon.id] || coupon.is_claimed ? 0 : 1,
                    scale: scratched[coupon.id] || coupon.is_claimed ? 1.1 : 1
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-[#c88c75] via-[#e2b19e] to-[#c88c75] flex items-center justify-center pointer-events-none origin-center"
                  style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}
                >
                  <div className="flex items-center gap-2 text-[#3b1c24]/80 font-medium tracking-wide">
                    {coupon.is_claimed ? <Unlock size={16} /> : <Lock size={16} />}
                    <span>{coupon.is_claimed ? "ALREADY CLAIMED" : "SCRATCH TO REVEAL"}</span>
                  </div>
                </motion.div>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-center text-[#c88c75]/50">Hali kuponlar yo'q.</p>}
          </div>
          <style>{`
            @keyframes shimmer {
              to { background-position: 200% center; }
            }
          `}</style>
        </motion.div>

      </main>
    </div>
  );
}
