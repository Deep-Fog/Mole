import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wind, Copy, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Radar from './Radar';
import PeerNode from './PeerNode';
import { usePeers } from '../hooks/usePeers';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

const FileDropzone = ({ isDragging }) => {
  const { t } = useTranslation();
  return (
  <AnimatePresence>
    {isDragging && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm dark:bg-slate-900/80"
      >
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-cyan-400/50 bg-slate-900 p-12 shadow-2xl shadow-cyan-900/20">
          <div className="rounded-full bg-cyan-500/10 p-6">
            <Wind size={64} className="text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t('room.release_to_broadcast')}</h2>
          <p className="text-slate-400">{t('room.broadcast_desc')}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)};

const Room = ({ roomId, iceServers, onBack }) => {
  const { t } = useTranslation();
  const { peers, localPeerId, sendFile, transferState, peerStats } = usePeers(roomId, iceServers);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Ref to store which peer we are currently selecting a file for.
  // 'ALL' means broadcast.
  const targetPeerRef = useRef(null); 
  const fileInputRef = useRef(null);

  // Responsive Radius Logic
  const [radius, setRadius] = useState(160);

  useEffect(() => {
    const updateRadius = () => {
      setRadius(window.innerWidth < 768 ? 130 : 160);
    };
    
    updateRadius(); // Initial check
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Layout Logic
  const allNodes = useMemo(() => {
    const localPeer = { 
        id: localPeerId, 
        name: 'Me', 
        position: { left: '50%', top: '50%' } 
    };
    
    const nodes = peers.map((peer, i) => {
        const angle = (i / peers.length) * 2 * Math.PI - Math.PI / 2;
        // const radius = 160; // Now dynamic
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return {
            ...peer,
            position: {
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`
            }
        };
    });

    return [localPeer, ...nodes];
  }, [peers, localPeerId, radius]);

  // File Handling
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && peers.length > 0) {
      const file = files[0];
      // Broadcast
      peers.forEach(p => sendFile(file, p.id));
    }
  };

  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (file && targetPeerRef.current) {
        if (targetPeerRef.current === 'ALL') {
            peers.forEach(p => sendFile(file, p.id));
        } else {
            sendFile(file, targetPeerRef.current);
        }
    }
    // Reset
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = (targetId) => {
    targetPeerRef.current = targetId;
    fileInputRef.current?.click();
  };

  // Find active transfer for a peer
  const getTransferForPeer = (peerId) => {
    // We find the most relevant transfer. 
    // Prioritize 'receiving' or 'sending' over 'completed'.
    const active = Object.values(transferState).find(t => t.peerId === peerId && t.status !== 'completed');
    if (active) return active;
    
    // If no active, show latest completed? 
    // For now just return active or undefined.
    // Actually, if recently completed, it's nice to show 'Sent'.
    // But cleaning up 'completed' state is tricky if we don't have a timer.
    // transferState keeps growing. We might want to grab the *latest* by timestamp if we had one.
    // Let's just grab the last one in the list that matches.
    const allForPeer = Object.values(transferState).filter(t => t.peerId === peerId);
    if (allForPeer.length === 0) return undefined;
    return allForPeer[allForPeer.length - 1];
  };

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-[20%] -left-[20%] h-[70vh] w-[70vh] rounded-full bg-violet-300/50 blur-[100px] dark:bg-violet-600/20 dark:opacity-30" />
         <div className="absolute top-[40%] -right-[20%] h-[60vh] w-[60vh] rounded-full bg-cyan-300/50 blur-[100px] dark:bg-cyan-600/20 dark:opacity-30" />
      </div>

      <FileDropzone isDragging={isDragging} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              title={t('room.back_to_lobby')}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex h-12 w-12 items-center justify-center">
                <img src="/main_icon.png" alt="Mole Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="hidden text-xl font-bold tracking-tight text-slate-900 md:block dark:text-white">{t('app.title')}</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/40 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-md transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
            {copied ? <CheckCircle2 size={16} className="text-green-500 dark:text-green-400"/> : <Copy size={16} />}
            <span className="hidden sm:inline">{t('room.room_label')}: {roomId}</span>
            </button>
        </div>
      </header>

      {/* Main Radar Area */}
      <main className="relative flex h-full w-full items-center justify-center">
        <Radar />
        <AnimatePresence>
          {allNodes.map(peer => (
            <PeerNode
              key={peer.id}
              peer={peer}
              isMe={peer.id === localPeerId}
              transfer={getTransferForPeer(peer.id)}
              connectionType={peerStats[peer.id]}
              onSelectFile={() => {
                  // If it's me, I can't send to myself.
                  // But maybe 'Click Me' could mean 'Broadcast'?
                  // For now, let's restrict sending to 'Others'.
                  if (peer.id !== localPeerId) {
                      triggerFileSelect(peer.id);
                  }
              }}
            />
          ))}
        </AnimatePresence>
        
        {peers.length === 0 && (
            <div className="absolute bottom-32 text-center animate-pulse">
                <p className="text-slate-500 dark:text-slate-500">{t('room.waiting_title')}</p>
                <p className="text-xs text-slate-400 mt-1 dark:text-slate-600">{t('room.waiting_desc')}</p>
            </div>
        )}
      </main>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelected}
        className="hidden"
      />
    </div>
  );
};

export default Room;