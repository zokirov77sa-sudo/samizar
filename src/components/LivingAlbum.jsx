import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock, Unlock, Play, Pause, Loader2, Settings } from 'lucide-react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function LivingAlbum({ userId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scratched, setScratched] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(true); // Default show player
  const [playingVoice, setPlayingVoice] = useState(false);
  const [quizModal, setQuizModal] = useState({ open: false, coupon: null, question: '', answer: '', input: '', error: '' });

  const [profile, setProfile] = useState(null);
  const [memories, setMemories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const themeTokens = {
    dark: {
      bg: 'bg-[#3b1c24]',
      text: 'text-[#fdfcfc]',
      accent: 'text-[#c88c75]',
      accentBg: 'bg-[#c88c75]',
      accentLight: 'bg-[#c88c75]/20',
      border: 'border-[#c88c75]/30',
      glow: 'rgba(200,140,117,0.15)',
      gradientFrom: 'from-[#c88c75]',
      gradientVia: 'via-[#e2b19e]'
    },
    gold: {
      bg: 'bg-[#111111]',
      text: 'text-[#fdfcfc]',
      accent: 'text-[#d4af37]',
      accentBg: 'bg-[#d4af37]',
      accentLight: 'bg-[#d4af37]/20',
      border: 'border-[#d4af37]/30',
      glow: 'rgba(212,175,55,0.15)',
      gradientFrom: 'from-[#d4af37]',
      gradientVia: 'via-[#f1c40f]'
    }
  };

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

  const attemptCoupon = (coupon) => {
    if (coupon.is_claimed || scratched[coupon.id]) return;
    
    let isQuiz = false;
    let question = '';
    let answer = '';
    try {
      const parsed = JSON.parse(coupon.title);
      if (parsed.name && parsed.q && parsed.a) {
        isQuiz = true;
        question = parsed.q;
        answer = parsed.a;
      }
    } catch(e) {}

    if (isQuiz) {
      setQuizModal({ open: true, coupon, question, answer, input: '', error: '' });
    } else {
      handleScratch(coupon.id);
    }
  };

  const submitQuiz = () => {
    if (quizModal.input.trim().toLowerCase() === quizModal.answer.trim().toLowerCase()) {
      handleScratch(quizModal.coupon.id);
      setQuizModal({ open: false, coupon: null, question: '', answer: '', input: '', error: '' });
    } else {
      setQuizModal({ ...quizModal, error: 'Notog\'ri javob! Qayta urinib ko\'ring.' });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#111] flex items-center justify-center"><Loader2 className="text-[#c88c75] animate-spin" size={40}/></div>;
  }

  const displayProfile = profile || { couple_names: 'Sizning Albomingiz', est_date: new Date().getFullYear().toString(), theme: 'dark', voice_memo_url: '' };
  const musicUrl = displayProfile.spotify_url || '';
  const currentTheme = themeTokens[displayProfile.theme] || themeTokens.dark;

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      return { type: 'audio', url };
    }
    if (url.includes('spotify.com/track/')) {
      const id = url.split('track/')[1].split('?')[0];
      return { type: 'iframe', url: `https://open.spotify.com/embed/track/${id}?utm_source=generator` };
    }
    if (url.includes('yandex')) {
      const albumMatch = url.match(/album\/(\d+)/);
      const trackMatch = url.match(/track\/(\d+)/);
      if (albumMatch && trackMatch) {
        return { type: 'iframe', url: `https://music.yandex.ru/iframe/#track/${trackMatch[1]}/${albumMatch[1]}` };
      } else if (trackMatch) {
        return { type: 'iframe', url: `https://music.yandex.ru/iframe/#track/${trackMatch[1]}` };
      }
    }
    return null;
  };

  const embedData = getEmbedUrl(musicUrl);

  const toggleMusic = () => {
    if (embedData) {
      setShowPlayer(!showPlayer);
    } else if (musicUrl) {
      window.open(musicUrl, '_blank');
    } else {
      alert("Musiqa ulanmagan! Sozlamalardan musiqa linkini qo'shing.");
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} font-sans ${currentTheme.text} overflow-x-hidden selection:${currentTheme.accentBg} selection:text-[#111] relative transition-colors duration-1000`}>
      
      {/* Background ambient glow - optimized for performance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] pointer-events-none" style={{ background: `radial-gradient(circle, ${currentTheme.glow} 0%, transparent 60%)` }} />

      {/* Navbar / Top */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="flex flex-col items-center mx-auto">
          <Heart className={`w-8 h-8 ${currentTheme.accent} mb-1`} strokeWidth={1.5} />
          <span className={`font-serif tracking-[0.3em] text-sm ${currentTheme.accent} uppercase`}>Samizar</span>
        </div>
        <div className="absolute right-6 flex items-center gap-3">
          <Link to="/dashboard" className={`p-3 rounded-full bg-[#141414]/50 backdrop-blur-md border ${currentTheme.border} ${currentTheme.accent} transition-all hover:${currentTheme.accentLight}`}>
            <Settings size={18} />
          </Link>
          <button 
            onClick={toggleMusic}
            className={`p-3 rounded-full bg-[#141414]/50 backdrop-blur-md border ${currentTheme.border} ${currentTheme.accent} transition-all hover:${currentTheme.accentLight}`}
          >
            {showPlayer ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      </nav>

      {/* Voice Memo Player */}
      {displayProfile.voice_memo_url && (
        <div className={`fixed bottom-6 right-6 z-50`}>
          <button 
            onClick={() => {
              const audio = document.getElementById('voiceMemoAudio');
              if (playingVoice) { audio.pause(); setPlayingVoice(false); }
              else { audio.play(); setPlayingVoice(true); }
            }}
            className={`flex items-center gap-3 px-5 py-4 rounded-[24px] backdrop-blur-xl border ${currentTheme.border} ${currentTheme.accentLight} shadow-2xl transition-all duration-300 hover:scale-105 group`}
          >
            <div className={`w-10 h-10 rounded-full ${currentTheme.accentBg} text-[#111] flex items-center justify-center`}>
              {playingVoice ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
            </div>
            <div className="text-left">
              <p className={`text-xs ${currentTheme.accent} opacity-80 uppercase tracking-widest font-bold mb-0.5`}>Maxsus Xabar</p>
              <p className="text-white text-sm font-medium">Ovozli yozuvni eshitish</p>
            </div>
          </button>
          <audio 
            id="voiceMemoAudio" 
            src={displayProfile.voice_memo_url} 
            onEnded={() => setPlayingVoice(false)}
            className="hidden" 
          />
        </div>
      )}

      {/* Embedded Player */}
      {showPlayer && embedData && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 rounded-xl overflow-hidden shadow-2xl bg-[#111] border border-white/10"
        >
          {embedData.type === 'iframe' ? (
            <iframe 
              src={embedData.url} 
              width="100%" 
              height={embedData.url.includes('yandex') ? "150" : "152"} 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              style={{ borderRadius: '12px' }}
            ></iframe>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              <span className={`text-xs ${currentTheme.accent} font-bold uppercase tracking-widest`}>FONDAGI MUSIQA</span>
              <audio controls src={embedData.url} className="w-full h-10 outline-none" />
            </div>
          )}
        </motion.div>
      )}

      <main className="pt-32 pb-24 px-6 max-w-md mx-auto relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p className={`${currentTheme.accent} opacity-70 text-xs tracking-widest uppercase mb-4`}>{displayProfile.est_date}</p>
          <h1 className="font-serif text-5xl text-[#fdfcfc] mb-4 leading-tight">
            Our <br /> Memories
          </h1>
          <p className={`${currentTheme.accent} font-serif italic text-xl`}>{displayProfile.couple_names}</p>
          <div className={`h-16 w-px bg-gradient-to-b ${currentTheme.gradientFrom} to-transparent mx-auto mt-8 opacity-50`} />
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
              <p className="absolute bottom-4 left-0 w-full text-center text-[#111] font-serif italic text-sm">
                {mem.caption}
              </p>
            </motion.div>
          ))}
          {memories.length === 0 && <p className={`${currentTheme.accent} opacity-50`}>Xotiralar hali yuklanmagan.</p>}
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
            {coupons.map((coupon, idx) => {
              let displayTitle = coupon.title;
              let isQuiz = false;
              try {
                const parsed = JSON.parse(coupon.title);
                if (parsed.name) {
                  displayTitle = parsed.name;
                  isQuiz = true;
                }
              } catch(e) {}

              return (
              <div 
                key={coupon.id}
                onClick={() => attemptCoupon(coupon)}
                className="relative h-24 rounded-lg overflow-hidden cursor-pointer group"
              >
                {/* Underneath (Revealed state) */}
                <div className={`absolute inset-0 bg-[#141414] border ${currentTheme.border} rounded-lg flex items-center justify-between px-6`}>
                  <div>
                    <p className={`${currentTheme.accent} opacity-60 text-xs tracking-wider mb-1`}>COUPON #{String(idx + 1).padStart(3, '0')}</p>
                    <p className="text-[#fdfcfc] font-medium">{displayTitle}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${currentTheme.accentLight} flex items-center justify-center ${currentTheme.accent}`}>
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
                  className={`absolute inset-0 bg-gradient-to-r ${currentTheme.gradientFrom} ${currentTheme.gradientVia} ${currentTheme.gradientFrom} flex items-center justify-center pointer-events-none origin-center`}
                  style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}
                >
                  <div className="flex items-center gap-2 text-[#111]/80 font-medium tracking-wide">
                    {coupon.is_claimed ? <Unlock size={16} /> : <Lock size={16} />}
                    <span>{coupon.is_claimed ? "ALREADY CLAIMED" : "SCRATCH TO REVEAL"}</span>
                    {isQuiz && !coupon.is_claimed && <span className="ml-2 text-[10px] bg-black/20 px-2 py-0.5 rounded-full">VIKTORINA</span>}
                  </div>
                </motion.div>
              </div>
            )})}
            {coupons.length === 0 && <p className={`text-center ${currentTheme.accent} opacity-50`}>Hali kuponlar yo'q.</p>}
          </div>
          <style>{`
            @keyframes shimmer {
              to { background-position: 200% center; }
            }
          `}</style>
        </motion.div>

      </main>
      {/* Quiz Modal */}
      {quizModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm ${currentTheme.cardBg} border ${currentTheme.border} p-6 rounded-3xl shadow-2xl`}>
            <div className={`w-12 h-12 rounded-full ${currentTheme.accentLight} text-[#111] flex items-center justify-center mb-4 ${currentTheme.accent}`}>
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-serif text-white mb-2">Sirli Kupon!</h3>
            <p className="text-gray-400 text-sm mb-6">Ushbu kuponni ochish uchun savolga to'g'ri javob bering:</p>
            
            <div className={`p-4 rounded-xl ${currentTheme.accentLight} border ${currentTheme.border} mb-6`}>
              <p className={`text-sm ${currentTheme.accent} font-medium`}>{quizModal.question}</p>
            </div>

            <input 
              type="text" 
              value={quizModal.input}
              onChange={e => setQuizModal({...quizModal, input: e.target.value})}
              placeholder="Javobingiz..."
              className={`w-full bg-[#111] border ${currentTheme.border} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors mb-2`}
            />
            {quizModal.error && <p className="text-red-400 text-xs mb-4">{quizModal.error}</p>}
            {!quizModal.error && <div className="mb-4"></div>}

            <div className="flex gap-3">
              <button 
                onClick={() => setQuizModal({ ...quizModal, open: false })}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={submitQuiz}
                className={`flex-1 py-3 rounded-xl ${currentTheme.accentBg} text-[#111] font-bold hover:opacity-90 transition-opacity`}
              >
                Tekshirish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
