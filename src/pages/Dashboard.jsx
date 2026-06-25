import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Plus, Trash2, LogOut, Loader2, 
  LayoutDashboard, Image as ImageIcon, Gift, Palette, Settings, CreditCard, Menu, X, Share, Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memories, setMemories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [profile, setProfile] = useState({ couple_names: '', est_date: '', spotify_url: '', theme: 'dark', is_premium: false, voice_memo_url: '', subscription_expires_at: null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState('monthly');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  useEffect(() => {
    fetchData();

    // Check if it was captured before React mounted
    if (window.deferredPWA) {
      setDeferredPrompt(window.deferredPWA);
    }

    // Listen for the custom event in case it fires after mount
    const handlePwaReady = () => {
      setDeferredPrompt(window.deferredPWA);
    };
    window.addEventListener('pwa-ready', handlePwaReady);

    // Also listen to the original event just in case
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPWA = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('pwa-ready', handlePwaReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = window.deferredPWA || deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        window.deferredPWA = null;
        setDeferredPrompt(null);
      }
    } else {
      // Show manual instructions modal for iOS/Safari or already installed users
      setShowInstallModal(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    setUser(user);

    if (user.email === 'admin@samizar.uz' || user.email === 'bmcqr@admin.com') {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Fetch Profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) {
      const isPrem = profileData.is_premium || false;
      setProfile({
        ...profileData, 
        theme: profileData.theme || 'dark',
        is_premium: isPrem,
        subscription_expires_at: profileData.subscription_expires_at
      });
      if (!isPrem) {
        setActiveTab('premium');
      }
    }

    // Check if there is a pending payment
    const { data: pendingReq } = await supabase.from('payment_requests').select('*').eq('user_id', user.id).eq('status', 'pending').single();
    if (pendingReq) {
      setPaymentPending(true);
    }

    // Fetch Memories
    const { data: memData } = await supabase.from('memories').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (memData) setMemories(memData);

    // Fetch Coupons
    const { data: coupData } = await supabase.from('coupons').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (coupData) setCoupons(coupData);

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!profile.is_premium && memories.length + files.length > 3) {
      alert("Tekin versiyada faqat 3 tagacha rasm yuklash mumkin. Cheksiz yuklash uchun Premium oling!");
      setActiveTab('premium');
      return;
    }

    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('memories_bucket').upload(filePath, file);
      if (!uploadError) {
        const { data } = supabase.storage.from('memories_bucket').getPublicUrl(filePath);
        await supabase.from('memories').insert([{ user_id: user.id, image_url: data.publicUrl }]);
      }
    }
    
    fetchData();
    setUploading(false);
  };

  const handleDeleteMemory = async (id) => {
    if(confirm('Rasmni o`chirishga ishonchingiz komilmi?')) {
      await supabase.from('memories').delete().eq('id', id);
      fetchData();
    }
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    await supabase.from('profiles').update({
      couple_names: profile.couple_names,
      est_date: profile.est_date,
      spotify_url: profile.spotify_url,
      theme: profile.theme,
      voice_memo_url: profile.voice_memo_url
    }).eq('id', user.id);
    alert('Sozlamalar muvaffaqiyatli saqlandi!');
  };

  const handleAudioUpload = async (e) => {
    if (!profile.is_premium) {
      alert("Ovozli xabar faqat Premium tarifda mavjud!");
      setActiveTab('premium');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `voice_${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('memories_bucket').upload(filePath, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('memories_bucket').getPublicUrl(filePath);
      setProfile({ ...profile, voice_memo_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleAddCoupon = async () => {
    const title = prompt("Kupon nomini kiriting (Masalan: Romantik kechki ovqat):");
    if (!title) return;
    
    const wantsQuiz = confirm("Bu kuponni ochish uchun qiz savolga to'g'ri javob topishi kerak bo'lgan 'Viktorina' qoshishni xohlaysizmi?");
    let quizQuestion = null;
    let quizAnswer = null;
    
    let finalTitle = title;
    if (wantsQuiz) {
      quizQuestion = prompt("Qiz uchun savol (Masalan: Biz birinchi marta qayerda uchrashganmiz?):");
      quizAnswer = prompt("To'g'ri javob:");
      if (quizQuestion && quizAnswer) {
        finalTitle = JSON.stringify({ name: title, q: quizQuestion, a: quizAnswer });
      }
    }

    await supabase.from('coupons').insert([{ 
      user_id: user.id, 
      title: finalTitle,
    }]);
    fetchData();
  };

  const handleDeleteCoupon = async (id) => {
    await supabase.from('coupons').delete().eq('id', id);
    fetchData();
  };

  const handleApplyPromoCode = async () => {
    setPromoError('');
    if(!promoCode) return;
    setSubmittingPayment(true);
    
    // Check if promo code exists and not used
    const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', promoCode).eq('is_used', false).single();
    
    if (promo) {
      // Apply promo
      await supabase.from('profiles').update({ is_premium: true }).eq('id', user.id);
      await supabase.from('promo_codes').update({ is_used: true, used_by: user.id }).eq('id', promo.id);
      alert("Promokod muvaffaqiyatli qo'llanildi! Premium faollashdi.");
      window.location.reload();
    } else {
      setPromoError("Promokod xato yoki ishlatib bo'lingan.");
    }
    setSubmittingPayment(false);
  };

  const handleSubmitPayment = async () => {
    if(!receiptFile) return alert("Iltimos, avval to'lov chekini (skrinshot) yuklang!");
    setSubmittingPayment(true);

    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `receipt_${Date.now()}.${fileExt}`;
    const filePath = `receipts/${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('memories_bucket').upload(filePath, receiptFile);
    
    if (uploadError) {
      alert("Rasm yuklashda xatolik yuz berdi.");
      setSubmittingPayment(false);
      return;
    }

    const { data } = supabase.storage.from('memories_bucket').getPublicUrl(filePath);

    // Generate UUID safely
    function uuidv4() {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ (Math.random() * 256 | 0) & 15 >> c / 4).toString(16)
      );
    }
    let reqId;
    try { reqId = crypto.randomUUID(); } catch(e) { reqId = uuidv4(); }

    // Save request
    const { error: insertError } = await supabase.from('payment_requests').insert([{
      id: reqId,
      user_id: user.id,
      user_email: user.email,
      plan_type: paymentPlan,
      receipt_url: data.publicUrl
    }]);

    if (insertError) {
      alert("Xato: " + insertError.message);
      setSubmittingPayment(false);
      return;
    }

    // Send Telegram Notification
    const BOT_TOKEN = '8946477442:AAHZAuZKTyPq-tzYHUkH55B8s5ZgG6TGD30';
    const CHAT_ID = '2141366575';
    const text = `💰 Yangi to'lov so'rovi tushdi!\n\nMijoz: ${user.email}\nTarif: ${paymentPlan === 'monthly' ? '1 Oylik' : '1 Yillik'}`;
    
    let reply_markup = {
      inline_keyboard: [[
        { text: "✅ Tasdiqlash", callback_data: `approve_${reqId}` }
      ]]
    };

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: CHAT_ID, 
          text: text,
          reply_markup: reply_markup
        })
      });
    } catch(err) {
      console.log("Telegram botga xabar ketmadi:", err);
    }

    setPaymentPending(true);
    setSubmittingPayment(false);
    alert("Chek yuborildi! Admin tez orada tasdiqlaydi.");
  };

  if (loading) return <div className="min-h-screen bg-[#14080b] flex items-center justify-center"><Loader2 className="animate-spin text-[#e2b19e]" size={40}/></div>;

  if (isAdmin) {
    return <AdminDashboard />;
  }

  const isPremium = profile.is_premium;

  const menuItems = [
    { id: 'overview', icon: <LayoutDashboard size={22} strokeWidth={1.5} />, label: 'Asosiy', locked: !isPremium },
    { id: 'memories', icon: <ImageIcon size={22} strokeWidth={1.5} />, label: 'Xotiralar', locked: !isPremium },
    { id: 'coupons', icon: <Gift size={22} strokeWidth={1.5} />, label: 'Kuponlar', locked: !isPremium },
    { id: 'themes', icon: <Palette size={22} strokeWidth={1.5} />, label: 'Dizayn', locked: !isPremium },
    { id: 'settings', icon: <Settings size={22} strokeWidth={1.5} />, label: 'Sozlamalar', locked: !isPremium },
    { id: 'premium', icon: <CreditCard size={22} strokeWidth={1.5} />, label: 'To\'lov', locked: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c0f13] via-[#100609] to-[#1a0b11] font-sans text-white flex flex-col md:flex-row selection:bg-[#e2b19e] selection:text-black">
      
      {/* Install Instructions Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowInstallModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[32px] max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowInstallModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24}/></button>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#c88c75] to-[#e2b19e] flex items-center justify-center mb-6 shadow-lg">
                <Smartphone size={32} className="text-[#1a0b11]" />
              </div>
              <h2 className="text-3xl font-serif text-white mb-4">Ilovani o'rnatish</h2>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                Ushbu tizimni telefoningizga ilova (App) sifatida o'rnatish uchun:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <h4 className="font-medium text-white">iPhone (Safari) da:</h4>
                    <p className="text-sm text-gray-400 mt-1">Pastdagi <strong>Share (Ulashish)</strong> <Share size={14} className="inline"/> tugmasini bosing va ro'yxatdan <strong>"Add to Home Screen"</strong> (Ekranga qo'shish) ni tanlang.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h4 className="font-medium text-white">Android (Chrome) da:</h4>
                    <p className="text-sm text-gray-400 mt-1">Tepadagi uch nuqtani (⋮) bosing va <strong>"Install app"</strong> yoki <strong>"Add to Home screen"</strong> ni tanlang.</p>
                  </div>
                </li>
              </ul>
              <button onClick={() => setShowInstallModal(false)} className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all">
                Tushunarli
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header (Glassmorphism) */}
      <div className="md:hidden bg-[#1c0f13]/80 backdrop-blur-xl p-5 flex justify-between items-center border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-[#e2b19e]" />
          <span className="font-serif tracking-[0.2em] text-sm text-[#e2b19e] uppercase">Samizar</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300">
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Glass Sidebar */}
      <aside className={`
        fixed md:sticky inset-y-0 left-0 z-40 w-72 h-screen bg-[#1c0f13]/90 md:bg-transparent backdrop-blur-3xl md:backdrop-blur-none border-r border-white/10 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <Heart className="w-8 h-8 text-[#e2b19e]" strokeWidth={1.5} />
          <span className="font-serif tracking-[0.2em] text-lg text-[#e2b19e] uppercase">Samizar</span>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto pt-8 md:pt-4">
          {menuItems.map(item => {
            if (item.locked) return null; // Hide locked items entirely from sidebar
            return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-white/10 to-transparent text-white border-l-2 border-[#e2b19e]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              <span className={`${activeTab === item.id ? 'text-[#e2b19e]' : ''}`}>{item.icon}</span>
              <span className="font-medium text-[15px] tracking-wide">{item.label}</span>
              {item.id === 'premium' && !profile.is_premium && (
                <span className="ml-auto bg-gradient-to-r from-[#d4af37] to-[#aa8022] text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">To'lov</span>
              )}
            </button>
          )})}
        </div>

        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-all border border-transparent hover:border-red-500/30">
            <LogOut size={20} />
            <span className="font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full overflow-y-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pb-24"
        >
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Section */}
              <header className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 overflow-hidden shadow-2xl">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#c88c75]/20 rounded-full blur-[100px] pointer-events-none"></div>
                
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
                  Xush kelibsiz,<br/>
                  <span className="text-[#e2b19e] italic">{profile.couple_names || 'Do\'stim'}</span>
                </h1>
                <p className="text-gray-300 max-w-xl text-lg font-light leading-relaxed mb-8">
                  Bu sizning shaxsiy mo'jizalar xonangiz. Bu yerdan albomga xotiralar qo'shishingiz, dizaynni o'zgartirishingiz va cheksiz romantika yaratishingiz mumkin.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                  <button onClick={handleInstallApp} className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#c88c75] to-[#a36954] hover:from-[#e2b19e] hover:to-[#c88c75] text-white px-8 py-4 rounded-2xl font-medium shadow-[0_10px_30px_rgba(200,140,117,0.3)] transition-all duration-300 transform hover:-translate-y-1">
                    <Smartphone size={20} /> App Qilib O'rnatish
                  </button>
                  <button onClick={() => navigate('/preview')} className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300">
                    Albomni Ko'rish
                  </button>
                </div>
              </header>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-[#c88c75]/20 flex items-center justify-center mb-6 text-[#e2b19e] group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} strokeWidth={1.5}/>
                  </div>
                  <h3 className="text-gray-400 font-medium mb-1 tracking-wide uppercase text-xs">Yuklangan Rasmlar</h3>
                  <p className="text-5xl font-light text-white mb-2">{memories.length}</p>
                  {!profile.is_premium ? (
                    <p className="text-sm text-red-400">Tekin limit: 3 ta</p>
                  ) : (
                    <p className="text-sm text-[#e2b19e]">Cheksiz xotira (Premium)</p>
                  )}
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-[#c88c75]/20 flex items-center justify-center mb-6 text-[#e2b19e] group-hover:scale-110 transition-transform">
                    <Gift size={24} strokeWidth={1.5}/>
                  </div>
                  <h3 className="text-gray-400 font-medium mb-1 tracking-wide uppercase text-xs">Sevgi Kuponlari</h3>
                  <p className="text-5xl font-light text-white mb-2">{coupons.length}</p>
                  <p className="text-sm text-gray-500">{coupons.filter(c => c.is_claimed).length} tasi qiz tomonidan ochilgan</p>
                </div>

                <div className={`p-8 rounded-[32px] transition-colors group border ${profile.is_premium ? 'bg-gradient-to-br from-[#d4af37]/20 to-transparent border-[#d4af37]/40 backdrop-blur-xl' : 'bg-white/5 backdrop-blur-xl border-white/10'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${profile.is_premium ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-white/10 text-white'}`}>
                    <CreditCard size={24} strokeWidth={1.5}/>
                  </div>
                  <h3 className="text-gray-400 font-medium mb-1 tracking-wide uppercase text-xs">Tarif Rejasi</h3>
                  <p className={`text-3xl font-serif mt-2 mb-4 ${profile.is_premium ? 'text-[#d4af37]' : 'text-white'}`}>
                    {profile.is_premium ? 'Premium ⭐' : 'Bepul Versiya'}
                  </p>
                  {!profile.is_premium && (
                    <button onClick={() => setActiveTab('premium')} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all">
                      Kuchaytirish (Upgrade)
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12">
                <h2 className="text-3xl font-serif mb-3 text-white">Bu yerdan qanday foydalaniladi?</h2>
                <p className="text-gray-400 mb-8 text-lg font-light">Albomni mukammal qilish uchun quyidagi 4 ta qadamni bajaring:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => setActiveTab('memories')} className="flex items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#e2b19e]/50 transition-all text-left group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#c88c75]/20 flex items-center justify-center text-[#e2b19e] group-hover:scale-110 transition-transform"><ImageIcon size={24} /></div>
                    <div>
                      <span className="block font-medium text-white text-xl mb-1">1. Rasmlar qo'shish</span>
                      <span className="text-sm text-gray-400 font-light leading-relaxed">Eng chiroyli va esda qolarli xotiralaringizni shu yerga yuklang.</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('themes')} className="flex items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#e2b19e]/50 transition-all text-left group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#c88c75]/20 flex items-center justify-center text-[#e2b19e] group-hover:scale-110 transition-transform"><Palette size={24} /></div>
                    <div>
                      <span className="block font-medium text-white text-xl mb-1">2. Dizayn tanlash</span>
                      <span className="text-sm text-gray-400 font-light leading-relaxed">Albomning ranglari va ko'rinishi qanday bo'lishini o'zingiz hal qiling.</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="flex items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#e2b19e]/50 transition-all text-left group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#c88c75]/20 flex items-center justify-center text-[#e2b19e] group-hover:scale-110 transition-transform"><Settings size={24} /></div>
                    <div>
                      <span className="block font-medium text-white text-xl mb-1">3. Sozlamalar</span>
                      <span className="text-sm text-gray-400 font-light leading-relaxed">Yandex Music linki va o'z ismlaringizni to'g'rilab chiqing.</span>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('coupons')} className="flex items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#e2b19e]/50 transition-all text-left group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#c88c75]/20 flex items-center justify-center text-[#e2b19e] group-hover:scale-110 transition-transform"><Gift size={24} /></div>
                    <div>
                      <span className="block font-medium text-white text-xl mb-1">4. Syurpriz Kuponlar</span>
                      <span className="text-sm text-gray-400 font-light leading-relaxed">Unga ajoyib va qiziqarli sovg'a kuponlarini yarating.</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEMORIES TAB */}
          {activeTab === 'memories' && (
            <div className="space-y-8">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px]">
                <div>
                  <h1 className="text-4xl font-serif text-white mb-2">Xotiralar</h1>
                  <p className="text-gray-400 text-lg font-light">Albomdagi barcha rasmlarni boshqarish.</p>
                </div>
                <label className="bg-gradient-to-r from-[#c88c75] to-[#a36954] hover:from-[#e2b19e] hover:to-[#c88c75] text-white px-8 py-4 rounded-2xl font-medium shadow-[0_10px_30px_rgba(200,140,117,0.3)] transition-all flex items-center justify-center gap-3 cursor-pointer shrink-0">
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                  <span>{uploading ? 'Yuklanmoqda...' : 'Rasm Yuklash'}</span>
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </header>

              {!profile.is_premium && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl text-sm leading-relaxed flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">!</div>
                  <p>Diqqat: Siz bepul versiyadasiz. Maksimal 3 ta rasm yuklashingiz mumkin. Cheksiz xotira, ovozli xabarlar va HD videolar uchun Premium tarifiga o'ting.</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {memories.map(mem => (
                  <div key={mem.id} className="bg-white/5 backdrop-blur-xl rounded-[24px] overflow-hidden group relative border border-white/10 hover:border-white/20 transition-all">
                    <div className="w-full aspect-square bg-[#111] overflow-hidden">
                      <img src={mem.image_url} alt="memory" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                    </div>
                    <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full">
                      <input 
                        type="text" 
                        defaultValue={mem.caption || ''} 
                        onBlur={(e) => supabase.from('memories').update({ caption: e.target.value }).eq('id', mem.id)}
                        placeholder="Chiroyli izoh yozing..."
                        className="w-full text-sm font-serif italic text-white/90 bg-transparent border-b border-transparent focus:border-[#e2b19e] focus:outline-none py-1 transition-colors placeholder:text-white/40"
                      />
                    </div>
                    <button onClick={() => handleDeleteMemory(mem.id)} className="absolute top-4 right-4 p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-xl translate-y-2 group-hover:translate-y-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {memories.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-white/10 rounded-[32px] bg-white/5">
                    <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-6">
                      <ImageIcon size={40} className="text-gray-400 opacity-50" />
                    </div>
                    <p className="text-xl font-serif text-white mb-2">Hali rasmlar yuklanmagan.</p>
                    <p className="text-gray-400 font-light">"Rasm Yuklash" tugmasi orqali xotiralarni qo'shing.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COUPONS TAB */}
          {activeTab === 'coupons' && (
            <div className="space-y-8">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px]">
                <div>
                  <h1 className="text-4xl font-serif text-white mb-2">Sevgi Kuponlari</h1>
                  <p className="text-gray-400 text-lg font-light">Uning uchun o'ziga xos sovg'alar va viktorinalar yarating.</p>
                </div>
                <button onClick={handleAddCoupon} className="bg-gradient-to-r from-[#c88c75] to-[#a36954] hover:from-[#e2b19e] hover:to-[#c88c75] text-white px-8 py-4 rounded-2xl font-medium shadow-[0_10px_30px_rgba(200,140,117,0.3)] transition-all flex items-center justify-center gap-3 shrink-0">
                  <Plus size={20} /> Yangi Kupon
                </button>
              </header>

              <div className="grid gap-4 max-w-4xl">
                {coupons.map(coupon => {
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
                  <div key={coupon.id} className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${coupon.is_claimed ? 'bg-green-500/20 text-green-400' : 'bg-gradient-to-br from-[#c88c75]/20 to-[#a36954]/20 text-[#e2b19e]'}`}>
                        <Gift size={28} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-white mb-2">{displayTitle} {isQuiz && <span className="text-xs ml-2 text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded-full">Viktorina</span>}</h3>
                        <span className={`text-xs uppercase tracking-[0.1em] font-bold px-3 py-1.5 rounded-lg ${coupon.is_claimed ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}>
                          {coupon.is_claimed ? 'Ishlatilgan' : 'Kutmoqda'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white rounded-full transition-all">
                      <Trash2 size={20}/>
                    </button>
                  </div>
                )})}
                {coupons.length === 0 && (
                  <div className="py-20 text-center text-gray-500 border-2 border-dashed border-white/10 rounded-[32px] bg-white/5">
                    <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-6">
                      <Gift size={40} className="text-gray-400 opacity-50" />
                    </div>
                    <p className="text-xl font-serif text-white mb-2">Hali kuponlar yaratilmagan.</p>
                    <p className="text-gray-400 font-light">O'z yaqiningizga ajoyib va'dalar bering.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THEMES TAB */}
          {activeTab === 'themes' && (
            <div className="space-y-8">
              <header className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px]">
                <h1 className="text-4xl font-serif text-white mb-2">Dizayn Temalari</h1>
                <p className="text-gray-400 text-lg font-light">Albomning tashqi ko'rinishini va ranglarini o'zgartiring.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Theme 1 */}
                <div 
                  onClick={() => { setProfile({...profile, theme: 'dark'}); handleUpdateProfile(); }}
                  className={`cursor-pointer p-6 rounded-[32px] border-2 transition-all duration-300 ${profile.theme === 'dark' ? 'border-[#e2b19e] bg-[#c88c75]/10 shadow-[0_0_30px_rgba(200,140,117,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="h-48 rounded-2xl bg-gradient-to-br from-[#3b1c24] to-[#1a0a0f] mb-6 flex items-center justify-center border border-white/5 shadow-inner">
                    <Heart className="text-[#c88c75] w-12 h-12" strokeWidth={1} />
                  </div>
                  <h3 className="text-xl font-serif text-white mb-1">Classic Dark</h3>
                  <p className="text-sm text-gray-400 font-light">Qoramtir romantik qizil va sharob ranglari. Standart dizayn.</p>
                </div>

                {/* Theme 2 */}
                <div 
                  onClick={() => {
                    if(!profile.is_premium) { alert("Bu dizayn faqat Premium obunada mavjud!"); return; }
                    setProfile({...profile, theme: 'gold'});
                    handleUpdateProfile();
                  }}
                  className={`cursor-pointer p-6 rounded-[32px] border-2 transition-all duration-300 relative overflow-hidden ${profile.theme === 'gold' ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  {!profile.is_premium && <div className="absolute top-6 right-6 bg-gradient-to-r from-[#d4af37] to-[#aa8022] text-black text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg z-10">Pro</div>}
                  <div className={`h-48 rounded-2xl bg-gradient-to-br from-[#fcf6e5] to-[#e6c981] mb-6 flex items-center justify-center shadow-inner relative ${!profile.is_premium ? 'grayscale opacity-50' : ''}`}>
                    <Heart className="text-[#a6822c] w-12 h-12" fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-serif text-white mb-1">Luxury Gold</h3>
                  <p className="text-sm text-gray-400 font-light">Oltin ranglardagi yorqin, nafis va hashamatli dizayn.</p>
                </div>

              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-3xl">
              <header className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px]">
                <h1 className="text-4xl font-serif text-white mb-2">Sozlamalar</h1>
                <p className="text-gray-400 text-lg font-light">Asosiy ma'lumotlar va musiqani ulash.</p>
              </header>

              <form onSubmit={handleUpdateProfile} className="space-y-8 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[32px] shadow-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-widest">Albom Sarlavhasi (Ismlar)</label>
                  <input type="text" value={profile.couple_names || ''} onChange={e => setProfile({...profile, couple_names: e.target.value})} placeholder="Masalan: Sardor & Malika" className="w-full p-5 bg-[#111]/50 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:border-[#e2b19e] text-white text-lg transition-colors placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-widest">Muhim Sana</label>
                  <input type="text" value={profile.est_date || ''} onChange={e => setProfile({...profile, est_date: e.target.value})} placeholder="Masalan: Est. 2024 yoki 14.02.2023" className="w-full p-5 bg-[#111]/50 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:border-[#e2b19e] text-white text-lg transition-colors placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-widest">Fonda chalinuvchi musiqa</label>
                  <input type="text" value={profile.spotify_url || ''} onChange={e => setProfile({...profile, spotify_url: e.target.value})} placeholder="Yandex Music yoki Spotify Linki..." className="w-full p-5 bg-[#111]/50 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:border-[#e2b19e] text-white text-lg transition-colors placeholder:text-gray-600" />
                  <p className="text-sm text-gray-500 mt-3 font-light">Ushbu musiqa albom ochilganda tepada pleyer orqali tinglanadi.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-widest">Ovozli Xabar (Voice Memo)</label>
                  {profile.voice_memo_url ? (
                    <div className="flex items-center gap-4 mb-4 p-4 bg-[#111]/50 backdrop-blur-md border border-white/10 rounded-2xl">
                      <audio controls src={profile.voice_memo_url} className="w-full outline-none" />
                      <button type="button" onClick={() => { if(confirm('Ovozli xabarni o`chirishga ishonchingiz komilmi?')) setProfile({...profile, voice_memo_url: null}) }} className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 w-full p-5 bg-[#111]/50 backdrop-blur-md border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors text-gray-400">
                      <input type="file" accept="audio/*" onChange={handleAudioUpload} disabled={uploading} className="hidden" />
                      {uploading ? <><Loader2 size={20} className="animate-spin" /> Yuklanmoqda...</> : "Audio fayl tanlang (.mp3, .m4a, .wav)"}
                    </label>
                  )}
                  <p className="text-sm text-gray-500 mt-3 font-light">Ushbu ovozli xabar qiz albomga kirganda fonda yangraydi (Faqat Premium).</p>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <button type="submit" className="bg-gradient-to-r from-[#c88c75] to-[#a36954] hover:from-[#e2b19e] hover:to-[#c88c75] text-white px-10 py-5 rounded-2xl font-medium shadow-[0_10px_30px_rgba(200,140,117,0.3)] w-full text-lg transition-all duration-300 transform hover:-translate-y-1">
                    O'zgarishlarni Saqlash
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAYWALL / PREMIUM TAB */}
          {activeTab === 'premium' && (
            <div className="space-y-8 max-w-3xl mx-auto text-center py-12 md:py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa8022] mb-8 shadow-[0_0_60px_rgba(212,175,55,0.4)] relative">
                <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                <CreditCard size={40} className="text-[#1a0b11]" />
              </div>
              <h1 className="text-5xl md:text-6xl font-serif text-white mb-4 tracking-tight">To'lov <span className="text-[#d4af37]">Sahifasi</span></h1>
              <p className="text-gray-400 text-xl font-light mb-12 max-w-2xl mx-auto leading-relaxed">
                Albomni faollashtirish va barcha xizmatlardan cheksiz foydalanish uchun to'lovni amalga oshiring.
              </p>

              {paymentPending ? (
                 <div className="bg-[#111] border border-green-500/30 p-10 rounded-[32px] shadow-2xl relative overflow-hidden">
                   <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Loader2 size={32} className="animate-spin" />
                   </div>
                   <h2 className="text-2xl font-serif text-white mb-2">To'lovingiz tekshirilmoqda...</h2>
                   <p className="text-gray-400 font-light max-w-md mx-auto">Siz yuborgan chek adminlarimiz tomonidan tasdiqlanishi kutilmoqda. Tasdiqlanishi bilan profilingiz avtomat ochiladi (10-15 daqiqa).</p>
                 </div>
              ) : profile.is_premium ? (
                 <div className="bg-[#111] border border-green-500/30 p-10 rounded-[32px] shadow-2xl relative overflow-hidden">
                   <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Heart size={32} className="fill-current" />
                   </div>
                   <h2 className="text-2xl font-serif text-white mb-2">Tabriklaymiz!</h2>
                   <p className="text-gray-400 font-light max-w-md mx-auto">Sizning albomingiz to'liq faol! Barcha bo'limlardan erkin foydalanishingiz mumkin.</p>
                 </div>
              ) : (
                <div className="bg-[#111]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-14 max-w-xl mx-auto text-left relative overflow-hidden shadow-2xl">
                  
                  {/* Promo Code Section */}
                  <div className="mb-10 p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
                    <label className="text-sm text-gray-400 font-medium tracking-wide uppercase">Sizda Promokod bormi?</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        placeholder="Maxsus kodni kiriting..." 
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-[#d4af37]"
                      />
                      <button onClick={handleApplyPromoCode} disabled={submittingPayment} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors">
                        Qo'llash
                      </button>
                    </div>
                    {promoError && <p className="text-red-400 text-sm mt-1">{promoError}</p>}
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-10"></div>

                  <h3 className="text-2xl font-serif text-white mb-6">Tarifni tanlang:</h3>
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div onClick={() => setPaymentPlan('monthly')} className={`cursor-pointer border-2 rounded-2xl p-6 text-center transition-all ${paymentPlan === 'monthly' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}>
                      <h4 className="text-white font-medium mb-1">1 Oylik</h4>
                      <p className="text-2xl font-serif text-[#d4af37]">29,000 <span className="text-xs text-gray-500">so'm</span></p>
                    </div>
                    <div onClick={() => setPaymentPlan('yearly')} className={`cursor-pointer border-2 rounded-2xl p-6 text-center transition-all relative ${paymentPlan === 'yearly' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}>
                      <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">FOYDALI</div>
                      <h4 className="text-white font-medium mb-1">1 Yillik</h4>
                      <p className="text-2xl font-serif text-[#d4af37]">198,000 <span className="text-xs text-gray-500">so'm</span></p>
                    </div>
                  </div>

                  <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-2xl p-6 mb-8 text-center">
                    <p className="text-gray-300 text-sm mb-2">Quyidagi karta raqamiga pul o'tkazing:</p>
                    <p className="text-3xl font-mono text-white tracking-widest mb-1 select-all">5614 6818 5423 5698</p>
                    <p className="text-[#d4af37] font-medium text-lg uppercase tracking-widest">Имомкулов мироншох</p>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-widest text-center">To'lov chekini yuklang (Skrinshot)</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-[#d4af37]/50 hover:bg-white/5 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon size={28} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400">{receiptFile ? receiptFile.name : 'Rasm yuklash uchun bosing'}</p>
                      </div>
                      <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} className="hidden" />
                    </label>
                  </div>

                  <button 
                    onClick={handleSubmitPayment}
                    disabled={submittingPayment || !receiptFile}
                    className="w-full py-5 bg-gradient-to-r from-[#d4af37] to-[#aa8022] hover:from-[#f0c950] hover:to-[#c69a30] text-[#1a0b11] rounded-2xl font-bold text-lg shadow-[0_10px_40px_rgba(212,175,55,0.4)] transition-all duration-300 transform hover:-translate-y-1 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPayment ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'To\'lovni Tasdiqlashga Yuborish'}
                  </button>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
