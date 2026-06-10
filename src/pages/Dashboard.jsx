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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-samizar-rosegold" size={40}/></div>;

  if (isAdmin) {
    return <AdminDashboard />;
  }

  const mockCoupons = [
    { id: 1, title: "Free Coffee Date!", isClaimed: true },
    { id: 2, title: "Movie Night Choice", isClaimed: false },
  ];

  return (
    <div className="min-h-screen bg-[#fdfcfc] font-sans text-samizar-burgundy">
      
      {/* Sidebar / Topbar */}
      <nav className="w-full bg-samizar-burgundy text-samizar-light p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-samizar-rosegold" />
          <span className="font-serif tracking-widest text-lg text-samizar-rosegold uppercase">Living Album</span>
        </div>
        <button onClick={handleLogout} className="text-samizar-rosegold hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 mt-6">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-serif text-4xl mb-2 text-samizar-dark">Your Story</h1>
            <p className="text-gray-500 text-sm">Manage your memories, coupons, and app settings here.</p>
          </div>
          <button className="bg-samizar-rosegold text-white px-6 py-3 rounded-md font-medium shadow-lg hover:bg-[#b57a64] transition-all flex items-center gap-2">
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          {['memories', 'coupons', 'settings'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-medium uppercase tracking-wider text-sm transition-all ${activeTab === tab ? 'text-samizar-burgundy border-b-2 border-samizar-burgundy' : 'text-gray-400 hover:text-gray-600'}`}
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
                <div key={mem.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 group relative">
                  <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden mb-3">
                    <img src={mem.image_url} alt="memory" className="w-full h-full object-cover" />
                  </div>
                  <input 
                    type="text" 
                    defaultValue={mem.caption || ''} 
                    onBlur={(e) => supabase.from('memories').update({ caption: e.target.value }).eq('id', mem.id)}
                    placeholder="Izoh yozing..."
                    className="w-full text-sm font-serif italic text-gray-700 bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-samizar-rosegold px-1 py-1"
                  />
                  <button onClick={() => handleDeleteMemory(mem.id)} className="absolute top-5 right-5 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <label className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center h-[260px] text-gray-400 hover:text-samizar-rosegold hover:border-samizar-rosegold hover:bg-samizar-rosegold/5 transition-all cursor-pointer">
                {uploading ? <Loader2 size={32} className="animate-spin mb-2" /> : <Plus size={32} className="mb-2" />}
                <span className="font-medium">{uploading ? 'Yuklanmoqda...' : 'Rasm Yuklash'}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="max-w-2xl">
              <button onClick={handleAddCoupon} className="mb-6 bg-samizar-rosegold/10 text-samizar-burgundy px-4 py-2 rounded-md font-medium border border-samizar-rosegold/30 hover:bg-samizar-rosegold/20 transition-all">
                + Yangi Kupon Qo'shish
              </button>
              <div className="space-y-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div>
                      <h3 className="font-medium text-samizar-dark">{coupon.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-2 inline-block ${coupon.isClaimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {coupon.isClaimed ? 'Claimed by Her' : 'Unclaimed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && <p className="text-gray-400">Hali kupon qo'shilmagan.</p>}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateProfile} className="max-w-lg space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Spotify Playlist URL (ixtiyoriy)</label>
                <input type="text" value={profile.spotify_url || ''} onChange={e => setProfile({...profile, spotify_url: e.target.value})} placeholder="https://open.spotify.com/..." className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-samizar-rosegold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ismlar (Masalan: Sardor & Malika)</label>
                <input type="text" value={profile.couple_names || ''} onChange={e => setProfile({...profile, couple_names: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-samizar-rosegold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sana (Masalan: Est. 2024)</label>
                <input type="text" value={profile.est_date || ''} onChange={e => setProfile({...profile, est_date: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-samizar-rosegold" />
              </div>
              <button type="submit" className="bg-samizar-dark text-white px-6 py-3 rounded-md font-medium w-full mt-4 hover:bg-black transition-colors">
                Saqlash
              </button>
            </form>
          )}
        </div>

      </main>
    </div>
  );
}
