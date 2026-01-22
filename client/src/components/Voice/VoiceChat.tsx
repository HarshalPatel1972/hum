'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket';

interface VoiceChatProps {
  roomId: string;
  userCount: number;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export default function VoiceChat({ roomId }: VoiceChatProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  // WebRTC Signaling
  useEffect(() => {
    if (!isEnabled) return;

    const socket = getSocket();

    // Handle receiving an offer from another peer
    socket.on('voice:offer', async ({ offer, senderId }: { offer: RTCSessionDescriptionInit; senderId: string }) => {
      console.log('[Voice] Received offer from', senderId);
      
      if (peersRef.current.has(senderId)) {
        console.log('[Voice] Already connected to', senderId);
        return;
      }

      const pc = createPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('voice:answer', { roomId, answer, targetId: senderId });
    });

    // Handle receiving an answer
    socket.on('voice:answer', async ({ answer, senderId }: { answer: RTCSessionDescriptionInit; senderId: string }) => {
      console.log('[Voice] Received answer from', senderId);
      const pc = peersRef.current.get(senderId);
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Handle ICE candidates
    socket.on('voice:ice-candidate', async ({ candidate, senderId }: { candidate: RTCIceCandidateInit; senderId: string }) => {
      const pc = peersRef.current.get(senderId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[Voice] Error adding ICE candidate:', e);
        }
      }
    });

    // Handle when another user enables voice
    socket.on('voice:user-enabled', ({ userId }: { userId: string }) => {
      console.log('[Voice] User enabled voice:', userId);
      // Create offer to the new user
      if (!peersRef.current.has(userId)) {
        createOfferForPeer(userId);
      }
    });

    // Handle when a user disables voice
    socket.on('voice:user-disabled', ({ userId }: { userId: string }) => {
      console.log('[Voice] User disabled voice:', userId);
      closePeerConnection(userId);
    });

    return () => {
      socket.off('voice:offer');
      socket.off('voice:answer');
      socket.off('voice:ice-candidate');
      socket.off('voice:user-enabled');
      socket.off('voice:user-disabled');
    };
  }, [isEnabled, roomId]);

  const createPeerConnection = (peerId: string): RTCPeerConnection => {
    console.log('[Voice] Creating peer connection for', peerId);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(peerId, pc);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('[Voice] Received track from', peerId);
      
      let audio = audioElementsRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioElementsRef.current.set(peerId, audio);
      }
      
      audio.srcObject = event.streams[0];
      audio.play().catch(e => console.error('[Voice] Audio play error:', e));
      
      setConnectedPeers(prev => new Set(prev).add(peerId));
      
      // Voice activity detection
      detectSpeaking(event.streams[0], peerId);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket().emit('voice:ice-candidate', {
          roomId,
          candidate: event.candidate.toJSON(),
          targetId: peerId
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[Voice] Connection state with', peerId, ':', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        closePeerConnection(peerId);
      }
    };

    return pc;
  };

  const createOfferForPeer = async (peerId: string) => {
    console.log('[Voice] Creating offer for', peerId);
    
    if (peersRef.current.has(peerId)) {
      console.log('[Voice] Already has connection with', peerId);
      return;
    }

    const pc = createPeerConnection(peerId);
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
    
    const audio = audioElementsRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audioElementsRef.current.delete(peerId);
    }
    
    setConnectedPeers(prev => {
      const newSet = new Set(prev);
      newSet.delete(peerId);
      return newSet;
    });
    
    setActiveSpeakers(prev => {
      const newSet = new Set(prev);
      newSet.delete(peerId);
      return newSet;
    });
  };

  const detectSpeaking = (stream: MediaStream, peerId: string) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      setActiveSpeakers(prev => {
        const newSet = new Set(prev);
        if (average > 25) {
          newSet.add(peerId);
        } else {
          newSet.delete(peerId);
        }
        return newSet;
      });
      
      if (peersRef.current.has(peerId)) {
        requestAnimationFrame(checkVolume);
      }
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
      
      // Notify room that I've enabled voice
      getSocket().emit('voice:enabled', { roomId });
      
      console.log('[Voice] Started - waiting for peers');
    } catch (error) {
      console.error('[Voice] Failed to start:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceChat = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close all peer connections
    peersRef.current.forEach((pc, peerId) => {
      pc.close();
    });
    peersRef.current.clear();
    
    // Stop all audio elements
    audioElementsRef.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElementsRef.current.clear();
    
    setIsEnabled(false);
    setConnectedPeers(new Set());
    setActiveSpeakers(new Set());
    
    // Notify room
    getSocket().emit('voice:disabled', { roomId });
    
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
        className={`relative w-11 h-11 rounded-full flex items-center justify-center
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
            className={`w-9 h-9 rounded-full flex items-center justify-center
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
        {isEnabled && (connectedPeers.size > 0 || activeSpeakers.size > 0) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                       bg-green-500/10 border border-green-500/30"
          >
            {activeSpeakers.size > 0 && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-green-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            <span className="text-[10px] text-green-400 font-medium">
              {connectedPeers.size} connected
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
