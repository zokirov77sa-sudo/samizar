import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Plus, Trash2, LogOut, Loader2, 
  LayoutDashboard, Image as ImageIcon, Gift, Palette, Settings, CreditCard, Menu, X, Play
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
  const [profile, setProfile] = useState({ couple_names: '', est_date: '', spotify_url: '', theme: 'dark', is_premium: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    fetchData();

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Sizning qurilmangiz ilovani avtomatik o'rnatishni qo'llab-quvvatlamaydi yoki ilova allaqachon o'rnatilgan. (Brauzer menyusidan 'Add to Home Screen' ni bosing)");
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
    if (profileData) setProfile({
      ...profileData, 
      theme: profileData.theme || 'dark',
      is_premium: profileData.is_premium || false
    });

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
    
    // Multiple upload support
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
      theme: profile.theme
    }).eq('id', user.id);
    alert('Sozlamalar saqlandi!');
  };

  const handleAddCoupon = async () => {
    const title = prompt("Kupon nomini kiriting (Masalan: Romantik kechki ovqat):");
    if (!title) return;
    
    const wantsQuiz = confirm("Bu kuponni ochish uchun qiz savolga to'g'ri javob topishi kerak bo'lgan 'Viktorina' qoshishni xohlaysizmi?");
    let quizQuestion = null;
    let quizAnswer = null;
    
    if (wantsQuiz) {
      quizQuestion = prompt("Qiz uchun savol (Masalan: Biz birinchi marta qayerda uchrashganmiz?):");
      quizAnswer = prompt("To'g'ri javob:");
    }

    await supabase.from('coupons').insert([{ 
      user_id: user.id, 
      title,
      // quiz_question: quizQuestion, // We'll add these columns to DB later
      // quiz_answer: quizAnswer
    }]);
    fetchData();
  };

  const handleDeleteCoupon = async (id) => {
    await supabase.from('coupons').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="min-h-screen bg-[#1c1c1c] flex items-center justify-center"><Loader2 className="animate-spin text-[#c88c75]" size={40}/></div>;

  if (isAdmin) {
    return <AdminDashboard />;
  }

  const menuItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Asosiy' },
    { id: 'memories', icon: <ImageIcon size={20} />, label: 'Xotiralar' },
    { id: 'coupons', icon: <Gift size={20} />, label: 'Kuponlar' },
    { id: 'themes', icon: <Palette size={20} />, label: 'Dizayn' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Sozlamalar' },
    { id: 'premium', icon: <CreditCard size={20} />, label: 'Premium' },
  ];

  return (
    <div className="min-h-screen bg-[#111111] font-sans text-white flex flex-col md:flex-row selection:bg-[#c88c75] selection:text-white">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1a1a1a] p-4 flex justify-between items-center border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#c88c75]" />
          <span className="font-serif tracking-widest text-sm text-[#c88c75] uppercase">Samizar</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1a1a1a] border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 hidden md:flex items-center gap-2 mb-6">
          <Heart className="w-6 h-6 text-[#c88c75]" />
          <span className="font-serif tracking-widest text-lg text-[#c88c75] uppercase">Samizar</span>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto pt-6 md:pt-0">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-[#c88c75]/10 text-[#c88c75]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
              {item.id === 'premium' && !profile.is_premium && (
                <span className="ml-auto bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={20} />
            <span className="font-medium text-sm">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-5xl mx-auto w-full overflow-y-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <header className="bg-gradient-to-r from-[#2a1a1f] to-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#c88c75]/10 rounded-full blur-3xl pointer-events-none"></div>
                <h1 className="text-4xl font-serif text-white mb-3">Salom, {profile.couple_names || 'Do\'stim'}! 👋</h1>
                <p className="text-gray-400 max-w-xl text-lg">Bu sizning shaxsiy boshqaruv panelingiz. Bu yerdan albomga rasmlar qo'shishingiz, dizaynni o'zgartirishingiz va kuponlar yaratishingiz mumkin.</p>
                
                <div className="mt-6 flex flex-wrap gap-4">
                  {deferredPrompt && (
                    <button onClick={handleInstallApp} className="flex items-center gap-2 bg-[#c88c75] hover:bg-[#b57a64] text-white px-6 py-3 rounded-xl font-medium shadow-[0_0_20px_rgba(200,140,117,0.3)] transition-all">
                      Telefon Ekranga O'rnatish (App)
                    </button>
                  )}
                  <button onClick={() => window.open(`/${user.id}`, '_blank')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all">
                    Albomni Ko'rish
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 transition-colors p-6 rounded-3xl relative overflow-hidden">
                  <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2"><ImageIcon size={18} /> Rasmlar soni</h3>
                  <p className="text-5xl font-light text-white mb-2">{memories.length}</p>
                  {!profile.is_premium ? (
                    <p className="text-sm text-red-400">Tekin limit: 3 ta (Premium oling)</p>
                  ) : (
                    <p className="text-sm text-green-400">Cheksiz xotira</p>
                  )}
                </div>
                <div className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 transition-colors p-6 rounded-3xl relative overflow-hidden">
                  <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2"><Gift size={18} /> Kuponlar</h3>
                  <p className="text-5xl font-light text-white mb-2">{coupons.length}</p>
                  <p className="text-sm text-gray-500">{coupons.filter(c => c.is_claimed).length} tasi ishlatilgan</p>
                </div>
                <div className={`border p-6 rounded-3xl transition-colors ${profile.is_premium ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border-amber-500/50' : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600'}`}>
                  <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2"><CreditCard size={18} /> Tarif Rejasi</h3>
                  <p className={`text-3xl font-serif mt-2 ${profile.is_premium ? 'text-amber-400' : 'text-white'}`}>
                    {profile.is_premium ? 'Premium ⭐' : 'Bepul Versiya'}
                  </p>
                  {!profile.is_premium && (
                    <button onClick={() => setActiveTab('premium')} className="mt-4 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all">
                      Kuchaytirish
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8">
                <h2 className="text-2xl font-serif mb-2">Qanday foydalaniladi?</h2>
                <p className="text-gray-400 mb-6">Bu tizim orqali siz o'z yaqiningizga ajoyib xotira albomi yaratib bera olasiz:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('memories')} className="flex flex-col items-start gap-2 bg-[#222] border border-gray-700 hover:border-[#c88c75] p-5 rounded-2xl transition-all text-left">
                    <div className="bg-[#c88c75]/20 p-2 rounded-lg text-[#c88c75]"><ImageIcon size={20} /></div>
                    <span className="font-medium text-white text-lg">1. Rasmlar qo'shish</span>
                    <span className="text-sm text-gray-400">Eng chiroyli xotiralaringizni yuklang.</span>
                  </button>
                  <button onClick={() => setActiveTab('themes')} className="flex flex-col items-start gap-2 bg-[#222] border border-gray-700 hover:border-[#c88c75] p-5 rounded-2xl transition-all text-left">
                    <div className="bg-[#c88c75]/20 p-2 rounded-lg text-[#c88c75]"><Palette size={20} /></div>
                    <span className="font-medium text-white text-lg">2. Dizayn tanlash</span>
                    <span className="text-sm text-gray-400">Albom qanday ko'rinishda bo'lishini tanlang.</span>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="flex flex-col items-start gap-2 bg-[#222] border border-gray-700 hover:border-[#c88c75] p-5 rounded-2xl transition-all text-left">
                    <div className="bg-[#c88c75]/20 p-2 rounded-lg text-[#c88c75]"><Settings size={20} /></div>
                    <span className="font-medium text-white text-lg">3. Sozlamalar</span>
                    <span className="text-sm text-gray-400">Musiqa va ismlarni to'g'rilang.</span>
                  </button>
                  <button onClick={() => setActiveTab('coupons')} className="flex flex-col items-start gap-2 bg-[#222] border border-gray-700 hover:border-[#c88c75] p-5 rounded-2xl transition-all text-left">
                    <div className="bg-[#c88c75]/20 p-2 rounded-lg text-[#c88c75]"><Gift size={20} /></div>
                    <span className="font-medium text-white text-lg">4. Syurpriz Kuponlar</span>
                    <span className="text-sm text-gray-400">Qiziqarli sovg'a kuponlarini yarating.</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEMORIES TAB */}
          {activeTab === 'memories' && (
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-serif text-white mb-2">Xotiralar</h1>
                  <p className="text-gray-400">Albomdagi barcha rasmlarni boshqarish.</p>
                </div>
                <label className="bg-[#c88c75] hover:bg-[#b57a64] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  <span>{uploading ? 'Yuklanmoqda...' : 'Rasm Yuklash'}</span>
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </header>

              {!profile.is_premium && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm">
                  Diqqat: Siz bepul versiyadasiz. Maksimal 3 ta rasm yuklashingiz mumkin. Ovozli xabar va videolar uchun Premium xarid qiling.
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {memories.map(mem => (
                  <div key={mem.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden group relative border border-gray-800">
                    <div className="w-full aspect-square bg-[#222]">
                      <img src={mem.image_url} alt="memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-3">
                      <input 
                        type="text" 
                        defaultValue={mem.caption || ''} 
                        onBlur={(e) => supabase.from('memories').update({ caption: e.target.value }).eq('id', mem.id)}
                        placeholder="Izoh yozing..."
                        className="w-full text-xs italic text-gray-300 bg-transparent border-b border-transparent focus:border-[#c88c75] focus:outline-none py-1 transition-colors"
                      />
                    </div>
                    <button onClick={() => handleDeleteMemory(mem.id)} className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {memories.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Hali rasmlar yuklanmagan.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COUPONS TAB */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-serif text-white mb-2">Sevgi Kuponlari</h1>
                  <p className="text-gray-400">Uning uchun o'ziga xos sovg'alar yarating.</p>
                </div>
                <button onClick={handleAddCoupon} className="bg-[#c88c75] hover:bg-[#b57a64] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2">
                  <Plus size={18} /> Yangi Kupon
                </button>
              </header>

              <div className="space-y-3 max-w-3xl">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-gray-800 rounded-xl group hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${coupon.is_claimed ? 'bg-green-500/10 text-green-400' : 'bg-[#c88c75]/10 text-[#c88c75]'}`}>
                        <Gift size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{coupon.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${coupon.is_claimed ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-400'}`}>
                            {coupon.is_claimed ? 'Ishlatilgan' : 'Kutmoqda'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
                {coupons.length === 0 && (
                  <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                    <Gift size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Hali kuponlar yaratilmagan.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THEMES TAB */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <header>
                <h1 className="text-3xl font-serif text-white mb-2">Dizayn Temalari</h1>
                <p className="text-gray-400">Albomning tashqi ko'rinishini o'zgartiring.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                <div 
                  onClick={() => setProfile({...profile, theme: 'dark'})}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${profile.theme === 'dark' ? 'border-[#c88c75] bg-[#c88c75]/5' : 'border-gray-800 bg-[#1a1a1a] hover:border-gray-600'}`}
                >
                  <div className="h-32 rounded-xl bg-gradient-to-br from-[#3b1c24] to-[#1a0a0f] mb-4 flex items-center justify-center border border-white/5">
                    <Heart className="text-[#c88c75]" />
                  </div>
                  <h3 className="font-medium">Classic Dark</h3>
                  <p className="text-xs text-gray-500 mt-1">Standart, qoramtir romantik dizayn</p>
                </div>

                <div 
                  onClick={() => {
                    if(!profile.is_premium) { alert("Bu dizayn faqat Premium obunada mavjud!"); return; }
                    setProfile({...profile, theme: 'gold'})
                  }}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${profile.theme === 'gold' ? 'border-amber-400 bg-amber-400/5' : 'border-gray-800 bg-[#1a1a1a] hover:border-gray-600'} relative overflow-hidden`}
                >
                  {!profile.is_premium && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pro</div>}
                  <div className="h-32 rounded-xl bg-gradient-to-br from-amber-100 to-amber-300 mb-4 flex items-center justify-center border border-black/5">
                    <Heart className="text-amber-800" fill="currentColor" />
                  </div>
                  <h3 className="font-medium">Luxury Gold</h3>
                  <p className="text-xs text-gray-500 mt-1">Oltin ranglardagi hashamatli dizayn</p>
                </div>
              </div>

              <button onClick={() => handleUpdateProfile()} className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Dizaynni Saqlash
              </button>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <header>
                <h1 className="text-3xl font-serif text-white mb-2">Sozlamalar</h1>
                <p className="text-gray-400">Asosiy ma'lumotlar va musiqani ulash.</p>
              </header>

              <form onSubmit={handleUpdateProfile} className="space-y-6 bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ismlar (Masalan: Sardor & Malika)</label>
                  <input type="text" value={profile.couple_names || ''} onChange={e => setProfile({...profile, couple_names: e.target.value})} className="w-full p-3 bg-[#111] border border-gray-700 rounded-xl focus:outline-none focus:border-[#c88c75] text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Muhim Sana (Masalan: Est. 2024 yoki 14.02.2023)</label>
                  <input type="text" value={profile.est_date || ''} onChange={e => setProfile({...profile, est_date: e.target.value})} className="w-full p-3 bg-[#111] border border-gray-700 rounded-xl focus:outline-none focus:border-[#c88c75] text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yandex Music yoki Spotify Linki</label>
                  <input type="text" value={profile.spotify_url || ''} onChange={e => setProfile({...profile, spotify_url: e.target.value})} placeholder="https://music.yandex.ru/..." className="w-full p-3 bg-[#111] border border-gray-700 rounded-xl focus:outline-none focus:border-[#c88c75] text-white" />
                  <p className="text-xs text-gray-500 mt-2">Ushbu musiqa albom ochilganda pleyer orqali tinglanishi mumkin.</p>
                </div>
                <button type="submit" className="bg-[#c88c75] text-white px-6 py-3 rounded-xl font-medium w-full hover:bg-[#b57a64] transition-colors">
                  Saqlash
                </button>
              </form>
            </div>
          )}

          {/* PREMIUM TAB */}
          {activeTab === 'premium' && (
            <div className="space-y-8 max-w-3xl mx-auto text-center py-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 mb-6 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                <CreditCard size={32} className="text-white" />
              </div>
              <h1 className="text-4xl font-serif text-white mb-4">Premium Obuna</h1>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Albomni cheklovlarsiz ishlating va noyob imkoniyatlarga ega bo'ling. O'z yaqiningizga eng kuchli hissiyotlarni sovg'a qiling!
              </p>

              <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-3xl p-8 max-w-md mx-auto text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <h3 className="text-2xl font-medium text-white mb-2">Romantika Pro</h3>
                <p className="text-4xl font-light text-amber-400 mb-6">79,000 <span className="text-lg text-gray-500 font-sans">so'm/oy</span></p>

                <ul className="space-y-4 mb-8">
                  {['Cheksiz rasm va HD videolar yuklash', 'Maxfiy Vaqt Kapsulasi xabarlari', 'Fonda o\'ynaydigan Ovozli Xabarlar', 'Premium (Gold) dizayn shablonlari', 'Kuponlar uchun Viktorina o\'yinlari'].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      </div>
                      <span className="text-gray-300 text-sm leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => alert('Tez kunda Payme/Click ulanadi!')}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-medium shadow-lg transition-all"
                >
                  Premiumga O'tish
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
