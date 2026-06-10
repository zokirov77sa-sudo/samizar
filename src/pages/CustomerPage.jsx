import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Heart, Gem, ExternalLink, Sparkles, ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import LivingAlbum from '../components/LivingAlbum';
import QRRegistration from '../components/QRRegistration';
export default function CustomerPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('qr_links')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !data) {
        setError('Bu QR kod bazada topilmadi.');
        setLoading(false);
        return;
      }

      setItem(data);

      let mediaItems = [];
      try {
        const { data: mData } = await supabase
          .from('media')
          .select('*')
          .eq('qr_link_id', id);
        mediaItems = mData || [];
        setMedia(mediaItems);
      } catch {
        setMedia([]);
      }

      if (mediaItems.length === 0 && data.url) {
        setTimeout(() => {
          const target = data.url.startsWith('http') ? data.url : `https://${data.url}`;
          window.location.href = target;
        }, 2000);
      }
    } catch (err) {
      setError('Ulanishda xatolik: ' + err.message);
    }
    setLoading(false);
  };

  const prevImg = () => setActiveImg(i => (i === 0 ? media.length - 1 : i - 1));
  const nextImg = () => setActiveImg(i => (i === media.length - 1 ? 0 : i + 1));

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingGem}>💎</div>
        <div style={styles.loadingBar}>
          <div style={styles.loadingFill} className="loading-fill" />
        </div>
        <p style={styles.loadingText}>Yuklanmoqda...</p>
        <style>{`
          @keyframes loadFill { from { width: 0%; } to { width: 100%; } }
          .loading-fill { animation: loadFill 1.5s ease-out forwards; }
          @keyframes gemPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorWrap}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ color: '#ff4444', marginBottom: '0.5rem' }}>Topilmadi</h2>
        <p style={{ color: '#888', maxWidth: '300px', textAlign: 'center', lineHeight: 1.6 }}>{error}</p>
      </div>
    );
  }

  const isSold = item.status === 'sold';
  const hasMedia = media.length > 0;
  const displayLink = item.customerLink || item.url;

  if (isSold && item.user_id) {
    return <LivingAlbum userId={item.user_id} />;
  }

  if (!isSold) {
    return <QRRegistration qrLink={item} onRegistered={fetchData} />;
  }

  return (
    <div style={styles.page}>
      {/* Background Effects */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}><Gem size={20} color="#000" /></div>
            <span style={styles.logoText}>BMC LUXURY</span>
          </div>
          <div style={styles.productCode}>{item.productCode}</div>
        </header>

        {/* Media Gallery */}
        {hasMedia ? (
          <div style={styles.galleryWrap}>
            <div
              style={styles.galleryMain}
              onClick={() => setLightbox(true)}
            >
              <img
                src={media[activeImg]?.url || media[activeImg]?.src}
                alt={`Rasm ${activeImg + 1}`}
                style={styles.galleryImg}
                onError={e => { e.target.src = 'https://via.placeholder.com/500x400/111/333?text=BMC+Luxury'; }}
              />
              <div style={styles.zoomHint}><ZoomIn size={18} /> Kattalashtirish</div>
              {media.length > 1 && (
                <>
                  <button style={{ ...styles.galleryBtn, left: '0.75rem' }} onClick={e => { e.stopPropagation(); prevImg(); }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button style={{ ...styles.galleryBtn, right: '0.75rem' }} onClick={e => { e.stopPropagation(); nextImg(); }}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {media.length > 1 && (
              <div style={styles.thumbRow}>
                {media.map((m, i) => (
                  <div
                    key={m.id}
                    onClick={() => setActiveImg(i)}
                    style={{
                      ...styles.thumb,
                      border: i === activeImg ? '2px solid #d4af37' : '2px solid transparent',
                    }}
                  >
                    <img
                      src={m.url || m.src}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = 'https://via.placeholder.com/80x80/111/333?text=BMC'; }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.noMediaWrap}>
            <div style={styles.noMediaIcon}><Gem size={40} color="#d4af37" /></div>
          </div>
        )}

        {/* Product Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.statusBadge(isSold)}>
            {isSold ? '● Sotilgan' : '● Mavjud'}
          </div>

          <h1 style={styles.title}>{item.title || 'BMC Luxury Buyum'}</h1>

          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <div style={styles.metaLabel}>Material</div>
              <div style={styles.metaValue}>
                <Gem size={14} color="#d4af37" style={{ marginRight: '0.3rem' }} />
                {item.material || '—'}
              </div>
            </div>
            {item.price && (
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Narxi</div>
                <div style={{ ...styles.metaValue, color: '#4ade80' }}>
                  {Number(item.price).toLocaleString('uz-UZ')} so'm
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* SOLD — Memory Section */}
          {isSold && (
            <div style={styles.memorySection}>
              <div style={styles.memoryHeader}>
                <Sparkles size={18} color="#d4af37" />
                <span style={styles.memoryTitle}>Maxsus Xotira</span>
              </div>

              {item.customerMessage && (
                <blockquote style={styles.messageBlock}>
                  "{item.customerMessage}"
                </blockquote>
              )}

              {displayLink && (
                <a
                  href={displayLink}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.memoryBtn}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ExternalLink size={18} />
                  XOTIRANI KO'RISH
                </a>
              )}

              {item.soldAt && (
                <div style={styles.soldDate}>
                  🗓️ {new Date(item.soldAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>© 2026 BMC LUXURY · Premium Jewelry</p>
        </footer>
      </main>

      {/* Lightbox */}
      {lightbox && hasMedia && (
        <div style={styles.lightboxBg} onClick={() => setLightbox(false)}>
          <button style={styles.lightboxClose} onClick={() => setLightbox(false)}>
            <X size={24} />
          </button>
          <img
            src={media[activeImg]?.url || media[activeImg]?.src}
            alt=""
            style={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          {media.length > 1 && (
            <>
              <button style={{ ...styles.lightboxNav, left: '1rem' }} onClick={e => { e.stopPropagation(); prevImg(); }}>
                <ChevronLeft size={28} />
              </button>
              <button style={{ ...styles.lightboxNav, right: '1rem' }} onClick={e => { e.stopPropagation(); nextImg(); }}>
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'fixed', top: '-20%', left: '-10%',
    width: '500px', height: '500px',
    background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'fixed', bottom: '-10%', right: '-10%',
    width: '400px', height: '400px',
    background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 65%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  main: {
    maxWidth: '480px', margin: '0 auto', padding: '1.5rem',
    position: 'relative', zIndex: 1,
    animation: 'fadeUp 0.7s ease-out',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.5rem', paddingBottom: '1rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
  },
  logoIcon: {
    background: 'linear-gradient(135deg, #d4af37, #f1c40f)',
    padding: '0.5rem', borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
    display: 'flex',
  },
  logoText: {
    fontSize: '1rem', fontWeight: 800, letterSpacing: '1px',
    background: 'linear-gradient(to right, #fff, #ccc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  productCode: {
    fontSize: '0.7rem', color: '#d4af37', fontWeight: 700,
    letterSpacing: '1.5px', opacity: 0.8,
  },

  // Gallery
  galleryWrap: { marginBottom: '1.5rem' },
  galleryMain: {
    position: 'relative', borderRadius: '20px', overflow: 'hidden',
    background: '#111', cursor: 'zoom-in',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    aspectRatio: '4/3',
  },
  galleryImg: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    transition: 'transform 0.4s ease',
  },
  zoomHint: {
    position: 'absolute', bottom: '0.75rem', right: '0.75rem',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    color: '#d4af37', fontSize: '0.72rem', fontWeight: 600,
    padding: '0.35rem 0.7rem', borderRadius: '99px',
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    pointerEvents: 'none',
  },
  galleryBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
    borderRadius: '50%', width: '38px', height: '38px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 2, transition: '0.2s',
  },
  thumbRow: {
    display: 'flex', gap: '0.6rem', marginTop: '0.75rem',
    overflowX: 'auto', paddingBottom: '0.25rem',
  },
  thumb: {
    width: '60px', height: '60px', borderRadius: '10px',
    overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
    transition: 'border-color 0.2s',
  },
  noMediaWrap: {
    aspectRatio: '4/3', background: 'rgba(255,255,255,0.02)',
    borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1.5rem',
    animation: 'shimmer 2.5s infinite',
  },
  noMediaIcon: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
  },

  // Info card
  infoCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px', padding: '1.75rem',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  },
  statusBadge: (isSold) => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.5px',
    padding: '0.3rem 0.8rem', borderRadius: '99px', marginBottom: '0.8rem',
    background: isSold ? 'rgba(74,222,128,0.08)' : 'rgba(96,165,250,0.08)',
    color: isSold ? '#4ade80' : '#60a5fa',
    border: isSold ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(96,165,250,0.2)',
  }),
  title: {
    fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2,
    marginBottom: '1.2rem', color: '#fff',
    letterSpacing: '-0.3px',
  },
  metaRow: {
    display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
    marginBottom: '1.2rem',
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  metaLabel: { fontSize: '0.68rem', color: '#666', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' },
  metaValue: {
    fontSize: '0.95rem', fontWeight: 700, color: '#fff',
    display: 'flex', alignItems: 'center',
  },
  divider: {
    height: '1px', background: 'rgba(255,255,255,0.05)',
    margin: '1.2rem 0',
  },

  // Memory section (sold)
  memorySection: {
    animation: 'fadeUp 0.6s ease-out',
  },
  memoryHeader: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginBottom: '1rem',
  },
  memoryTitle: {
    fontSize: '0.75rem', fontWeight: 800, color: '#d4af37',
    letterSpacing: '1.5px', textTransform: 'uppercase',
  },
  messageBlock: {
    fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.7,
    color: '#e0e0e0', marginBottom: '1.5rem',
    padding: '1rem 1.25rem',
    background: 'rgba(212,175,55,0.04)',
    borderLeft: '3px solid rgba(212,175,55,0.4)',
    borderRadius: '0 12px 12px 0',
    whiteSpace: 'pre-wrap',
  },
  memoryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
    padding: '1rem 2rem', background: 'linear-gradient(135deg, #d4af37, #f1c40f)',
    color: '#000', borderRadius: '50px', fontWeight: 800, fontSize: '0.9rem',
    textDecoration: 'none', boxShadow: '0 12px 30px rgba(212,175,55,0.25)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginBottom: '1rem',
  },
  soldDate: {
    fontSize: '0.75rem', color: '#555', marginTop: '1rem',
  },

  // Available info
  availableInfo: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '1rem', background: 'rgba(212,175,55,0.05)',
    borderRadius: '14px', border: '1px solid rgba(212,175,55,0.12)',
  },
  availableText: {
    fontSize: '0.88rem', color: '#aaa', lineHeight: 1.6,
    margin: 0,
  },

  footer: {
    textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem',
    fontSize: '0.65rem', color: '#333', letterSpacing: '1px',
  },

  // Loading
  loadingWrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0a0a0a', gap: '1rem',
  },
  loadingGem: { fontSize: '3rem', animation: 'gemPulse 1.5s infinite' },
  loadingBar: {
    width: '120px', height: '2px',
    background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden',
  },
  loadingFill: {
    height: '100%', background: 'linear-gradient(90deg, #d4af37, #f1c40f)',
    borderRadius: '99px',
  },
  loadingText: { color: '#555', fontSize: '0.8rem' },

  // Error
  errorWrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0a0a0a',
  },

  // Lightbox
  lightboxBg: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
    backdropFilter: 'blur(20px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  lightboxImg: {
    maxWidth: '90vw', maxHeight: '85vh',
    objectFit: 'contain', borderRadius: '12px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
  },
  lightboxClose: {
    position: 'absolute', top: '1.5rem', right: '1.5rem',
    background: 'rgba(255,255,255,0.1)', border: 'none',
    color: '#fff', borderRadius: '50%',
    width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 1,
  },
  lightboxNav: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    borderRadius: '50%', width: '50px', height: '50px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
};
