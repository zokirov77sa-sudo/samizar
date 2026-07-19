import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, VolumeX, SkipForward } from 'lucide-react';

// A simple hook to use interval for progress bar
function useInterval(callback, delay) {
  const savedCallback = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// Particle component for romantic background effect
const Particles = () => {
  const particles = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/40 blur-[1px]"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            opacity: Math.random() * 0.5 + 0.3,
            scale: Math.random() * 1.5 + 0.5
          }}
          animate={{
            y: window.innerHeight + 20,
            x: `calc(${Math.random() * 100}vw)`,
            rotate: 360
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
          style={{
            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
          }}
        />
      ))}
    </div>
  );
};

export default function CinematicStory({ stories, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const STORY_DURATION = 8000; // 8 seconds per slide
  const UPDATE_INTERVAL = 50; 
  const audioRef = useRef(null);

  // Background romantic music
  const romanticMusic = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_b8c910368a.mp3"; 

  useInterval(() => {
    if (!hasStarted) return;
    
    setProgress(prev => {
      const next = prev + (UPDATE_INTERVAL / STORY_DURATION) * 100;
      if (next >= 100) {
        handleNext();
        return 0;
      }
      return next;
    });
  }, hasStarted ? UPDATE_INTERVAL : null);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleComplete = () => {
    setHasStarted(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onComplete();
  };

  const handleStart = () => {
    setHasStarted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(e => console.log("Audio play prevented:", e));
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleScreenClick = (e) => {
    if (!hasStarted) return;
    const width = window.innerWidth;
    const clickX = e.clientX;
    if (clickX < width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  if (!stories || stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-[#0a0508] z-[9999] flex flex-col items-center justify-center text-white">
        <Particles />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-20 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-[#d4af37] to-[#e6c981] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)] relative">
             <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping opacity-30"></div>
             <Heart size={40} className="text-[#1a0b11] fill-current" />
          </div>
          <h1 className="text-4xl font-serif mb-4 tracking-wide text-center">Bizning Hikoya</h1>
          <p className="text-gray-400 font-light mb-10 text-center max-w-sm px-6">
            Ovozni yoqing va his-tuyg'ularga boy kichik kinodan bahramand bo'ling.
          </p>
          <button 
            onClick={handleStart}
            className="px-10 py-4 bg-[#d4af37] hover:bg-[#e6c981] text-black font-bold rounded-full transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)] transform hover:scale-105"
          >
            Boshlash
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden" onClick={handleScreenClick}>
      <audio ref={audioRef} src={romanticMusic} loop />
      
      {/* Background Particles */}
      <Particles />

      {/* Progress Bars (Instagram style) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-2">
        {stories.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-white transition-all duration-50 ease-linear"
              style={{
                width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`
              }}
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-10 right-4 z-50 flex gap-4">
        <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleComplete(); }} className="px-4 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center gap-2 text-white border border-white/20 hover:bg-black/60 transition-colors text-sm font-medium">
          O'tkazib yuborish <SkipForward size={16} />
        </button>
      </div>

      {/* Story Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          {/* Ken Burns Effect Image */}
          <motion.div 
            initial={{ scale: 1.1, x: 0, y: 0 }}
            animate={{ scale: 1.0, x: -10, y: 10 }}
            transition={{ duration: STORY_DURATION / 1000, ease: "linear" }}
            className="absolute inset-0"
          >
            <img 
              src={currentStory.image_url} 
              alt="story" 
              className="w-full h-full object-cover filter contrast-125 saturate-150 brightness-90 sepia-[0.1]"
            />
          </motion.div>

          {/* Cinematic Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>

          {/* Typewriter/Fade Caption */}
          <div className="absolute inset-x-0 bottom-0 p-8 pb-16 z-30 flex items-end justify-center min-h-[50%]">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="text-white text-2xl md:text-4xl font-serif text-center leading-relaxed drop-shadow-2xl max-w-4xl"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
            >
              {currentStory.caption}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Invisible click areas helper visually */}
      <div className="absolute inset-y-0 left-0 w-[30%] z-40"></div>
      <div className="absolute inset-y-0 right-0 w-[70%] z-40"></div>
    </div>
  );
}
