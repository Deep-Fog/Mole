import React from 'react';

const Radar = () => {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center rounded-full sm:h-72 sm:w-72">
      {/* Concentric circles */}
      <div className="absolute h-full w-full rounded-full border border-cyan-600/20 dark:border-cyan-500/10"></div>
      <div className="absolute h-2/3 w-2/3 rounded-full border border-cyan-600/20 dark:border-cyan-500/10"></div>
      <div className="absolute h-1/3 w-1/3 rounded-full border-t border-r border-cyan-600/30 dark:border-cyan-500/20"></div>

      {/* Ping animation */}
      <div className="absolute h-full w-full">
        <div className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-cyan-500/40 dark:bg-cyan-400 opacity-30"></div>
      </div>

      {/* Center glow */}
      <div className="absolute h-8 w-8 rounded-full bg-cyan-500 blur-xl"></div>
    </div>
  );
};

export default Radar;