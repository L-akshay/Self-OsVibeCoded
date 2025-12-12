import React, { useState, useEffect, useRef } from 'react';
import { Wand2, User, Loader2, Sparkles, Save, RefreshCcw, Zap, Edit3, Brush, Eraser, Palette, Check, X, Undo, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { AiIdentity } from '../types';

interface AvatarStudioProps {
  currentIdentity: AiIdentity;
  onUpdateIdentity: (identity: AiIdentity) => void;
}

const STYLE_PRESETS = [
  "Cyberpunk", "Fantasy", "Photorealistic", "Anime", 
  "3D Render", "Oil Painting", "Pixel Art", "Vaporwave", 
  "Noir", "Studio Ghibli", "Retro 80s", "Watercolor"
];

export const AvatarStudio: React.FC<AvatarStudioProps> = ({ currentIdentity, onUpdateIdentity }) => {
  const [prompt, setPrompt] = useState('');
  const [styleModifiers, setStyleModifiers] = useState('');
  const [name, setName] = useState(currentIdentity.name);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // Base Image State
  const [baseImage, setBaseImage] = useState<{ file: File, preview: string } | null>(null);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushColor, setBrushColor] = useState('#4C6EF5');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]); // Undo stack

  // Real-time generation debounce logic
  useEffect(() => {
    if (!isLiveMode || !prompt || prompt.length < 3 || isEditing) return;

    const timeoutId = setTimeout(() => {
      handleGenerate();
    }, 1200); 

    return () => clearTimeout(timeoutId);
  }, [prompt, styleModifiers, isLiveMode, isEditing, baseImage]);

  // Init Canvas when entering edit mode
  useEffect(() => {
    if (isEditing && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match display size for retina sharpness or fixed logic
      // For simplicity, we use a fixed internal resolution of 512x512 but display it responsively
      canvas.width = 512;
      canvas.height = 512;

      const img = new Image();
      // Use generated image or fallback to current identity
      img.src = generatedImage || currentIdentity.avatarUrl || '';
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 512, 512);
        // Save initial state to history
        historyRef.current = [canvas.toDataURL()];
      };
    }
  }, [isEditing, generatedImage, currentIdentity]);

  const handleBaseImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      // Incorporate style modifiers
      const styleContext = styleModifiers ? `Style: ${styleModifiers}.` : '';
      const enhancedPrompt = `A high quality, cinematic avatar portrait of: ${prompt}. ${styleContext} Trending on ArtStation, detailed, 8k resolution, centered composition.`;
      
      let result;
      if (baseImage) {
        // Use Image Editing/Variation if base image exists
        const base64Data = baseImage.preview.split(',')[1];
        result = await geminiService.editImage(base64Data, enhancedPrompt, baseImage.file.type);
      } else {
        // Pure Text-to-Image
        result = await geminiService.generateImage(enhancedPrompt);
      }

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

  const addStyle = (style: string) => {
    setStyleModifiers(prev => {
        const cleanPrev = prev.trim();
        if (cleanPrev.toLowerCase().includes(style.toLowerCase())) return cleanPrev;
        if (cleanPrev.length === 0) return style;
        return `${cleanPrev}, ${style}`;
    });
  };

  // --- Drawing Logic ---

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (historyRef.current.length > 0 && historyRef.current[historyRef.current.length - 1] !== canvasRef.current?.toDataURL()) {
          if (canvasRef.current) historyRef.current.push(canvasRef.current.toDataURL());
          if (historyRef.current.length > 10) historyRef.current.shift();
      } else if (canvasRef.current && historyRef.current.length === 0) {
          historyRef.current.push(canvasRef.current.toDataURL());
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if(ctx) ctx.closePath();
  };

  const handleUndo = () => {
    if (historyRef.current.length > 0 && canvasRef.current) {
        const lastState = historyRef.current.pop();
        if (lastState) {
            const img = new Image();
            img.src = lastState;
            img.onload = () => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.clearRect(0, 0, 512, 512);
                    ctx.drawImage(img, 0, 0);
                }
            };
        }
    }
  };

  const saveEdits = () => {
    if (canvasRef.current) {
      setGeneratedImage(canvasRef.current.toDataURL());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-950 p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full space-y-2 mb-8">
           <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white flex items-center gap-3">
             <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-neon-purple" />
             Neural Identity Studio
           </h2>
           <p className="text-gray-400 font-mono text-xs md:text-sm">
             {isEditing ? 'Manual Adjustment Mode' : 'Design the visual manifestation of your SELF-OS companion.'}
           </p>
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 relative">
        
        {isEditing ? (
           // --- EDITOR INTERFACE ---
           <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col items-center gap-6">
              
              {/* Canvas Area Container */}
              <div ref={containerRef} className="relative w-full max-w-[512px] aspect-square rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-gray-900">
                  <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%,#808080),linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%,#808080)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]"></div>
                  
                  <canvas 
                    ref={canvasRef}
                    className="relative z-10 touch-none cursor-crosshair w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    // Width/height set in JS for resolution, CSS handles display size
                  />
              </div>

              {/* Tools - Responsive Layout */}
              <div className="w-full max-w-[512px] flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-navy-900 border border-white/10 backdrop-blur-xl">
                 
                 {/* Tool Selection */}
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setTool('brush')}
                      className={`p-3 rounded-xl transition-all ${tool === 'brush' ? 'bg-neon-blue text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                      <Brush className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setTool('eraser')}
                      className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-neon-pink text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                      <Eraser className="w-5 h-5" />
                    </button>
                 </div>

                 {/* Brush Settings */}
                 <div className="flex flex-1 items-center justify-center gap-4 min-w-[150px]">
                    <div className="flex flex-col gap-1 w-full max-w-[100px]">
                       <label className="text-[8px] font-mono text-gray-500 uppercase">Size</label>
                       <input 
                         type="range" 
                         min="1" max="50" 
                         value={brushSize} 
                         onChange={(e) => setBrushSize(parseInt(e.target.value))}
                         className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue" 
                       />
                    </div>
                    
                    {tool === 'brush' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-mono text-gray-500 uppercase">Color</label>
                        <div className="relative w-8 h-8 overflow-hidden rounded-full border border-white/20">
                           <input 
                             type="color" 
                             value={brushColor}
                             onChange={(e) => setBrushColor(e.target.value)}
                             className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 p-0 border-none cursor-pointer" 
                           />
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Actions */}
                 <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button 
                      onClick={handleUndo}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                      title="Undo">
                      <Undo className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors flex items-center gap-2">
                      <X className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase hidden md:inline">Cancel</span>
                    </button>
                    <button 
                      onClick={saveEdits}
                      className="p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                      <Check className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase hidden md:inline">Save</span>
                    </button>
                 </div>
              </div>
           </div>
        ) : (
           // --- STANDARD GENERATOR INTERFACE ---
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pb-20">
             
             {/* Left: Controls */}
             <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 order-2 md:order-1">
                
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
                
                {/* Base Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-neon-pink">Base Reference (Optional)</label>
                  <div className={`relative w-full border border-dashed rounded-xl p-4 transition-all group ${baseImage ? 'border-neon-pink/50 bg-neon-pink/5' : 'border-white/10 bg-navy-900 hover:border-white/20'}`}>
                    
                    {baseImage ? (
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                              <img src={baseImage.preview} alt="Base" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs text-white font-medium truncate max-w-[150px]">{baseImage.file.name}</span>
                              <span className="text-[10px] text-neon-pink">Image Loaded</span>
                           </div>
                         </div>
                         <button onClick={() => setBaseImage(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                        <Upload className="w-5 h-5 text-gray-500 group-hover:text-neon-pink transition-colors" />
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">Upload Base Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleBaseImageSelect} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono uppercase tracking-widest text-neon-purple">Description</label>
                    
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
                      {isLiveMode ? 'Live Gen' : 'Live Off'}
                    </button>
                  </div>
                  
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your ideal AI companion... e.g. A cyberpunk owl with neon eyes..."
                    className="w-full bg-navy-900 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all min-h-[100px] resize-none leading-relaxed"
                  />
                </div>

                {/* Style Input */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-neon-cyan">Style Modifiers</label>
                  <input
                     type="text"
                     value={styleModifiers}
                     onChange={(e) => setStyleModifiers(e.target.value)}
                     placeholder="e.g. Cyberpunk, Watercolor, Noir..."
                     className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all font-mono text-sm"
                  />
                  
                  {/* Style Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STYLE_PRESETS.map(style => {
                        const isActive = styleModifiers.toLowerCase().includes(style.toLowerCase());
                        return (
                            <button
                                key={style}
                                onClick={() => addStyle(style)}
                                className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wide transition-all ${
                                    isActive 
                                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,208,179,0.2)]'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {isActive ? '✓ ' : '+ '}{style}
                            </button>
                        );
                    })}
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium tracking-wide shadow-lg hover:shadow-neon-blue/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{baseImage ? 'Modifying...' : 'Constructing...'}</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>{baseImage ? 'Transform Reference' : 'Materialize Form'}</span>
                    </>
                  )}
                </button>
             </div>

             {/* Right: Preview */}
             <div className="flex flex-col items-center justify-start space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 order-1 md:order-2">
                
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-white/5 bg-navy-900 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
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
                   
                   {/* Edit Button Overlay */}
                   {(generatedImage || currentIdentity.avatarUrl) && !isGenerating && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                           onClick={() => setIsEditing(true)}
                           className="px-6 py-3 rounded-xl bg-white/10 hover:bg-neon-blue hover:text-white backdrop-blur border border-white/20 transition-all transform scale-90 group-hover:scale-100 flex items-center gap-2 font-mono uppercase tracking-wider text-xs">
                           <Edit3 className="w-4 h-4" />
                           Modify
                         </button>
                      </div>
                   )}
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
        )}
      </div>
    </div>
  );
};