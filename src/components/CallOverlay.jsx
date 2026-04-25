import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, PhoneCall } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

const CallOverlay = () => {
  const { callState, localStream, remoteStream, isMuted, isCameraOff, callTimer, acceptCall, rejectCall, endCall, toggleMute, toggleCamera } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!callState) return null;

  const avatar = callState.peerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callState.peerName}`;
  const isVideo = callState.callType === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-2xl">
          {/* Remote video / avatar background */}
          {isVideo && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
              <motion.div
                animate={callState.type !== 'active' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <img src={avatar} alt={callState.peerName} className="w-28 h-28 rounded-full border-4 border-white/20 shadow-2xl" />
              </motion.div>
            </div>
          )}

          {/* Local video pip */}
          {isVideo && localStream && callState.type === 'active' && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-24 h-18 rounded-xl border-2 border-white/20 object-cover"
              style={{ height: '4.5rem' }}
            />
          )}

          {/* Info overlay */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white">{callState.peerName}</h3>
              {callState.type === 'incoming' && (
                <p className="text-indigo-300 text-sm mt-1">
                  {isVideo ? 'Videollamada entrante' : 'Llamada de voz entrante'}
                </p>
              )}
              {callState.type === 'outgoing' && (
                <p className="text-yellow-400 text-sm mt-1 animate-pulse">Llamando...</p>
              )}
              {callState.type === 'active' && (
                <p className="text-green-400 text-sm mt-1 font-mono">{callTimer}</p>
              )}
            </div>

            {/* Buttons */}
            {callState.type === 'incoming' ? (
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={rejectCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg animate-pulse"
                >
                  <PhoneCall className="w-7 h-7 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isMuted ? 'bg-red-500/80' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </button>

                {isVideo && (
                  <button
                    onClick={toggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isCameraOff ? 'bg-red-500/80' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                >
                  <Phone className="w-6 h-6 text-white rotate-[135deg]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallOverlay;
