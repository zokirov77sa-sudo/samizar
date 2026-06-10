import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function RedirectHandler() {
  const { id } = useParams();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const docRef = doc(db, "qr_links", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const { url } = data;

          if (!url) {
            setError(true);
            setLoading(false);
            return;
          }

          // Shunchaki ko'rsatilgan silka bo'yicha to'g'ridan to'g'ri o'tkazish
          setTimeout(() => {
            window.location.href = url.startsWith('http') ? url : `https://${url}`;
          }, 1200); 

        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching doc:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchLink();
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      {error && !loading ? (
         <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <span style={{ fontSize: '1.5rem' }}>❌</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#ff4444' }}>Ma'lumot topilmadi</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>Bu mahsulot uchun hozircha ma'lumot ulanmagan yoki kod noto'g'ri skaner qilindi.</p>
         </div>
      ) : (
         <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', border: '2px solid rgba(212, 175, 55, 0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem auto', boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', fontWeight: 300, letterSpacing: '1px', color: '#fff' }}>O'lmas Xotiralar...</h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>Sahifangizga yo'naltirilmoqda, kuting</p>
         </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
