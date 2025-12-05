import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StunSelector from './StunSelector';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

const Lobby = ({ onJoin, initialRoomId, onServerSelect }) => {
  const { t } = useTranslation();
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [isCreating, setIsCreating] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim().length === 6) {
      onJoin(roomId.trim());
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    setRoomId(value);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
      onJoin(newId);
    }, 600);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* Diffused Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <motion.div 
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.8, 0.6, 0.8] // Higher opacity for light mode visibility
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute -top-[30%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-violet-300/50 blur-[120px] dark:bg-violet-600/20 dark:opacity-20 will-change-transform" 
         />
         <motion.div 
            animate={{ 
              x: [0, -70, 0],
              y: [0, 100, 0],
              scale: [1, 1.5, 1],
              opacity: [0.8, 0.5, 0.8]
            }}
            transition={{ 
              duration: 18, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-[20%] -right-[20%] h-[60vh] w-[60vh] rounded-full bg-cyan-300/50 blur-[120px] dark:bg-cyan-600/20 dark:opacity-20 will-change-transform" 
         />
         <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, -80, 0],
              scale: [1, 1.3, 1],
              opacity: [0.8, 0.6, 0.8]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 5
            }}
            className="absolute -bottom-[20%] left-[20%] h-[60vh] w-[60vh] rounded-full bg-blue-300/50 blur-[120px] dark:bg-blue-600/20 dark:opacity-20 will-change-transform" 
         />
      </div>

      <div className="absolute top-4 right-4 z-[100] flex items-center gap-2 pointer-events-auto">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-0 flex w-full max-w-md flex-col gap-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center drop-shadow-2xl md:h-32 md:w-32"
          >
            <img src="/main_icon.png" alt="Mole Logo" className="h-full w-full object-contain filter drop-shadow-lg" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500 md:text-4xl dark:from-white dark:to-white/70">
            {t('app.title')}
          </h1>
          <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/30 p-6 shadow-xl shadow-indigo-100/50 backdrop-blur-xl md:p-8 dark:border-white/10 dark:bg-white/5 dark:shadow-2xl dark:shadow-black/50">
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('lobby.enter_room_id')}
                value={roomId}
                onChange={handleInputChange}
                maxLength={6}
                className="w-full rounded-xl border border-white/50 bg-white/50 px-4 py-3 text-center text-lg text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/80 focus:ring-2 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder-white/30 dark:focus:bg-black/30"
              />
            </div>
            <motion.button
              type="submit"
              disabled={roomId.length !== 6}
              whileTap={roomId.length === 6 ? { scale: 0.98 } : {}}
              // Button Container Animation (The Gradient)
              animate={roomId.length === 6 ? {
                boxShadow: [
                  "0 0 0px rgba(236, 72, 153, 0)",
                  "0 0 30px rgba(236, 72, 153, 0.8)",
                  "0 0 0px rgba(236, 72, 153, 0)"
                ],
              } : {
                boxShadow: "0 0 0px rgba(0, 0, 0, 0)"
              }}
              whileHover={roomId.length === 6 ? { 
                scale: 1.02,
                backgroundPosition: ["100% 50%", "0% 50%"]
              } : {}}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                backgroundPosition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-[length:300%_auto] bg-gradient-to-r from-fuchsia-600 via-pink-600 via-rose-500 via-fuchsia-500 to-fuchsia-600 py-3 font-semibold text-white transition-all disabled:opacity-100"
            >
              {/* Inner Mask for "Hollow" effect */}
              <motion.div
                initial={false}
                animate={roomId.length === 6 ? { 
                  scale: 0, 
                  opacity: 0,
                  borderRadius: "100px" 
                } : { 
                  scale: 1, 
                  opacity: 1,
                  borderRadius: "10px"
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 20,
                  mass: 0.8
                }}
                // Light mode mask: bg-slate-100/90, Dark mode mask: bg-slate-900/90
                // Using CSS variable or explicit class if possible?
                // Since this is inline styles via class, we can use dark variant directly.
                className="absolute inset-[2px] bg-slate-100/90 backdrop-blur-sm dark:bg-slate-900/90"
              />
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-2 text-slate-900 dark:text-white">
                {t('lobby.join_room')} 
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-slate-300 dark:border-white/10"></div>
            <span className="mx-4 text-xs text-slate-500 dark:text-slate-400">{t('lobby.or')}</span>
            <div className="grow border-t border-slate-300 dark:border-white/10"></div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/50 py-3 font-medium text-slate-700 transition-all hover:bg-white/80 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {isCreating ? <Loader2 className="animate-spin" size={18} /> : t('lobby.create_new_room')}
          </button>
        </div>

        <StunSelector onServerSelect={onServerSelect} />

        <p className="text-center text-xs text-slate-500 dark:text-slate-500">
          {t('app.footer_disclaimer')}
        </p>
      </motion.div>
    </div>
  );
};

export default Lobby;
