import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Music, Lock, Unlock, Play, Pause, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function CustomerPage() {
  const { id } = useParams(); // id corresponds to user_id
  const [isPlaying, setIsPlaying] = useState(false);
  const [scratched, setScratched] = useState({});
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [memories, setMemories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);

      const [profRes, memRes, coupRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('memories').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').eq('user_id', id).order('created_at', { ascending: true })
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
  }, [id]);

  const handleScratch = async (couponId) => {
    setScratched(prev => ({ ...prev, [couponId]: true }));
    // Update it in database to 'claimed'
    await supabase.from('coupons').update({ is_claimed: true }).eq('id', couponId);
  };

  if (loading) {
    return <div className="min-h-screen bg-samizar-burgundy flex items-center justify-center"><Loader2 className="text-samizar-rosegold animate-spin" size={40}/></div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-samizar-burgundy flex items-center justify-center text-white font-serif text-2xl">Loyiha topilmadi :(</div>;
  }

  return (
    <div className="min-h-screen bg-samizar-burgundy font-sans text-samizar-light overflow-x-hidden selection:bg-samizar-rosegold selection:text-samizar-burgundy relative">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-samizar-rosegold/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar / Top */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="flex flex-col items-center mx-auto">
          <Heart className="w-8 h-8 text-samizar-rosegold mb-1" strokeWidth={1.5} />
          <span className="font-serif tracking-[0.3em] text-sm text-samizar-rosegold uppercase">Samizar</span>
        </div>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute right-6 p-3 rounded-full bg-samizar-dark/50 backdrop-blur-md border border-samizar-rosegold/30 text-samizar-rosegold transition-all hover:bg-samizar-rosegold/20"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-md mx-auto relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p className="text-samizar-rosegold/70 text-xs tracking-widest uppercase mb-4">{profile.est_date}</p>
          <h1 className="font-serif text-5xl text-samizar-light mb-4 leading-tight">
            Our <br /> Memories
          </h1>
          <p className="text-samizar-rosegold font-serif italic text-xl">{profile.couple_names}</p>
          <div className="h-16 w-px bg-gradient-to-b from-samizar-rosegold/50 to-transparent mx-auto mt-8" />
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
              <p className="absolute bottom-4 left-0 w-full text-center text-samizar-burgundy font-serif italic text-sm">
                {mem.caption}
              </p>
            </motion.div>
          ))}
          {memories.length === 0 && <p className="text-samizar-rosegold/50">Xotiralar hali yuklanmagan.</p>}
        </div>

        {/* Love Coupons Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h2 className="font-serif text-3xl text-samizar-light mb-8 text-center">Your Love <br/> Coupons</h2>
          
          <div className="flex flex-col gap-4">
            {coupons.map((coupon, idx) => (
              <div 
                key={coupon.id}
                onClick={() => !coupon.is_claimed && !scratched[coupon.id] && handleScratch(coupon.id)}
                className="relative h-24 rounded-lg overflow-hidden cursor-pointer group"
              >
                {/* Underneath (Revealed state) */}
                <div className="absolute inset-0 bg-samizar-dark border border-samizar-rosegold/30 rounded-lg flex items-center justify-between px-6">
                  <div>
                    <p className="text-samizar-rosegold/60 text-xs tracking-wider mb-1">COUPON #{String(idx + 1).padStart(3, '0')}</p>
                    <p className="text-samizar-light font-medium">{coupon.title}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-samizar-rosegold/10 flex items-center justify-center text-samizar-rosegold">
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
                  <div className="flex items-center gap-2 text-samizar-burgundy/80 font-medium tracking-wide">
                    {coupon.is_claimed ? <Unlock size={16} /> : <Lock size={16} />}
                    <span>{coupon.is_claimed ? "ALREADY CLAIMED" : "SCRATCH TO REVEAL"}</span>
                  </div>
                </motion.div>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-center text-samizar-rosegold/50">Hali kuponlar yo'q.</p>}
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
