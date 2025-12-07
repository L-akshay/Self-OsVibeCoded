import React, { useEffect, useRef, useState } from 'react';
import { Mic, PhoneOff, Activity, Signal, Zap, Radio, Globe } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { AiIdentity } from '../types';

interface LiveAvatarProps {
  onClose: () => void;
  identity: AiIdentity;
}

export const LiveAvatar: React.FC<LiveAvatarProps> = ({ onClose, identity }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Initializing Uplink...");
  const [transcription, setTranscription] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    let audioContext: AudioContext;
    let processor: ScriptProcessorNode;
    let stream: MediaStream;
    let source: MediaStreamAudioSourceNode;
    let analyser: AnalyserNode;

    const startSession = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaStreamSource(stream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(analyser);
        const updateVisualizer = () => {
           const dataArray = new Uint8Array(analyser.frequencyBinCount);
           analyser.getByteFrequencyData(dataArray);
           const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
           setAudioLevel(avg);
           requestAnimationFrame(updateVisualizer);
        }
        updateVisualizer();

        const sender = await geminiService.connectLive(
          (audioBuffer) => {
             setAudioLevel(150); // Artificial boost for output visualization
             setTimeout(() => setAudioLevel(50), 200);
          },
          (text, isUser) => {
             setTranscription(text);
          },
          () => setIsActive(false)
        );

        setIsActive(true);
        setStatus("LIVE CONNECTION ESTABLISHED");

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          let binary = '';
          const bytes = new Uint8Array(int16.buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
             binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = btoa(binary);

          if (sender) {
            sender({ 
              data: base64Data,
              mimeType: 'audio/pcm;rate=16000'
            });
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

      } catch (err) {
        console.error("Live session failed", err);
        setStatus("CONNECTION FAILED");
      }
    };

    startSession();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (processor) processor.disconnect();
      if (source) source.disconnect();
      if (audioContext) audioContext.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative bg-navy-950 overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-radial from-neon-blue/10 to-transparent opacity-20 animate-pulse-slow"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* Top Status HUD */}
      <div className="absolute top-10 left-0 right-0 flex justify-between px-12 z-20">
         <div className="flex flex-col">
            <div className="text-[10px] font-mono text-neon-blue tracking-[0.3em] uppercase mb-1">Status</div>
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></div>
               <span className="text-sm font-mono text-white font-medium tracking-wider">{status}</span>
            </div>
         </div>
         <div className="flex items-center gap-4 text-gray-500">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-mono uppercase tracking-widest">Network</span>
               <span className="text-xs font-mono text-neon-cyan">5G UPLINK</span>
            </div>
            <Signal className="w-5 h-5 text-neon-cyan" />
         </div>
      </div>

      {/* Main Avatar Entity */}
      <div className="relative w-96 h-96 flex items-center justify-center mb-16 z-10">
        
        {/* Outer Orbital Rings */}
        <div className={`absolute inset-0 rounded-full border border-neon-blue/10 ${isActive ? 'animate-spin-slow' : ''}`}></div>
        <div className={`absolute inset-0 rounded-full border-t border-b border-neon-blue/30 ${isActive ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '10s' }}></div>
        <div className={`absolute inset-8 rounded-full border border-dashed border-neon-purple/20 ${isActive ? 'animate-spin-slow' : ''}`} style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
        
        {/* Frequency Bars Ring */}
        <div className="absolute inset-[-20px] flex items-center justify-center">
            {[...Array(24)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-1 bg-neon-cyan/20 origin-bottom transition-all duration-100"
                  style={{
                    height: `${20 + Math.random() * (audioLevel / 2)}px`,
                    transform: `rotate(${i * 15}deg) translateY(-180px)`,
                    opacity: isActive ? 0.5 : 0.1
                  }}
                ></div>
            ))}
        </div>

        {/* The Core */}
        <div className="relative w-48 h-48 rounded-full bg-black flex items-center justify-center overflow-hidden shadow-[0_0_100px_rgba(76,110,245,0.2)] z-10 border border-white/10">
             
             {/* Fluid Gradient Animation */}
             <div 
               className="absolute inset-[-50%] bg-gradient-to-tr from-neon-blue via-neon-purple to-neon-pink opacity-80 blur-xl transition-all duration-75"
               style={{ 
                 transform: `rotate(${audioLevel}deg) scale(${1 + audioLevel / 300})`, 
               }}
             ></div>
             
             {/* Inner UI Overlay / Avatar Image */}
             <div className="absolute inset-1 rounded-full bg-navy-950/90 backdrop-blur-sm flex items-center justify-center z-20 overflow-hidden">
                 {identity.avatarUrl ? (
                   <img src={identity.avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-80" />
                 ) : (
                    <div className="text-center">
                        {isActive ? (
                        <div className="flex flex-col items-center gap-2">
                            <Activity className="w-8 h-8 text-white animate-pulse" />
                            <div className="flex gap-1">
                                <span className="w-1 h-3 bg-neon-blue animate-pulse" style={{ animationDelay: '0s' }}></span>
                                <span className="w-1 h-5 bg-neon-purple animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-1 h-3 bg-neon-cyan animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </div>
                        ) : (
                        <Globe className="w-8 h-8 text-gray-600" />
                        )}
                    </div>
                 )}
             </div>
             
             {/* Glitch Overlay */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,20,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-30 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50"></div>
        </div>
        
        {/* Name Label */}
        <div className="absolute -bottom-16 text-center">
           <div className="text-xl font-light text-white tracking-widest uppercase">{identity.name}</div>
           <div className="text-[10px] text-neon-blue font-mono">LIVE CONNECTION</div>
        </div>
      </div>

      {/* Transcription Area */}
      <div className="h-32 w-full max-w-2xl px-8 flex flex-col items-center justify-center mb-8 relative z-10">
        {transcription ? (
          <div className="text-center animate-in slide-in-from-bottom-4 fade-in duration-300">
             <div className="text-xs font-mono text-neon-blue mb-2 uppercase tracking-widest opacity-70">Processing Input</div>
             <p className="text-2xl md:text-3xl font-light leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">"{transcription}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-30">
             <div className="flex gap-1.5">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
             </div>
             <span className="text-sm font-mono tracking-widest uppercase">Listening</span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex gap-10 items-center z-20">
        <button className="flex flex-col items-center gap-2 group">
           <div className="relative p-6 rounded-full bg-navy-800 border border-white/10 hover:bg-navy-700 hover:border-neon-blue/50 transition-all shadow-lg group-active:scale-95">
             <div className="absolute inset-0 bg-neon-blue/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Mic className="w-6 h-6 text-white relative z-10" />
           </div>
           <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider group-hover:text-neon-blue transition-colors">Mute</span>
        </button>
        
        <button 
           onClick={onClose}
           className="flex flex-col items-center gap-2 group">
           <div className="relative p-8 rounded-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500 transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)] group-active:scale-95">
             <PhoneOff className="w-8 h-8 text-red-500 relative z-10" />
           </div>
           <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider group-hover:text-red-400 transition-colors">End Session</span>
        </button>

        <button className="flex flex-col items-center gap-2 group">
           <div className="relative p-6 rounded-full bg-navy-800 border border-white/10 hover:bg-navy-700 hover:border-neon-purple/50 transition-all shadow-lg group-active:scale-95">
             <Radio className="w-6 h-6 text-white relative z-10" />
           </div>
           <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider group-hover:text-neon-purple transition-colors">Settings</span>
        </button>
      </div>

      {/* Decorative Bottom Details */}
      <div className="absolute bottom-6 w-full flex justify-between px-12 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
         <div>Gemini Native Audio 2.5</div>
         <div>Latency: 42ms</div>
      </div>
    </div>
  );
};