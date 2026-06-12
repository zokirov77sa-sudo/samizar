import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

import {
  Plus, Edit2, Link as LinkIcon, Download, Check, Trash2, Loader2,
  Search, BarChart2, ShoppingBag, Tag, TrendingUp, FileText,
  ArrowUpDown, ChevronDown, ToggleLeft, ToggleRight, X, Package, Gem,
  LogOut, Eye, Images, ExternalLink
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const TARGET_DOMAIN = window.location.origin;

const MATERIALS = ['Oltin', 'Kumush', 'Mis', 'Platina', 'Bronza', 'Boshqa'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'oldest', label: 'Eng eski' },
  { value: 'price_asc', label: 'Narx: arzondan' },
  { value: 'price_desc', label: 'Narx: qimmatdan' },
  { value: 'name_asc', label: 'Nom: A-Z' },
];

const lStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.84rem', color: '#bbb', fontWeight: 500 };
const iStyle = { background: '#202020', borderRadius: '10px', width: '100%', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' };

function formatPrice(price) {
  if (!price) return '—';
  return Number(price).toLocaleString('uz-UZ') + ' so\'m';
}
function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
}
function generateCode(existingLinks) {
  const nums = existingLinks
    .map(l => l.productCode).filter(Boolean)
    .map(c => {
      const match = c.match(/\d+/);
      return match ? parseInt(match[0], 10) : NaN;
    }).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `SEP-${String(next).padStart(3, '0')}`;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}25`,
      borderRadius: '16px', padding: '1.2rem 1.4rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 150px',
    }}>
      <div style={{ background: `${color}15`, padding: '0.7rem', borderRadius: '12px', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [mediaCounts, setMediaCounts] = useState({});
  const [activeTab, setActiveTab] = useState('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', url: '', productCode: '', price: '', material: 'Oltin' });

  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ count: 50, title: '', material: 'Oltin' });
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkPrintData, setBulkPrintData] = useState(null); 
  const [isGeneratingUzum, setIsGeneratingUzum] = useState(false);

  const [adminTab, setAdminTab] = useState('inventory');
  const [payments, setPayments] = useState([]);
  const [promos, setPromos] = useState([]);
  const [customers, setCustomers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login', { replace: true });
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login', { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [linksRes, payRes, promoRes, profRes] = await Promise.all([
        supabase.from('qr_links').select('*'),
        supabase.from('payment_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*')
      ]);
      
      if (linksRes.data) {
        const mappedData = linksRes.data.map(item => ({
          ...item,
          productCode: item.productcode || item.productCode,
          createdAt: item.createdat || item.createdAt,
          updatedAt: item.updatedat || item.updatedAt,
          soldAt: item.soldat || item.soldAt,
          customerEmail: item.customeremail || item.customerEmail,
          customerLink: item.customerlink || item.customerLink
        }));
        setLinks(mappedData);
      }
      if (payRes.data) setPayments(payRes.data);
      if (promoRes.data) setPromos(promoRes.data);
      if (profRes.data) setCustomers(profRes.data);
    } catch (e) {
      console.error("Fetch error:", e);
    }
    setLoading(false);
  };
  useEffect(() => { fetchAllData(); }, []);

  const handleApprovePayment = async (pay) => {
    if(!window.confirm('Haqiqatdan ham pul tushganini tasdiqlaysizmi? Mijozning albomi faollashadi!')) return;
    await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', pay.id);
    await supabase.from('profiles').update({ is_premium: true }).eq('id', pay.user_id);
    fetchAllData();
  };

  const handleRejectPayment = async (id) => {
    if(!window.confirm('To\'lovni rad etasizmi?')) return;
    await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', id);
    fetchAllData();
  };

  const handleCreatePromo = async () => {
    const code = window.prompt("Yangi Promokod yozing (Masalan: BEPUL2026):");
    if(!code) return;
    await supabase.from('promo_codes').insert([{ code: code.toUpperCase(), plan_type: 'monthly' }]);
    fetchAllData();
  };

  const handleDeletePromo = async (id) => {
    if(!window.confirm('Ushbu promokodni o\'chirasizmi?')) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    fetchAllData();
  };

  const handleTogglePremium = async (customer) => {
    const willBePremium = !customer.is_premium;
    if(!window.confirm(`Mijozni ${willBePremium ? 'Premium (Bepul)' : 'Oddiy'} tarifiga o'tkazasizmi?`)) return;
    await supabase.from('profiles').update({ is_premium: willBePremium }).eq('id', customer.id);
    fetchAllData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };



  const stats = useMemo(() => {
    const sold = links.filter(l => l.status === 'sold');
    const available = links.filter(l => l.status !== 'sold');
    const todaySold = sold.filter(l => {
      if (!l.soldAt) return false;
      const d = new Date(l.soldAt), n = new Date();
      return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    });
    const revenue = sold.reduce((s, l) => {
      const p = parseFloat(l.price);
      return s + (isNaN(p) ? 0 : p);
    }, 0);
    return { 
      total: links.length, soldCount: sold.length, availableCount: available.length, 
      todaySold: todaySold.length, revenue
    };
  }, [links]);

  const displayed = useMemo(() => {
    let res = links.filter(l => (activeTab === 'available' ? l.status !== 'sold' : l.status === 'sold'));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(l => (l.title?.toLowerCase().includes(q) || l.productCode?.toLowerCase().includes(q) || l.material?.toLowerCase().includes(q)));
    }
    return res.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'price_asc') return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      if (sortBy === 'price_desc') return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [links, activeTab, searchQuery, sortBy]);

  const toggleStatus = async (link) => {
    const newStatus = link.status === 'sold' ? 'available' : 'sold';
    setTogglingId(link.id);
    try {
      await supabase.from('qr_links').update({
        status: newStatus,
        soldat: newStatus === 'sold' ? new Date().toISOString() : null,
        customeremail: newStatus === 'sold' ? (link.customerEmail || 'admin-manual@bmc.uz') : null
      }).eq('id', link.id);
      await fetchAllData();
    } catch (e) { alert("Xatolik yuz berdi"); }
    setTogglingId(null);
  };

  const deleteLink = async (id) => {
    if (!window.confirm("O'chirib tashlaysizmi?")) return;
    try {
      await supabase.from('qr_links').delete().eq('id', id);
      await fetchAllData();
    } catch (e) { alert("O'chirishda xatolik"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSavingFile(true);
    try {
      const qrData = {
        title: formData.title || 'Nomsiz',
        url: formData.url || '',
        productcode: formData.productCode,
        price: formData.price || '',
        material: formData.material,
        updatedat: new Date().toISOString()
      };
      if (editingId) {
        await supabase.from('qr_links').update(qrData).eq('id', editingId);
      } else {
        const newId = `BMC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabase.from('qr_links').insert({
          id: newId,
          ...qrData,
          status: 'available',
          createdat: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      await fetchAllData();
    } catch (e) { alert("Saqlashda xatolik"); }
    setSavingFile(false);
  };

  const handleSaveAndPrint = async (e) => {
    e.preventDefault();
    setIsGeneratingUzum(true);
    try {
      const qrData = {
        title: formData.title || 'Nomsiz',
        url: formData.url || '',
        productcode: formData.productCode,
        price: formData.price || '',
        material: formData.material,
        updatedat: new Date().toISOString()
      };
      let finalId = editingId;
      if (editingId) {
        await supabase.from('qr_links').update(qrData).eq('id', editingId);
      } else {
        finalId = `BMC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabase.from('qr_links').insert({
          id: finalId,
          ...qrData,
          status: 'available',
          createdat: new Date().toISOString()
        });
      }
      await fetchAllData();
      setIsModalOpen(false);
      
      // Trigger Print
      const itemToPrint = { ...qrData, id: finalId };
      setBulkPrintData([itemToPrint]); 
    } catch (e) { alert("Saqlashda xatolik"); }
    setIsGeneratingUzum(false);
  };

  const handlePrintBulkQRs = async () => {
    setIsGeneratingBulk(true);
    const newItems = [];
    try {
      const existingCodes = links.map(l => l.productCode).filter(Boolean);
      let nextNum = 0;
      const nums = existingCodes.map(c => {
        const match = c.match(/\d+/);
        return match ? parseInt(match[0], 10) : NaN;
      }).filter(n => !isNaN(n));
      if (nums.length > 0) nextNum = Math.max(...nums);

      for (let i = 0; i < bulkForm.count; i++) {
        const id = `BMC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const code = `SEP-${String(nextNum + i + 1).padStart(3, '0')}`;
        
        const item = {
          id,
          title: bulkForm.title || `Ommaviy ${code}`,
          productcode: code,
          material: bulkForm.material,
          price: '',
          url: '',
          status: 'available',
          createdat: new Date().toISOString()
        };

        const { error } = await supabase.from('qr_links').insert(item);
        if (error) {
          console.error("Insert failed for", code, error);
        } else {
          newItems.push(item);
        }
      }
      await fetchAllData();
      setIsBulkModalOpen(false);
      if (newItems.length > 0) {
        alert(`${newItems.length} ta QR kod bazaga muvaffaqiyatli qo'shildi! Endi ularni chop etishingiz mumkin.`);
        setBulkPrintData(newItems); // Store for printing only successful inserts
      } else {
        alert("Bitta ham QR kod qo'shilmadi. Baza ulanishini yoki sozlamalarni tekshiring.");
      }
    } catch (e) { alert("Xatolik yuz berdi"); }
    setIsGeneratingBulk(false);
  };


  const downloadQR = (id, code) => {
    const svg = document.getElementById(`qr-svg-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 500;
      canvas.height = 500;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 25, 25, 450, 450);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${code || id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const copyToClipboard = (id) => {

    navigator.clipboard.writeText(`${TARGET_DOMAIN}/q/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const data = links.map(l => ({
      'Nomi': l.title,
      'Artikul': l.productCode,
      'Material': l.material,
      'Narxi': l.price,
      'Holati': l.status === 'sold' ? 'Sotilgan' : 'Mavjud',
      'Mijoz Email': l.customerEmail || '-',
      'Mijoz Linki': l.customerLink || '-',
      'Yaratilgan vaqt': formatDate(l.createdAt),

      'Link': `${TARGET_DOMAIN}/q/${l.id}`
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Inventory");
    writeFile(wb, "BMC_Inventory_Report.xlsx");
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ title: '', url: '', productCode: generateCode(links), price: '', material: 'Oltin' });
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
    setEditingId(link.id);
    setFormData({
      title: link.title || '',
      url: link.url || '',
      productCode: link.productCode || '',
      price: link.price || '',
      material: link.material || 'Oltin'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #d4af37, #f1c40f)', padding: '0.6rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}>
            <Gem size={22} color="#000" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BMC LUXURY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>

          <button onClick={downloadExcel} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600 }}>
            <FileText size={18} /> Excel
          </button>
          <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600 }}>
            <LogOut size={18} /> Chiqish
          </button>
        </div>
      </nav>

      {/* ADMIN TABS */}
      <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '2rem', whiteSpace: 'nowrap' }}>
          <button onClick={() => setAdminTab('inventory')} style={{ padding: '1.2rem 0', background: 'none', border: 'none', borderBottom: adminTab === 'inventory' ? '2px solid #d4af37' : '2px solid transparent', color: adminTab === 'inventory' ? '#d4af37' : '#888', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>
            📦 QR Baza
          </button>
          <button onClick={() => setAdminTab('payments')} style={{ padding: '1.2rem 0', background: 'none', border: 'none', borderBottom: adminTab === 'payments' ? '2px solid #d4af37' : '2px solid transparent', color: adminTab === 'payments' ? '#d4af37' : '#888', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s', position: 'relative' }}>
            💰 To'lovlar 
            {payments.filter(p => p.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '99px', marginLeft: '0.5rem', position: 'absolute', top: '0.8rem' }}>{payments.filter(p => p.status === 'pending').length}</span>}
          </button>
          <button onClick={() => setAdminTab('promos')} style={{ padding: '1.2rem 0', background: 'none', border: 'none', borderBottom: adminTab === 'promos' ? '2px solid #d4af37' : '2px solid transparent', color: adminTab === 'promos' ? '#d4af37' : '#888', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>
            🎁 Promokodlar
          </button>
          <button onClick={() => setAdminTab('customers')} style={{ padding: '1.2rem 0', background: 'none', border: 'none', borderBottom: adminTab === 'customers' ? '2px solid #d4af37' : '2px solid transparent', color: adminTab === 'customers' ? '#d4af37' : '#888', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>
            👥 Mijozlar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {adminTab === 'inventory' && (
          <>
            <header style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Dashboard</h1>
              <p style={{ color: '#888', fontSize: '1.05rem' }}>Platformadagi barcha QR kodlar va sotuvlar boshqaruvi</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setIsBulkModalOpen(true)} className="btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 600, border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
                Ommaviy QR Yaratish
              </button>
              <button onClick={openNewModal} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 20px rgba(212,175,55,0.2)' }}>
                <Plus size={20} /> Yangi Qo'shish
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <StatCard icon={<Package size={24} />} label="Jami Sepochkalar" value={stats.total} color="#d4af37" />
            <StatCard icon={<Check size={24} />} label="Sotilganlar" value={stats.soldCount} color="#4ade80" />
            <StatCard icon={<ShoppingBag size={24} />} label="Mavjud" value={stats.availableCount} color="#60a5fa" />
            <StatCard icon={<TrendingUp size={24} />} label="Bugun Sotildi" value={stats.todaySold} color="#f472b6" />
            <StatCard icon={<Gem size={24} />} label="Umumiy Tushum" value={formatPrice(stats.revenue)} color="#a78bfa" />
          </div>
        </header>

        <section style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', background: '#111', padding: '0.4rem', borderRadius: '14px', gap: '0.4rem' }}>
              <button onClick={() => setActiveTab('available')} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'available' ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'transparent', color: activeTab === 'available' ? '#000' : '#888', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}>
                Mavjud <span style={{ opacity: 0.7, fontSize: '0.8em', marginLeft: '0.4rem' }}>{stats.availableCount}</span>
              </button>
              <button onClick={() => setActiveTab('sold')} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'sold' ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'transparent', color: activeTab === 'sold' ? '#000' : '#888', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}>
                Sotilgan <span style={{ opacity: 0.7, fontSize: '0.8em', marginLeft: '0.4rem' }}>{stats.soldCount}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input type="text" placeholder="Nomi, kodi yoki material bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '14px', color: '#fff', fontSize: '0.95rem' }} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 1rem', cursor: 'pointer' }}>
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
                <Loader2 size={40} className="animate-spin" color="#d4af37" />
                <p style={{ marginTop: '1rem', color: '#888' }}>Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '20px' }}>
                <ShoppingBag size={48} color="#333" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#666' }}>Hozircha hech narsa topilmadi</h3>
              </div>
            ) : displayed.map((link) => {
              const isSold = link.status === 'sold';
              const mediaCount = mediaCounts[link.id] || 0;
              return (
                <div key={link.id} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative', overflow: 'hidden', transition: '0.3s transform ease',
                }}>
                  {/* Status Badge */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: isSold ? '#4ade80' : '#60a5fa' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#d4af37', fontWeight: 700, marginBottom: '0.3rem', letterSpacing: '1px' }}>{link.productCode}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: isSold ? 'rgba(74,222,128,0.1)' : 'rgba(96,165,250,0.1)', color: isSold ? '#4ade80' : '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>
                          ● {isSold ? 'Sotilgan' : 'Mavjud'}
                        </span>
                        {mediaCount > 0 && (
                          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontWeight: 700 }}>
                            <Images size={10} style={{marginRight: '3px', verticalAlign: 'middle'}} /> {mediaCount} ta media
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                      <QRCodeSVG id={`qr-svg-${link.id}`} value={`${TARGET_DOMAIN}/q/${link.id}`} size={70} />
                    </div>

                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fff' }}>{link.title}</h3>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#888' }}>
                      <Gem size={14} color="#d4af37" /> {link.material}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4ade80' }}>
                      {formatPrice(link.price)}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.2rem', marginTop: '1rem' }}>
                    {/* ── CUSTOMER INFO (IF SOLD) ── */}
                    {isSold && (link.customerEmail || link.customerLink) && (
                      <div style={{ background: 'rgba(139,92,246,0.05)', padding: '0.8rem', borderRadius: '12px', border: '1px dotted rgba(139,92,246,0.3)', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '0.5px' }}>
                          Mijoz ma'lumotlari:
                        </div>
                        {link.customerEmail && <div style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '0.2rem' }}>📧 {link.customerEmail}</div>}
                        {link.customerLink && (
                          <a href={link.customerLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#d4af37', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <LinkIcon size={12} /> Mijoz xotira linki
                          </a>
                        )}
                      </div>
                    )}


                    {/* ── URL (Show if exists) ── */}
                    {link.url && (
                      <div style={{ background: 'rgba(212,175,55,0.05)', padding: '0.55rem 0.8rem', borderRadius: '8px', marginBottom: '0.65rem', fontSize: '0.79rem', border: '1px solid rgba(212,175,55,0.1)' }}>
                        <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'none', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ExternalLink size={12} /> {link.url.length > 35 ? link.url.substring(0, 35) + '...' : link.url}
                        </a>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', color: '#555', marginBottom: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={12}/> {formatDate(link.createdAt)}</span>
                      {isSold && <span style={{ color: '#4ade80', fontWeight: 600 }}>✓ Sotildi: {formatDate(link.soldAt)}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button onClick={() => toggleStatus(link)} disabled={togglingId === link.id} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: isSold ? 'rgba(96,165,250,0.1)' : 'rgba(74,222,128,0.1)', color: isSold ? '#60a5fa' : '#4ade80', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        {togglingId === link.id ? <Loader2 size={16} className="animate-spin" /> : isSold ? <ToggleLeft size={18}/> : <ToggleRight size={18}/>}
                        {isSold ? 'Mavjud qil' : 'Sotildi qil'}
                      </button>
                      <button onClick={() => downloadQR(link.id, link.productCode)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '10px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="QR Yuklab olish">
                        <Download size={18} />
                      </button>
                      <button onClick={() => navigate(`/q/${link.id}`)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '10px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Ko'rish">

                        <Eye size={18} />
                      </button>
                      <button onClick={() => copyToClipboard(link.id)} className="btn-icon" style={{ background: copiedId === link.id ? 'rgba(74,222,128,0.1)' : 'rgba(212,175,55,0.1)', color: copiedId === link.id ? '#4ade80' : '#d4af37', borderRadius: '10px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Linkni nusxalash">
                        {copiedId === link.id ? <Check size={18} /> : <LinkIcon size={18} />}
                      </button>
                      <button onClick={() => openEditModal(link)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '10px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tahrirlash">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteLink(link.id)} className="btn-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '10px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="O'chirish">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </>
        )}

        {/* PAYMENTS TAB */}
        {adminTab === 'payments' && (
          <section>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>To'lov So'rovlari</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {payments.length === 0 ? <p style={{ color: '#888' }}>Hech qanday to'lov so'rovi yo'q.</p> : payments.map(pay => (
                <div key={pay.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{formatDate(pay.created_at)}</span>
                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', background: pay.status === 'pending' ? 'rgba(234,179,8,0.1)' : pay.status === 'approved' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: pay.status === 'pending' ? '#eab308' : pay.status === 'approved' ? '#4ade80' : '#ef4444' }}>
                      {pay.status === 'pending' ? 'Kutilmoqda' : pay.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{pay.user_email}</h3>
                  <p style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '1rem' }}>Tarif: {pay.plan_type === 'monthly' ? '1 Oylik' : '1 Yillik'}</p>
                  
                  <a href={pay.receipt_url} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <img src={pay.receipt_url} alt="Chek" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>

                  {pay.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => handleApprovePayment(pay)} style={{ flex: 1, padding: '0.8rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Tasdiqlash</button>
                      <button onClick={() => handleRejectPayment(pay.id)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Rad etish</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROMOS TAB */}
        {adminTab === 'promos' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Promokodlar</h2>
              <button onClick={handleCreatePromo} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Plus size={20} /> Yangi Kod
              </button>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '1.2rem', color: '#888' }}>Kod</th>
                    <th style={{ padding: '1.2rem', color: '#888' }}>Holati</th>
                    <th style={{ padding: '1.2rem', color: '#888' }}>Yaratilgan</th>
                    <th style={{ padding: '1.2rem', color: '#888', width: '100px' }}>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Promokodlar yo'q</td></tr>
                  ) : promos.map(promo => (
                    <tr key={promo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1.2rem', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>{promo.code}</td>
                      <td style={{ padding: '1.2rem' }}>
                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', background: promo.is_used ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: promo.is_used ? '#ef4444' : '#4ade80' }}>
                          {promo.is_used ? 'Ishlatilgan' : 'Aktiv'}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem', color: '#888', fontSize: '0.9rem' }}>{formatDate(promo.created_at)}</td>
                      <td style={{ padding: '1.2rem' }}>
                        <button onClick={() => handleDeletePromo(promo.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CUSTOMERS TAB */}
        {adminTab === 'customers' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Mijozlar Ro'yxati</h2>
              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '12px', color: '#888' }}>Jami: {customers.length}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '1.2rem', color: '#888' }}>Juftlik (Ismlar)</th>
                    <th style={{ padding: '1.2rem', color: '#888' }}>Sana</th>
                    <th style={{ padding: '1.2rem', color: '#888' }}>Tarif Holati</th>
                    <th style={{ padding: '1.2rem', color: '#888', textAlign: 'right' }}>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Mijozlar mavjud emas</td></tr>
                  ) : customers.map(cust => (
                    <tr key={cust.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1.2rem', fontWeight: 'bold' }}>{cust.couple_names || 'Kiritilmagan'}</td>
                      <td style={{ padding: '1.2rem', color: '#888', fontSize: '0.9rem' }}>{cust.est_date || '-'}</td>
                      <td style={{ padding: '1.2rem' }}>
                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', background: cust.is_premium ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: cust.is_premium ? '#4ade80' : '#ef4444' }}>
                          {cust.is_premium ? 'Premium' : 'Oddiy (To\'lamagan)'}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                        <button onClick={() => handleTogglePremium(cust)} style={{ padding: '0.6rem 1rem', background: cust.is_premium ? 'rgba(255,255,255,0.05)' : 'linear-gradient(to right, #d4af37, #aa8022)', color: cust.is_premium ? '#fff' : '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {cust.is_premium ? 'Premium olib tashlash' : 'Bepul Premium berish'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Modal: Yangi / Tahrirlash */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#161616', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingId ? 'Sepochkani Tahrirlash' : 'Yangi Sepochka Qo\'shish'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={lStyle}>Sarlavha (Mijoz uchun)</label>
                <input type="text" className="input-glass" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Masalan: Maxsus Oltin Sepochka" style={iStyle} required />
              </div>
              
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={lStyle}>Tashqi Link (Legacy URL)</label>
                <input type="text" className="input-glass" value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="Masalan: https://instagram.com/..." style={iStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.9rem' }}>
                <div>
                  <label style={lStyle}>Artikul (Kod)</label>
                  <input type="text" className="input-glass" value={formData.productCode} onChange={e => setFormData({ ...formData, productCode: e.target.value })} style={iStyle} required />
                </div>
                <div>
                  <label style={lStyle}>Narxi (so'm)</label>
                  <input type="number" className="input-glass" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={iStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={lStyle}>Material</label>
                <select className="input-glass" value={formData.material} onChange={e => setFormData({ ...formData, material: e.target.value })} style={{ ...iStyle, cursor: 'pointer' }}>
                  {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <button type="submit" disabled={savingFile || isGeneratingUzum} className="btn-secondary" style={{ padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>
                  {savingFile ? <Loader2 className="animate-spin" /> : (editingId ? 'Saqlash' : 'Yaratish')}
                </button>
                <button type="button" onClick={handleSaveAndPrint} disabled={savingFile || isGeneratingUzum} className="btn-primary" style={{ padding: '1rem', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {isGeneratingUzum ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  {isGeneratingUzum ? 'Saqlanmoqda...' : 'Bazaga qo\'shish va Chop etish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ommaviy Yaratish */}
      {isBulkModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#161616', borderRadius: '24px', width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ommaviy QR Yaratish</h2>
              <button onClick={() => setIsBulkModalOpen(false)} style={{ background: 'none', border: 'none', color: '#666' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={lStyle}>Soni</label>
                <input type="number" className="input-glass" value={bulkForm.count} onChange={e => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) })} style={iStyle} />
              </div>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={lStyle}>Material</label>
                <select className="input-glass" value={bulkForm.material} onChange={e => setBulkForm({ ...bulkForm, material: e.target.value })} style={iStyle}>
                  {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button onClick={handlePrintBulkQRs} disabled={isGeneratingBulk} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>
                {isGeneratingBulk ? <Loader2 className="animate-spin" /> : 'QR Kodlarni Generatsiya Qilish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area for Bulk QRs */}
      {bulkPrintData && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', color: '#000', zIndex: 9999, overflow: 'auto', padding: '20px' }}>
          <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }}>
            <div>
              <h2 style={{margin: 0}}>Tayyor QR List (A4)</h2>
              <p style={{margin: 0, fontSize: '0.9rem', color: '#666'}}>Ushbu sahifani printerdan chiqarishingiz yoki PDF qilib saqlashingiz mumkin.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>PDF / PRINTER</button>
              <button onClick={() => setBulkPrintData(null)} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>YOPISH</button>
            </div>
          </div>
          
          <div id="printable-qr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto', background: '#fff', padding: '20px' }}>
            {bulkPrintData.map((item) => (
              <div key={item.id} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', borderRadius: '5px' }}>
                <QRCodeCanvas value={`${TARGET_DOMAIN}/q/${item.id}`} size={140} level="H" includeMargin={true} />
                <div style={{ marginTop: '5px', fontSize: '11px', fontWeight: 900, color: '#000' }}>{item.productCode}</div>
                <div style={{ fontSize: '9px', color: '#666' }}>{item.material}</div>
              </div>
            ))}
          </div>


          <style>{`
            @media print {
              .no-print { display: none !important; }
              body { background: #fff !important; color: #000 !important; }
              .dashboard-container { display: none !important; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
}
