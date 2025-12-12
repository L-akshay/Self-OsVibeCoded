import React, { useState } from 'react';
import { Brain, ArrowRight, Lock, Mail, User, ShieldCheck, Loader2, Sparkles, Fingerprint, Ghost } from 'lucide-react';
import { db } from '../services/db';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      let user;
      if (isLogin) {
        user = db.login(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error("Identity designation required");
        user = db.register(formData.email, formData.password, formData.name);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Authentication Failed");
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
        const guestEmail = `guest_${Date.now()}@selfos.local`;
        const user = db.register(guestEmail, 'guest123', 'Guest User');
        onLogin(user);
    } catch(e) {
        // Fallback if random collision
        const user = db.register(`guest_${Date.now()}_2@selfos.local`, 'guest123', 'Guest User');
        onLogin(user);
    }
  };

  return (
    <div className="min-h-screen w-full bg-navy-950 flex items-center justify-center relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
         <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md p-8 relative z-10">
        
        {/* Logo/Brand */}
        <div className="text-center mb-10 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
           <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(76,110,245,0.2)] relative group">
              <div className="absolute inset-0 bg-neon-blue/10 blur-xl group-hover:bg-neon-blue/20 transition-all"></div>
              <Brain className="w-10 h-10 text-neon-blue relative z-10" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-navy-950 animate-pulse"></div>
           </div>
           <div>
             <h1 className="text-4xl font-light tracking-tight text-white mb-1">SELF-OS</h1>
             <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.3em]">Neural Operating System</p>
           </div>
        </div>

        {/* Form Container */}
        <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
           
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-light text-white">
                {isLogin ? 'Establish Uplink' : 'Forge Identity'}
              </h2>
              <Fingerprint className="w-6 h-6 text-white/20" />
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              
              {!isLogin && (
                <div className="space-y-1.5">
                   <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 ml-1">Designation</label>
                   <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
                     <input 
                       type="text" 
                       required={!isLogin}
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:ring-1 focus:ring-neon-purple focus:border-neon-purple/50 transition-all placeholder-gray-600"
                       placeholder="Enter your name"
                     />
                   </div>
                </div>
              )}

              <div className="space-y-1.5">
                 <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 ml-1">Neural ID (Email)</label>
                 <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                   <input 
                     type="email" 
                     required
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:ring-1 focus:ring-neon-blue focus:border-neon-blue/50 transition-all placeholder-gray-600"
                     placeholder="name@example.com"
                   />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 ml-1">Access Key</label>
                 <div className="relative group">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                   <input 
                     type="password" 
                     required
                     value={formData.password}
                     onChange={e => setFormData({...formData, password: e.target.value})}
                     className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:ring-1 focus:ring-neon-blue focus:border-neon-blue/50 transition-all placeholder-gray-600"
                     placeholder="••••••••"
                   />
                 </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4" />
                   {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium tracking-wide shadow-lg hover:shadow-neon-blue/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Initialize System' : 'Create System'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
              </button>

              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-white/10"></div>
                 <span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 uppercase tracking-widest">Or</span>
                 <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button 
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest">
                <Ghost className="w-4 h-4" />
                Quick Guest Access
              </button>
           </form>

           <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {isLogin ? (
                  <>New to SELF-OS? <span className="text-neon-blue underline underline-offset-4">Forge Identity</span></>
                ) : (
                  <>Already have an ID? <span className="text-neon-blue underline underline-offset-4">Establish Uplink</span></>
                )}
              </button>
           </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2 opacity-50 animate-in fade-in duration-1000 delay-300">
           <div className="flex justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">
              <span>Secure Enclave</span>
              <span>•</span>
              <span>Local Encryption</span>
              <span>•</span>
              <span>v1.0.5</span>
           </div>
        </div>

      </div>
    </div>
  );
};