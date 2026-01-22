'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket';

interface VoiceChatProps {
  roomId: string;
  userCount: number;
}

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
}

export default function VoiceChat({ roomId, userCount }: VoiceChatProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!isEnabled) return;

    const socket = getSocket();

    socket.on('voice:offer', async ({ offer, senderId }: { offer: RTCSessionDescriptionInit; senderId: string }) => {
      console.log('[Voice] Received offer from', senderId);
      const pc = await createPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice:answer', { roomId, answer, targetId: senderId });
    });

    socket.on('voice:answer', async ({ answer, senderId }: { answer: RTCSessionDescriptionInit; senderId: string }) => {
      console.log('[Voice] Received answer from', senderId);
      const pc = peersRef.current.get(senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('voice:ice-candidate', async ({ candidate, senderId }: { candidate: RTCIceCandidateInit; senderId: string }) => {
      const pc = peersRef.current.get(senderId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('voice:user-toggle', ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      if (enabled && !peersRef.current.has(userId)) {
        createOffer(userId);
      } else if (!enabled) {
        closePeerConnection(userId);
      }
    });

    return () => {
      socket.off('voice:offer');
      socket.off('voice:answer');
      socket.off('voice:ice-candidate');
      socket.off('voice:user-toggle');
    };
  }, [isEnabled, roomId]);

  const createPeerConnection = async (peerId: string): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(peerId, pc);

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming audio
    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play().catch(e => console.error('[Voice] Audio play error:', e));
      
      // Voice activity detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(event.streams[0]);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      detectSpeaking(analyser, peerId);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket().emit('voice:ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetId: peerId
        });
      }
    };

    return pc;
  };

  const createOffer = async (peerId: string) => {
    console.log('[Voice] Creating offer for', peerId);
    const pc = await createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    getSocket().emit('voice:offer', { roomId, offer, targetId: peerId });
  };

  const closePeerConnection = (peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
  };

  const detectSpeaking = (analyser: AnalyserNode, peerId: string) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      setActiveSpeakers(prev => {
        const newSet = new Set(prev);
        if (average > 20) {
          newSet.add(peerId);
        } else {
          newSet.delete(peerId);
        }
        return newSet;
      });
      
      requestAnimationFrame(checkVolume);
    };
    checkVolume();
  };

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      localStreamRef.current = stream;
      setIsEnabled(true);
      getSocket().emit('voice:toggle', { roomId, enabled: true });
      console.log('[Voice] Started');
    } catch (error) {
      console.error('[Voice] Failed to start:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceChat = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    setIsEnabled(false);
    setActiveSpeakers(new Set());
    getSocket().emit('voice:toggle', { roomId, enabled: false });
    console.log('[Voice] Stopped');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVoice = () => {
    if (isEnabled) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Voice Toggle Button */}
      <motion.button
        onClick={toggleVoice}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center
                   backdrop-blur-md border transition-all ${
          isEnabled
            ? 'bg-green-500/20 border-green-500/50 text-green-400'
            : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isEnabled ? 'Leave voice chat' : 'Join voice chat'}
      >
        {/* Pulse animation when enabled */}
        {isEnabled && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-400"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </motion.button>

      {/* Mute Button (when enabled) */}
      <AnimatePresence>
        {isEnabled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleMute}
            className={`w-10 h-10 rounded-full flex items-center justify-center
                       backdrop-blur-md border transition-all ${
              isMuted
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Active speakers indicator */}
      <AnimatePresence>
        {isEnabled && activeSpeakers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full
                       bg-green-500/10 border border-green-500/30"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-green-400 font-medium">
              {activeSpeakers.size} speaking
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
