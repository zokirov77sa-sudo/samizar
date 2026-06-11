import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import LivingAlbum from '../components/LivingAlbum';

export default function PreviewAlbum() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  if (!userId) {
    return <div className="min-h-screen bg-[#111] flex items-center justify-center text-[#c88c75]">Yuklanmoqda...</div>;
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-[999]">
        <button onClick={() => window.history.back()} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-white font-medium hover:bg-white/20 transition-colors">
          &larr; Orqaga (Dashboard)
        </button>
      </div>
      <LivingAlbum userId={userId} />
    </div>
  );
}
