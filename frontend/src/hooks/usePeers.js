import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';
import streamSaver from 'streamsaver';

// **关键**：WebRTC 的 ICE (STUN) 服务器配置。
// STUN 服务器用于 NAT 穿透，帮助客户端发现公网 IP。
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: "stun:stun.nextcloud.com:443" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

export const usePeers = (roomId, customIceServers) => {
  const [peers, setPeers] = useState([]);
  const [transferState, setTransferState] = useState({});
  const [peerStats, setPeerStats] = useState({});
  const localPeerIdRef = useRef(uuidv4()); // 为本地用户生成一个唯一 ID
  const wsRef = useRef(null);
  const peersRef = useRef({}); // 存储 Peer 实例 { socketId: peer }
  
  // 缓存配置以防止依赖项更改时出现重新创建的问题
  const peerConfig = useRef({
    iceServers: customIceServers || ICE_SERVERS.iceServers
  });
  
  // 如果 props 更改，更新配置
  useEffect(() => {
      if (customIceServers) {
          peerConfig.current = { iceServers: customIceServers };
      }
  }, [customIceServers]);

  // [重构] 用于存储正在接收的文件流写入器
  const incomingFilesRef = useRef({});

  // 清理某个节点的资源
  const cleanupPeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].destroy();
      delete peersRef.current[socketId];
    }
    // 清理该节点正在传输的流（如果有）
    if (incomingFilesRef.current[socketId]) {
        try {
            incomingFilesRef.current[socketId].writer.abort("Peer disconnected");
        } catch (e) { console.error(e); }
        delete incomingFilesRef.current[socketId];
    }
    setPeers(prev => prev.filter(p => p.id !== socketId));
    setPeerStats(prev => {
        const newStats = { ...prev };
        delete newStats[socketId];
        return newStats;
    });
  }, []);

  // 辅助函数：延迟清理传输状态
  const scheduleTransferCleanup = useCallback((fileId) => {
      setTimeout(() => {
          setTransferState(prev => {
              const newState = { ...prev };
              delete newState[fileId];
              return newState;
          });
      }, 5000); // 保持 'completed' 状态 5 秒
  }, []);

  const updatePeerConnectionStats = useCallback(async (peerId, peer) => {
      if (!peer || !peer._pc) return;
      
      let status = 'connecting...';
      if (peer.connected) {
          try {
              const stats = await peer._pc.getStats();
              let selectedPair;
              stats.forEach(stat => {
                  if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                      selectedPair = stat;
                  }
              });

              if (selectedPair) {
                  const remoteCandidate = stats.get(selectedPair.remoteCandidateId);
                  if (remoteCandidate) {
                       status = remoteCandidate.candidateType === 'host' ? 'Direct' : 'STUN';
                  }
              } else {
                  status = 'Connected'; // 回退
              }
          } catch (e) {
              console.error("Stats error", e);
              status = 'Error';
          }
      }
      
      setPeerStats(prev => ({ ...prev, [peerId]: status }));
  }, []);

  const handleFileData = useCallback(async (data, fromPeerId) => {
    // 优化：只有当数据较小时 (< 16KB) 才尝试解析
    let message = null;
    if (data.byteLength < 16 * 1024) {
        try {
            const text = new TextDecoder().decode(data);
            const parsed = JSON.parse(text);
            if (parsed && parsed.type) {
                message = parsed;
            }
        } catch (e) { }
    }

    // 情况 1: 信令消息 (JSON)
    if (message) {
        try {
            if (message.type === 'file-start') {
                const { name, size, fileId, fileType } = message;
                console.log(`Starting download stream for: ${name} (${size} bytes)`);
                
                const fileStream = streamSaver.createWriteStream(name, { size: size });
                const writer = fileStream.getWriter();

                incomingFilesRef.current[fromPeerId] = {
                    writer,
                    fileId,
                    size,
                    received: 0
                };

                setTransferState(prev => ({
                    ...prev,
                    [fileId]: { 
                        type: 'file-meta', 
                        name, 
                        size, 
                        fileType, 
                        fileId, 
                        progress: 0, 
                        status: 'receiving', 
                        peerId: fromPeerId 
                    }
                }));
            } 
            else if (message.type === 'file-end') {
                const { fileId } = message;
                const activeTransfer = incomingFilesRef.current[fromPeerId];
                
                if (activeTransfer && activeTransfer.fileId === fileId) {
                    console.log("File transfer finished, closing stream.");
                    await activeTransfer.writer.close();
                    delete incomingFilesRef.current[fromPeerId];

                    setTransferState(prev => ({
                        ...prev,
                        [fileId]: { ...prev[fileId], progress: 100, status: 'completed' }
                    }));
                    
                    scheduleTransferCleanup(fileId);
                }
            }
        } catch (e) {
            console.error("Failed to handle signaling message:", e);
        }
        return;
    }

    // 情况 2: 二进制数据块 (Chunk)
    const activeTransfer = incomingFilesRef.current[fromPeerId];
    if (!activeTransfer) return;

    try {
        await activeTransfer.writer.write(data);
        activeTransfer.received += data.byteLength || data.length || 0;
        const progress = (activeTransfer.received / activeTransfer.size) * 100;
        
        setTransferState(prev => ({
            ...prev,
            [activeTransfer.fileId]: { ...prev[activeTransfer.fileId], progress, status: 'receiving' }
        }));
    } catch (err) {
        console.error("Error writing to stream:", err);
    }
  }, [scheduleTransferCleanup]);

  useEffect(() => {
    if (!roomId) return;

    let reconnectTimer = null;
    let isUnmounting = false;

    const connectWebSocket = () => {
      if (isUnmounting) return;

      const getWebSocketUrl = (id) => {
        const envUrl = import.meta.env.VITE_WORKER_URL;
        if (envUrl) return `${envUrl.replace(/\/$/, '')}/${id}`;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return `ws://localhost:8787/${id}`;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/${id}`;
      };

      wsRef.current = new WebSocket(getWebSocketUrl(roomId));

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        wsRef.current.send(JSON.stringify({ type: 'join', id: localPeerIdRef.current }));
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        const createPeer = (peerId, initiator) => {
          console.log(`Creating peer connection to ${peerId}`);
          const peer = new Peer({
            initiator,
            config: peerConfig.current,
            trickle: true,
          });

          const connectionTimeout = setTimeout(() => {
            if (peer && !peer.connected && !peer.destroyed) {
              console.error(`Connection to ${peerId} timed out`);
              peer.destroy();
            }
          }, 15000);

          peer.on('signal', (data) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'signal',
                    to: peerId,
                    from: localPeerIdRef.current,
                    signal: data,
                }));
            }
          });

          peer.on('connect', () => {
            console.log(`✅ Peer connected: ${peerId}`);
            clearTimeout(connectionTimeout);
            setPeers(prev => {
              if (prev.some(p => p.id === peerId)) return prev;
              return [...prev, { id: peerId, peer }];
            });
            peersRef.current[peerId] = peer;
            
            // 初始统计更新
            updatePeerConnectionStats(peerId, peer);
          });

          peer.on('data', (data) => handleFileData(data, peerId));

          peer.on('close', () => {
            clearTimeout(connectionTimeout);
            cleanupPeer(peerId);
          });

          peer.on('error', (err) => {
            console.error(`Peer error (${peerId}):`, err);
            clearTimeout(connectionTimeout);
            cleanupPeer(peerId);
          });
          
          // 监听 ICE 状态更改以更新统计信息
          if (peer._pc) {
              peer._pc.oniceconnectionstatechange = () => {
                  updatePeerConnectionStats(peerId, peer);
              };
          }
          
          return peer;
        }

        switch (message.type) {
          case 'all-peers':
            message.peers.forEach(peerId => {
              if (peerId !== localPeerIdRef.current) {
                  const peer = createPeer(peerId, true);
                  peersRef.current[peerId] = peer;
              }
            });
            break;
          case 'peer-joined':
            if (message.id !== localPeerIdRef.current) {
              const peer = createPeer(message.id, false);
              peersRef.current[message.id] = peer;
            }
            break;
          case 'signal':
            if (message.from !== localPeerIdRef.current && peersRef.current[message.from]) {
              peersRef.current[message.from].signal(message.signal);
            }
            break;
          case 'peer-left':
            if (peersRef.current[message.id]) {
              cleanupPeer(message.id);
            }
            break;
          default: break;
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        if (!isUnmounting) {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      };
      
      wsRef.current.onerror = () => wsRef.current.close();
    };

    connectWebSocket();

    return () => {
      isUnmounting = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      Object.keys(peersRef.current).forEach(cleanupPeer);
    };
  }, [roomId, cleanupPeer, handleFileData, updatePeerConnectionStats]);

  const sendFile = useCallback(async (file, peerId) => {
    const peer = peersRef.current[peerId];
    if (!file || !peer || !peer.connected) return;
    
    const fileId = uuidv4();
    const fileMeta = {
      type: 'file-start',
      name: file.name,
      size: file.size,
      fileType: file.type,
      fileId,
    };

    setTransferState(prev => ({
        ...prev,
        [fileId]: { ...fileMeta, progress: 0, status: 'sending', peerId }
    }));
    
    peer.send(JSON.stringify(fileMeta));

    let offset = 0;
    try {
        while (offset < file.size) {
            const chunkBlob = file.slice(offset, offset + CHUNK_SIZE);
            const buffer = await chunkBlob.arrayBuffer();
            const canContinue = peer.write(new Uint8Array(buffer));
            if (!canContinue) await new Promise(resolve => peer.once('drain', resolve));
            offset += buffer.byteLength;
            setTransferState(prev => ({
                ...prev,
                [fileId]: { ...prev[fileId], progress: (offset / file.size) * 100 }
            }));
        }
        peer.send(JSON.stringify({ type: 'file-end', fileId }));
        
        setTransferState(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress: 100, status: 'completed' }
        }));
        
        scheduleTransferCleanup(fileId);

    } catch (error) {
        console.error("Error sending file:", error);
    }
  }, [scheduleTransferCleanup]);

  const connectedPeers = peers.filter(p => p.peer.connected);
  return { 
      peers: connectedPeers, 
      allPeers: peers, 
      sendFile, 
      transferState, 
      localPeerId: localPeerIdRef.current, 
      peerStats // 直接暴露统计对象
  };
};