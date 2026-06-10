import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Gem, LogOut, Package, Crown, ChevronRight, Crown as CrownIcon } from 'lucide-react';

export default function ClientDashboard() {
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const cid = localStorage.getItem('bmc_customer_id');
      if (!cid) {
        navigate('/profile-login');
        return;
      }
      try {
        const { data: customerData, error: custErr } = await supabase
          .from('customers')
          .select('*')
          .eq('id', cid)
          .single();

        if (customerData) {
          setCustomer(customerData);
          
          const { data: itemsData } = await supabase
            .from('qr_links')
            .select('*')
            .eq('customerId', cid);
            
          setItems(itemsData || []);
        } else {
          localStorage.removeItem('bmc_customer_id');
          navigate('/profile-login');
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('bmc_customer_id');
    navigate('/profile-login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: '4rem' }}>
      {/* HEADER */}
      <header style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(212,175,55,0.12)', background: 'rgba(10,10,10,0.8)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Gem size={22} color="#d4af37" />
            <span style={{ fontWeight: 700, color: '#d4af37', fontSize: '1.1rem' }}>Mening Profilim</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,50,50,0.1)', color: '#f87171', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <LogOut size={15} /> Chiqish
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* PROFILE CARD */}
        <div style={{ background: 'linear-gradient(145deg, rgba(20,20,20,1) 0%, rgba(30,30,30,1) 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.2rem' }}>Xush kelibsiz, {customer.name || 'Mijoz'}!</h1>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Telefon: {customer.phone}</p>
          </div>
          <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CrownIcon size={18} color="#d4af37" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Joriy Tarif</div>
              <div style={{ color: '#d4af37', fontWeight: 700, fontSize: '0.95rem', textTransform: 'capitalize' }}>{customer.plan || 'Free'} Plan</div>
            </div>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Package size={20} color="#d4af37" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Mening Taqinchoqlarim ({items.length})</h2>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <p style={{ color: '#888' }}>Sizda hozircha hech qanday taqinchoq yo'q.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {items.map(item => (
              <div key={item.id} onClick={() => window.open(`/q/${item.id}`, '_blank')} style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-bg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>💎</div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.2rem' }}>{item.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Kodi: {item.productCode} • {item.material}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: '99px' }}>Xotiralarni boshqarish</span>
                  <ChevronRight size={18} color="#666" />
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`.hover-bg:hover { background: rgba(255,255,255,0.05) !important; }`}</style>
      </main>
    </div>
  );
}
