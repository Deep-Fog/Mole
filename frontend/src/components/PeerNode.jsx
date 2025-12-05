import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Check, Download, FileUp, FileDown, Smartphone, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PeerNode = ({ peer, isMe = false, transfer, onSelectFile, connectionType }) => {
  const { t } = useTranslation();
  const isTransferring = transfer && (transfer.status === 'sending' || transfer.status === 'receiving' || transfer.status === 'starting');
  const isComplete = transfer?.status === 'completed';
  const progress = transfer?.progress || 0;
  const isReceiving = transfer?.status === 'receiving';

  // [FIX] Ref: Code Review Point 4
  // 判斷是否處於 "正在連接" 狀態 (非本人，且 connectionType 為空或不是已連接狀態)
  const isConnecting = !isMe && (!connectionType || connectionType === 'connecting...');

  const connectionStatus = useMemo(() => {
    if (isMe) return null;
    switch (connectionType) {
      case 'Direct':
        return { text: 'Direct', color: 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400' };
      case 'STUN':
        return { text: 'STUN', color: 'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400' };
      case 'disconnected':
         return { text: 'Disconnected', color: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400' };
      default:
        // [FIX] 為連接中狀態添加明確的文本和顏色
        return { text: 'Connecting...', color: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 animate-pulse' };
    }
  }, [connectionType, isMe]);
  
  // Generate a consistent visual identity based on ID
  const peerColor = useMemo(() => {
    const colors = ['bg-cyan-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'];
    if (isMe) return 'bg-violet-500';
    const index = peer.id.charCodeAt(0) % colors.length;
    return colors[index];
  }, [peer.id, isMe]);

  const displayName = isMe ? t('peer.me') : `${t('peer.device')} ${peer.id.slice(0, 4)}`;

  const circumference = 2 * Math.PI * 36; 
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
      animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
      exit={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
      className="absolute flex flex-col items-center"
      style={{
        ...peer.position // Contains left and top
      }}
    >
      <div className="relative group">
        {/* Interaction Hint */}
        {!isTransferring && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-200 px-2 py-1 text-[10px] text-slate-700 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-800 dark:text-slate-300">
            {isMe ? t('peer.this_is_you') : t('peer.click_to_send')}
          </div>
        )}

        {/* [FIX] Ref: Code Review Point 4 */}
        {/* 黃色脈衝動畫：僅在連接中顯示 */}
        {isConnecting && !isTransferring && (
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-yellow-400/50"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Progress Ring */}
        {(isTransferring || isComplete) && (
          <svg className="absolute -inset-2 h-16 w-16 rotate-[-90deg] md:h-24 md:w-24" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              className="stroke-slate-200 dark:stroke-white/10"
              strokeWidth="3"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              stroke={isComplete ? '#22c55e' : '#06b6d4'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
        )}

        {/* Avatar Button */}
        {/* [OPTIMIZATION] 移動端縮小尺寸 (h-16 w-16), 桌面端保持 h-20 w-20 */}
        <button
          onClick={() => !isTransferring && onSelectFile && onSelectFile()}
          disabled={isTransferring}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-200 shadow-xl backdrop-blur-md transition-all duration-300 md:h-20 md:w-20 dark:border-white/10 ${
            !isTransferring ? 'cursor-pointer hover:scale-105 hover:border-violet-400/50' : ''
          } ${isTransferring ? 'scale-95 opacity-90' : ''} bg-white/80 dark:bg-slate-900/80`}
        >
          {isComplete ? (
            <Check className="h-6 w-6 text-green-500 md:h-8 md:w-8 dark:text-green-400" />
          ) : (
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${peerColor} bg-opacity-20 md:h-10 md:w-10`}>
               {isMe ? <Monitor className={`h-5 w-5 text-slate-700 md:h-6 md:w-6 dark:text-white`} /> : <Smartphone className={`h-5 w-5 text-slate-700 md:h-6 md:w-6 dark:text-white`} />}
            </div>
          )}

          {/* Status Icon Overlay */}
          {isTransferring && (
            <div className="absolute inset-0 flex items-center justify-center">
                {isReceiving ? (
                    <FileDown className="h-6 w-6 animate-bounce text-cyan-500 md:h-8 md:w-8 dark:text-cyan-400" />
                ) : (
                    <FileUp className="h-6 w-6 animate-bounce text-violet-500 md:h-8 md:w-8 dark:text-violet-400" />
                )}
            </div>
          )}
        </button>
      </div>

      {/* Name & Status Label */}
      <div className="absolute top-full mt-2 flex flex-col items-center whitespace-nowrap md:mt-3">
        <span className="text-xs font-semibold text-slate-700 shadow-white drop-shadow-sm md:text-sm dark:text-slate-200 dark:shadow-black">
            {displayName}
        </span>
        {connectionStatus && (
            <span className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium md:mt-1 md:px-2 md:text-[10px] ${connectionStatus.color}`}>
                {connectionStatus.text}
            </span>
        )}
        {isTransferring && (
            <span className="text-[8px] text-slate-500 md:text-[10px] dark:text-slate-400">
                {Math.round(progress)}% • {transfer.name}
            </span>
        )}
        {isComplete && (
            <span className="text-[8px] text-green-500 md:text-[10px] dark:text-green-400">{t('peer.sent')}</span>
        )}
      </div>
    </motion.div>
  );
};

export default PeerNode;
