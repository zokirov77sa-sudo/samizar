import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Trash2, Edit2, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('memories');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memories, setMemories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [profile, setProfile] = useState({ couple_names: '', est_date: '', spotify_url: '' });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
    if (profileData) setProfile(profileData);
    else {
      await supabase.from('profiles').insert([{ id: user.id }]);
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
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('memories_bucket').upload(filePath, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('memories_bucket').getPublicUrl(filePath);
      await supabase.from('memories').insert([{ user_id: user.id, image_url: data.publicUrl }]);
      fetchData();
    }
    setUploading(false);
  };

  const handleDeleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id);
    fetchData();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await supabase.from('profiles').update(profile).eq('id', user.id);
    alert('Sozlamalar saqlandi!');
  };

  const handleAddCoupon = async () => {
    const title = prompt("Kupon nomini kiriting (Masalan: Romantik kechki ovqat):");
    if (title) {
      await supabase.from('coupons').insert([{ user_id: user.id, title }]);
      fetchData();
    }
  };

  const handleDeleteCoupon = async (id) => {
    await supabase.from('coupons').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#c88c75]" size={40}/></div>;

  if (isAdmin) {
    return <AdminDashboard />;
  }

  const mockCoupons = [
    { id: 1, title: "Free Coffee Date!", isClaimed: true },
    { id: 2, title: "Movie Night Choice", isClaimed: false },
  ];

  return (
    <div className="min-h-screen bg-[#3b1c24] font-sans text-white">
      
      {/* Sidebar / Topbar */}
      <nav className="w-full bg-[#2d141b] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#c88c75]" />
          <span className="font-serif tracking-widest text-lg text-[#c88c75] uppercase">Living Album</span>
        </div>
        <button onClick={handleLogout} className="text-[#c88c75] hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 mt-6">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-serif text-4xl mb-2 text-white">Your Story</h1>
            <p className="text-[#ae939a] text-sm">Manage your memories, coupons, and app settings here.</p>
          </div>
          <button className="bg-[#c88c75] text-white px-6 py-3 rounded-md font-medium shadow-lg hover:bg-[#b57a64] transition-all flex items-center gap-2">
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#613c45] mb-8">
          {['memories', 'coupons', 'settings'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-medium uppercase tracking-wider text-sm transition-all ${activeTab === tab ? 'text-white border-b-2 border-samizar-burgundy' : 'text-[#ae939a] hover:text-[#f9dbe2]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'memories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map(mem => (
                <div key={mem.id} className="bg-[#4a2530] p-3 rounded-lg shadow-sm border border-[#613c45] group relative">
                  <div className="w-full h-48 bg-[#5a2d3a] rounded-md overflow-hidden mb-3">
                    <img src={mem.image_url} alt="memory" className="w-full h-full object-cover" />
                  </div>
                  <input 
                    type="text" 
                    defaultValue={mem.caption || ''} 
                    onBlur={(e) => supabase.from('memories').update({ caption: e.target.value }).eq('id', mem.id)}
                    placeholder="Izoh yozing..."
                    className="w-full text-sm font-serif italic text-white bg-transparent border-b border-dashed border-[#9f8d87] focus:outline-none focus:border-[#c88c75] px-1 py-1"
                  />
                  <button onClick={() => handleDeleteMemory(mem.id)} className="absolute top-5 right-5 p-2 bg-[#4a2530]/80 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#4a2530] shadow-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <label className="bg-[#341820] border-2 border-dashed border-[#613c45] rounded-lg flex flex-col items-center justify-center h-[260px] text-[#ae939a] hover:text-[#c88c75] hover:border-[#c88c75] hover:bg-[#c88c75]/5 transition-all cursor-pointer">
                {uploading ? <Loader2 size={32} className="animate-spin mb-2" /> : <Plus size={32} className="mb-2" />}
                <span className="font-medium">{uploading ? 'Yuklanmoqda...' : 'Rasm Yuklash'}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="max-w-2xl">
              <button onClick={handleAddCoupon} className="mb-6 bg-[#c88c75]/10 text-white px-4 py-2 rounded-md font-medium border border-[#c88c75]/30 hover:bg-[#c88c75]/20 transition-all">
                + Yangi Kupon Qo'shish
              </button>
              <div className="space-y-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="flex items-center justify-between p-5 bg-[#4a2530] border border-[#613c45] rounded-lg shadow-sm">
                    <div>
                      <h3 className="font-medium text-white">{coupon.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-2 inline-block ${coupon.isClaimed ? 'bg-green-100 text-green-700' : 'bg-[#5a2d3a] text-[#f9dbe2]'}`}>
                        {coupon.isClaimed ? 'Claimed by Her' : 'Unclaimed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-[#ae939a] hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && <p className="text-[#ae939a]">Hali kupon qo'shilmagan.</p>}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateProfile} className="max-w-lg space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Spotify Playlist URL (ixtiyoriy)</label>
                <input type="text" value={profile.spotify_url || ''} onChange={e => setProfile({...profile, spotify_url: e.target.value})} placeholder="https://open.spotify.com/..." className="w-full p-3 border border-[#9f8d87] rounded-md focus:outline-none focus:ring-1 focus:ring-[#c88c75]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Ismlar (Masalan: Sardor & Malika)</label>
                <input type="text" value={profile.couple_names || ''} onChange={e => setProfile({...profile, couple_names: e.target.value})} className="w-full p-3 border border-[#9f8d87] rounded-md focus:outline-none focus:ring-1 focus:ring-[#c88c75]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Sana (Masalan: Est. 2024)</label>
                <input type="text" value={profile.est_date || ''} onChange={e => setProfile({...profile, est_date: e.target.value})} className="w-full p-3 border border-[#9f8d87] rounded-md focus:outline-none focus:ring-1 focus:ring-[#c88c75]" />
              </div>
              <button type="submit" className="bg-[#4a2530] text-white px-6 py-3 rounded-md font-medium w-full mt-4 hover:bg-black transition-colors">
                Saqlash
              </button>
            </form>
          )}
        </div>

      </main>
    </div>
  );
}
