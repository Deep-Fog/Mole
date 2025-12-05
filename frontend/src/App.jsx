import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Room from './components/Room';

function App() {
  // Simple URL routing: /roomId
  const getRoomFromUrl = () => {
    const path = window.location.pathname;
    return path.length > 1 ? path.substring(1) : null;
  };

  const [roomId, setRoomId] = useState(null);
  const [iceServers, setIceServers] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      setRoomId(getRoomFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleJoinRoom = (id) => {
    // Update URL without reload
    window.history.pushState({}, '', `/${id}`);
    setRoomId(id);
  };

  const handleServerSelect = (servers) => {
    setIceServers(servers);
  };

  return (
    <>
      {roomId ? (
        <Room 
          roomId={roomId} 
          iceServers={iceServers} 
          onBack={() => {
            window.history.pushState({}, '', '/');
            setRoomId(null);
          }}
        />
      ) : (
        <Lobby 
            onJoin={handleJoinRoom} 
            initialRoomId={getRoomFromUrl()} 
            onServerSelect={handleServerSelect}
        />
      )}
    </>
  );
}

export default App;