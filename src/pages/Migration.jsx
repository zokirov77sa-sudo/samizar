import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../supabase';
import { Loader2 } from 'lucide-react';

export default function Migration() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        addLog(`Joriy admin tizimga kirdi: ${user.email}`);
      }
    });
    return () => unsub();
  }, []);

  const addLog = (msg) => setLogs(prev => [...prev, msg]);

  const handleResetPassword = async () => {
    if (!email) {
      alert("Iltimos, avval pochtangizni yozing!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Parolni tiklash havolasi ${email} ga yuborildi! Pochtangizni tekshiring.`);
    } catch(err) {
      alert("Xatolik: " + err.message);
    }
  };

  const startMigration = async () => {
    setLoading(true);
    try {
      if (email && password) {
        addLog("Firebase'ga admin sifatida kirilmoqda...");
        await signInWithEmailAndPassword(auth, email, password);
        addLog("Tizimga muvaffaqiyatli kirildi!");
      }

      addLog("Firebase'dan mijozlarni qidirmoqdamiz...");
      const custSnap = await getDocs(collection(db, "customers"));
      const customers = custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (customers.length > 0) {
        addLog(`${customers.length} ta mijoz topildi. Supabase'ga yozilmoqda...`);
        const { error } = await supabase.from('customers').upsert(customers.map(c => ({
          phone: c.phone, password: c.password, name: c.name || '', plan: c.plan || 'Free'
        })));
        if (error) addLog("Mijozlarda xatolik: " + error.message);
        else addLog("Mijozlar muvaffaqiyatli o'tdi!");
      }

      addLog("Firebase'dan QR kodlarni qidirmoqdamiz...");
      const qrSnap = await getDocs(collection(db, "qr_links"));
      const qrLinks = qrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (qrLinks.length > 0) {
        addLog(`${qrLinks.length} ta QR kod topildi. Supabase'ga yozilmoqda...`);
        const { error } = await supabase.from('qr_links').upsert(qrLinks.map(q => ({
          id: q.id, title: q.title || '', url: q.url || '', productCode: q.productCode || '',
          price: String(q.price || ''), material: q.material || '', status: q.status || 'available',
          createdAt: q.createdAt || new Date().toISOString(), updatedAt: q.updatedAt || new Date().toISOString(),
          soldAt: q.soldAt || null, customerEmail: q.customerEmail || null, customerLink: q.customerLink || null,
          customerId: q.customerId || null, customerMessage: q.customerMessage || null
        })));
        if (error) addLog("QR kodlarda xatolik: " + error.message);
        else addLog("QR kodlar muvaffaqiyatli o'tdi!");
        
        for (const qr of qrLinks) {
          const mediaSnap = await getDocs(collection(db, `qr_links/${qr.id}/media`));
          const mediaDocs = mediaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (mediaDocs.length > 0) {
             addLog(`${qr.productCode} uchun ${mediaDocs.length} ta rasm ko'chirilmoqda...`);
             const { error: mError } = await supabase.from('media').upsert(mediaDocs.map(m => ({
                qr_link_id: qr.id, url: m.url || m.src, type: m.type || 'image', created_at: m.createdAt || new Date().toISOString()
             })));
             if (mError) addLog("Rasm xatoligi: " + mError.message);
          }
        }
      }
      addLog("✅ Barcha ma'lumotlar muvaffaqiyatli ko'chirildi!");
    } catch(err) {
      console.error(err);
      addLog("❌ XATOLIK: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#0a0a0a', color: '#fff' }}>
      <h1>Supabase Migratsiyasi</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Firebase ma'lumotlarini Supabase'ga o'tkazish sahifasi. Buni faqat Admin bajara oladi.</p>
      
      {!isLoggedIn && (
        <div style={{ marginBottom: '1.5rem', background: '#111', padding: '1rem', borderRadius: '12px', border: '1px solid #333', maxWidth: '400px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Admin parolini kiriting (Firebase)</h3>
          <input type="email" placeholder="Email (masalan: admin@bmc.uz)" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
          <input type="password" placeholder="Parol" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span onClick={handleResetPassword} style={{ color: '#d4af37', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>Parolim esdan chiqdi</span>
          </div>
        </div>
      )}

      <button onClick={startMigration} disabled={loading} style={{ padding: '1rem 2rem', background: '#d4af37', color: '#000', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {loading && <Loader2 className="animate-spin" />}
        {loading ? "Ko'chirilmoqda..." : "Migratsiyani Boshlash"}
      </button>

      <div style={{ marginTop: '2rem', background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
        <h3 style={{ marginBottom: '1rem' }}>Jarayon jurnali (Logs):</h3>
        {logs.map((l, i) => <div key={i} style={{ marginBottom: '8px', color: '#ccc', fontFamily: 'monospace' }}>{l}</div>)}
      </div>
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
