import React, { useState, useEffect } from 'react';
import { Wand2, User, Loader2, Sparkles, Save, RefreshCcw, Zap } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { AiIdentity } from '../types';

interface AvatarStudioProps {
  currentIdentity: AiIdentity;
  onUpdateIdentity: (identity: AiIdentity) => void;
}

export const AvatarStudio: React.FC<AvatarStudioProps> = ({ currentIdentity, onUpdateIdentity }) => {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState(currentIdentity.name);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Real-time generation debounce logic
  useEffect(() => {
    if (!isLiveMode || !prompt || prompt.length < 3) return;

    const timeoutId = setTimeout(() => {
      handleGenerate();
    }, 1200); // 1.2s delay to wait for typing to pause

    return () => clearTimeout(timeoutId);
  }, [prompt, isLiveMode]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      // Enhance prompt for avatar style
      const enhancedPrompt = `A high quality, cinematic, sci-fi avatar portrait of: ${prompt}. Trending on ArtStation, futuristic, detailed, 8k resolution, centered composition.`;
      const result = await geminiService.generateImage(enhancedPrompt);
      if (result) {
        setGeneratedImage(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onUpdateIdentity({
      ...currentIdentity,
      name: name || currentIdentity.name,
      avatarUrl: generatedImage || currentIdentity.avatarUrl
    });
  };

  return (
    <div className="flex flex-col h-full bg-navy-950 p-6 md:p-12 overflow-y-auto custom-scrollbar">
      
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-2">
           <h2 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
             <Sparkles className="w-8 h-8 text-neon-purple" />
             Neural Identity Studio
           </h2>
           <p className="text-gray-400 font-mono text-sm">Design the visual manifestation of your SELF-OS companion.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           
           {/* Left: Controls */}
           <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neon-blue">Designation</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AURA, NEXUS, ALICE"
                  className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all font-mono tracking-wider"
                />
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono uppercase tracking-widest text-neon-purple">Visual Parameters</label>
                  
                  {/* Live Mode Toggle */}
                  <button 
                    onClick={() => setIsLiveMode(!isLiveMode)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border ${
                      isLiveMode 
                        ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-[0_0_10px_rgba(217,70,239,0.3)]' 
                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    <Zap className={`w-3 h-3 ${isLiveMode ? 'fill-current animate-pulse' : ''}`} />
                    {isLiveMode ? 'Live Gen Active' : 'Live Gen Off'}
                  </button>
                </div>
                
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your ideal AI companion... e.g. A cyberpunk owl with neon eyes, or a holographic serene face made of stardust."
                  className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all min-h-[120px] resize-none leading-relaxed"
                />
              </div>

              <button 
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium tracking-wide shadow-lg hover:shadow-neon-blue/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Constructing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Materialize Form</span>
                  </>
                )}
              </button>
           </div>

           {/* Right: Preview */}
           <div className="flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
              
              <div className="relative w-80 h-80 rounded-full border-2 border-white/5 bg-navy-900 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
                 {/* Scanning Effect */}
                 {(isGenerating || isLiveMode) && (
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-blue/10 to-transparent translate-y-[-100%] animate-scan pointer-events-none"></div>
                 )}
                 
                 {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                      <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
                    </div>
                 )}

                 {generatedImage ? (
                   <img src={generatedImage} alt="Generated Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 ) : currentIdentity.avatarUrl ? (
                   <img src={currentIdentity.avatarUrl} alt="Current Avatar" className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500" />
                 ) : (
                   <User className="w-32 h-32 text-white/10" />
                 )}

                 {/* Corner Accents */}
                 <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue/50 rounded-tl-lg m-4"></div>
                 <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-blue/50 rounded-br-lg m-4"></div>
              </div>

              {generatedImage && (
                <div className="flex gap-4 w-full max-w-xs">
                   <button 
                     onClick={() => setGeneratedImage(null)}
                     className="flex-1 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                     <RefreshCcw className="w-4 h-4" />
                     Discard
                   </button>
                   <button 
                     onClick={handleSave}
                     className="flex-1 py-3 rounded-lg bg-green-500/10 border border-green-500/50 hover:bg-green-500/20 text-green-400 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                     <Save className="w-4 h-4" />
                     Initialize
                   </button>
                </div>
              )}

              <div className="text-center space-y-1">
                 <div className="text-2xl font-light text-white">{name}</div>
                 <div className="text-[10px] font-mono text-neon-blue uppercase tracking-[0.3em]">System Identity</div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};
