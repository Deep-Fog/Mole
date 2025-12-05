import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { testStunServer } from '../utils/stunTester';

// Default servers list
const DEFAULT_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:global.stun.twilio.com:3478',
  'stun:stun.miwifi.com:3478',
  'stun:stun.qq.com:3478', 
  'stun:stun.chat.bilibili.com:3478'
];

const StunSelector = ({ onServerSelect }) => {
  const { t } = useTranslation();
  const [servers, setServers] = useState(
    DEFAULT_SERVERS.map(url => ({ url, latency: null, status: 'pending' }))
  );
  const [isTesting, setIsTesting] = useState(false);
  const [bestServer, setBestServer] = useState(null);

  const runTests = async () => {
    setIsTesting(true);
    
    const results = [...servers];
    
    // Reset status
    results.forEach(s => {
        s.latency = null; 
        s.status = 'testing';
    });
    setServers([...results]);

    // Run tests in parallel but handle updates individually
    const promises = results.map(async (server, index) => {
      try {
        const latency = await testStunServer(server.url);
        setServers(prev => {
          const newArr = [...prev];
          newArr[index] = { ...newArr[index], latency, status: 'success' };
          return newArr;
        });
        return { ...server, latency, status: 'success' };
      } catch (err) {
        setServers(prev => {
          const newArr = [...prev];
          newArr[index] = { ...newArr[index], latency: 9999, status: 'error' };
          return newArr;
        });
        return { ...server, latency: 9999, status: 'error' };
      }
    });

    const finalResults = await Promise.all(promises);
    
    // Sort by latency (excluding errors/timeouts which act as Infinity)
    const sorted = finalResults.sort((a, b) => {
        const latA = a.status === 'success' ? a.latency : 99999;
        const latB = b.status === 'success' ? b.latency : 99999;
        return latA - latB;
    });

    setServers(sorted);
    setIsTesting(false);

    // Auto-select the best one
    const best = sorted.find(s => s.status === 'success');
    if (best) {
        setBestServer(best.url);
        // We pass the FULL list sorted, but prioritize the best one in the config
        // Or just pass the best one + a backup.
        // Let's pass the top 2 best servers to the app.
        const topServers = sorted.filter(s => s.status === 'success').slice(0, 2).map(s => ({ urls: s.url }));
        if(topServers.length > 0) {
            onServerSelect(topServers);
        }
    }
  };

  useEffect(() => {
    runTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-4 w-full max-w-md rounded-3xl border border-white/60 bg-white/30 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-300">
          <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
          <span>{t('network.optimization')}</span>
        </div>
        <button 
            onClick={runTests} 
            disabled={isTesting}
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-white/50 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10"
        >
            <RefreshCw size={14} className={isTesting ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {servers.slice(0, 3).map((server) => (
          <div 
            key={server.url} 
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all ${
                server.url === bestServer 
                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/30 dark:text-cyan-100' 
                : 'border-white/50 bg-white/40 text-slate-700 dark:border-white/10 dark:bg-black/20 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 truncate max-w-[70%]">
               {server.url === bestServer && <Check size={12} className="text-cyan-600 dark:text-cyan-400" />}
               <span className="truncate" title={server.url}>{server.url.replace('stun:', '')}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
                {server.status === 'testing' && <span className="text-slate-500 dark:text-slate-500">...</span>}
                {server.status === 'error' && <span className="text-red-500 dark:text-red-400">{t('network.fail')}</span>}
                {server.status === 'success' && (
                    <>
                        <Wifi size={12} className={server.latency < 150 ? "text-green-600 dark:text-green-400" : server.latency < 300 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"} />
                        <span className="font-mono font-medium">{server.latency}ms</span>
                    </>
                )}
            </div>
          </div>
        ))}
        
        {servers.length > 3 && (
            <div className="text-center text-[10px] text-slate-500 dark:text-slate-500">
                {t('network.others_checked', { count: servers.length - 3 })}
            </div>
        )}
      </div>
    </div>
  );
};

export default StunSelector;
