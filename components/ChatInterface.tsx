import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Sparkles, BrainCircuit, Search, X, Bot, User, ArrowUp, Cpu } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { Message, AiIdentity } from '../types';

interface ChatInterfaceProps {
  identity: AiIdentity;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ identity }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: `Hello Explorer. I am ${identity.name}. I'm ready to think, plan, and create with you.`, timestamp: Date.now() }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File, preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isThinking]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageUrl: selectedImage?.preview,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imagePayload = selectedImage ? { data: selectedImage.preview.split(',')[1], mimeType: selectedImage.file.type } : undefined;
    setSelectedImage(null);
    setIsThinking(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      if (imagePayload && (input.toLowerCase().includes('add') || input.toLowerCase().includes('remove') || input.toLowerCase().includes('filter'))) {
         const editedImage = await geminiService.editImage(imagePayload.data, input);
         setMessages(prev => [...prev, {
             id: Date.now().toString(),
             role: 'model',
             content: editedImage ? "Here is the edited version." : "I couldn't edit the image.",
             imageUrl: editedImage || undefined,
             timestamp: Date.now()
         }]);
      } else {
        const response = await geminiService.chatWithThinking(userMsg.content, imagePayload);
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: response.text,
          thinking: response.thinking,
          groundingUrls: response.grounding,
          timestamp: Date.now()
        }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I encountered a neural pathway error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative w-full mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 pt-6 pb-32 custom-scrollbar scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-4 fade-in duration-500`}>
            
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(76,110,245,0.2)] overflow-hidden">
                {identity.avatarUrl ? (
                   <img src={identity.avatarUrl} alt="AI" className="w-full h-full object-cover" />
                ) : (
                  <>
                   <div className="absolute w-10 h-10 bg-neon-blue/20 rounded-full blur-lg animate-pulse"></div>
                   <Bot className="w-5 h-5 text-neon-blue relative z-10" />
                  </>
                )}
              </div>
            )}

            <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-md border ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-neon-blue/90 to-indigo-600/90 text-white rounded-tr-none border-white/10' 
                  : 'bg-navy-800/80 text-gray-100 rounded-tl-none border-white/5'
              }`}>
                
                {/* Image Attachment */}
                {msg.imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-white/20 bg-black/20 relative group/img">
                    <img src={msg.imageUrl} alt="attachment" className="w-full h-auto max-h-80 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors"></div>
                  </div>
                )}
                
                {/* Thinking Trace (Collapsible style) */}
                {msg.thinking && (
                  <div className="mb-4 text-xs bg-black/20 rounded-lg border border-neon-purple/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black/20 border-b border-neon-purple/10 text-neon-purple/80 font-mono">
                      <BrainCircuit className="w-3 h-3" />
                      <span className="uppercase tracking-wider text-[10px]">Reasoning Trace</span>
                    </div>
                    <div className="p-3 text-gray-400 font-mono text-[10px] leading-relaxed max-h-32 overflow-y-auto custom-scrollbar opacity-80">
                      {msg.thinking}
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base font-light tracking-wide">
                  {msg.content}
                </div>

                {/* Grounding Sources */}
                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                     <div className="flex items-center gap-1.5 text-[10px] text-neon-cyan mb-2 font-mono uppercase tracking-wider opacity-70">
                       <Search className="w-3 h-3" />
                       <span>References</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {msg.groundingUrls.map((url, idx) => (
                         <a key={idx} href={url} target="_blank" rel="noreferrer" 
                            className="text-[10px] bg-white/5 hover:bg-neon-cyan/10 hover:text-neon-cyan border border-white/5 hover:border-neon-cyan/30 px-2 py-1.5 rounded-md truncate max-w-[200px] text-gray-400 transition-all flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-neon-cyan/50"></span>
                            {new URL(url).hostname}
                         </a>
                       ))}
                     </div>
                  </div>
                )}
              </div>
              
              <span className="text-[10px] text-gray-500 font-mono px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-6 items-start animate-pulse">
             <div className="w-10 h-10 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(76,110,245,0.2)]">
                {identity.avatarUrl ? (
                   <img src={identity.avatarUrl} alt="AI" className="w-full h-full object-cover rounded-full opacity-70" />
                ) : (
                  <Bot className="w-5 h-5 text-neon-blue" />
                )}
              </div>
             <div className="bg-navy-800/50 border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 shadow-lg backdrop-blur-sm">
               <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
               <div className="flex flex-col gap-1">
                 <span className="text-sm text-gray-300 font-medium">Processing...</span>
                 <span className="text-xs text-neon-purple font-mono">Invoking Gemini 3 Pro Reasoning</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-8 flex justify-center z-20">
        <div className="w-full max-w-4xl relative group">
          
          {/* Active Image Attachment Indicator */}
          {selectedImage && (
             <div className="absolute -top-14 left-0 flex items-center gap-3 p-3 px-4 bg-navy-800/90 border border-white/10 rounded-xl backdrop-blur-md animate-in slide-in-from-bottom-2 shadow-xl">
               <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center">
                 <ImageIcon className="w-4 h-4 text-neon-purple" />
               </div>
               <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-200 max-w-[150px] truncate">{selectedImage.file.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Image Attached</span>
               </div>
               <button onClick={() => setSelectedImage(null)} className="ml-2 hover:bg-white/10 p-1 rounded-full transition-colors">
                 <X className="w-4 h-4 text-gray-400" />
               </button>
             </div>
          )}

          <div className="bg-navy-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] flex items-end p-2 gap-2 focus-within:border-neon-blue/50 focus-within:shadow-[0_0_30px_rgba(76,110,245,0.15)] transition-all duration-300 ring-1 ring-white/5">
            
            <label className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-all shrink-0 group/icon">
              <ImageIcon className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>

            <textarea 
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${identity.name}...`}
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 resize-none py-3 max-h-32 text-sm sm:text-base custom-scrollbar leading-relaxed"
              rows={1}
            />

            <button 
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isThinking}
              className="p-3 rounded-xl bg-neon-blue text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:bg-blue-600 hover:scale-105 transition-all shrink-0">
              {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};