export const testStunServer = async (url) => {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const timeout = 5000; // 5秒超时
    let pc = null;
    let timer = null;

    const cleanup = () => {
      if (pc) {
        pc.onicecandidate = null;
        pc.close();
        pc = null;
      }
      if (timer) clearTimeout(timer);
    };

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: url }],
        iceCandidatePoolSize: 0
      });

      // 创建数据通道以触发候选者收集
      pc.createDataChannel('ping');

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          // 'srflx' 意味着服务器反射 (Server Reflexive)，即通过 STUN 获取
          if (e.candidate.type === 'srflx') {
            const latency = Math.round(performance.now() - start);
            cleanup();
            resolve(latency);
          }
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          cleanup();
          reject(err);
        });

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout'));
      }, timeout);

    } catch (err) {
      cleanup();
      reject(err);
    }
  });
};
