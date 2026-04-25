import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://fusioncore.space';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Call state
  const [callState, setCallState] = useState(null);
  // callState: { type:'incoming'|'outgoing'|'active', peerId, peerName, peerAvatar, callType:'audio'|'video', startTime? }

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) { socketRef.current?.disconnect(); setSocket(null); return; }
    const token = localStorage.getItem('fc_access_token');
    if (!token) return;

    const s = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = s;
    setSocket(s);

    s.on('call:incoming', ({ callerId, callerName, offer, callType }) => {
      setCallState({ type: 'incoming', peerId: callerId, peerName: callerName, callType, offer });
    });

    s.on('call:answer', async ({ answer }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) { console.error('[call:answer]', e); }
    });

    s.on('call:ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) { console.error('[ice]', e); }
    });

    s.on('call:ended', () => endCallCleanup());
    s.on('call:rejected', () => endCallCleanup());

    return () => { s.disconnect(); socketRef.current = null; setSocket(null); };
  }, [user]);

  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('call:ice-candidate', { targetUserId, candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCallCleanup();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const startCall = useCallback(async (targetUserId, targetName, targetAvatar, callType = 'audio') => {
    if (!socketRef.current) return;
    try {
      const constraints = { audio: true, video: callType === 'video' };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(targetUserId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('call:offer', { targetUserId, offer, callType });
      setCallState({ type: 'outgoing', peerId: targetUserId, peerName: targetName, peerAvatar: targetAvatar, callType });
    } catch (e) {
      console.error('[startCall]', e);
      endCallCleanup();
    }
  }, [createPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!callState?.offer || !socketRef.current) return;
    try {
      const constraints = { audio: true, video: callState.callType === 'video' };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(callState.peerId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('call:answer', { targetUserId: callState.peerId, answer });
      setCallState(prev => ({ ...prev, type: 'active', startTime: Date.now() }));

      timerRef.current = setInterval(() => {
        setCallTimer(t => t + 1);
      }, 1000);
    } catch (e) {
      console.error('[acceptCall]', e);
      endCallCleanup();
    }
  }, [callState, createPeerConnection]);

  const rejectCall = useCallback(() => {
    if (callState?.peerId && socketRef.current) {
      socketRef.current.emit('call:reject', { targetUserId: callState.peerId });
    }
    endCallCleanup();
  }, [callState]);

  const endCall = useCallback(() => {
    if (callState?.peerId && socketRef.current) {
      socketRef.current.emit('call:end', { targetUserId: callState.peerId });
    }
    endCallCleanup();
  }, [callState]);

  const endCallCleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    remoteStreamRef.current = null;
    setRemoteStream(null);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setCallState(null);
    setCallTimer(0);
    setIsMuted(false);
    setIsCameraOff(false);
    clearInterval(timerRef.current);
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(m => !m);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isCameraOff; });
      setIsCameraOff(c => !c);
    }
  }, [isCameraOff]);

  // When outgoing call is answered, mark as active and start timer
  useEffect(() => {
    if (!socket) return;
    const handler = async ({ answer }) => {
      if (callState?.type === 'outgoing') {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
          setCallState(prev => prev ? { ...prev, type: 'active', startTime: Date.now() } : prev);
          timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
        } catch (e) { console.error('[answer]', e); }
      }
    };
    socket.on('call:answer', handler);
    return () => socket.off('call:answer', handler);
  }, [socket, callState?.type]);

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <SocketContext.Provider value={{
      socket,
      callState,
      localStream,
      remoteStream,
      isMuted,
      isCameraOff,
      callTimer: formatTimer(callTimer),
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleCamera,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
