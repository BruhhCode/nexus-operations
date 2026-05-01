import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 sm:p-12 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 sm:p-12 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
        
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm shadow-indigo-100">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center">Nexus Operations</h1>
          <p className="text-sm text-slate-500 mt-2 text-center uppercase tracking-widest font-bold opacity-60">Enterprise OS</p>
        </div>

        <div className="space-y-10 text-center">
          <div className="space-y-4">
            <p className="text-lg font-medium text-slate-600 leading-relaxed">
              Unified enterprise intelligence and asset orchestration platform.
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-primary justify-center shadow-lg shadow-indigo-100 disabled:opacity-50 h-14"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? 'INITIALIZING...' : (
                  <>
                    <span className="tracking-widest uppercase text-xs font-bold">Authenticate with Google</span>
                  </>
                )}
              </div>
            </button>
            <p className="text-[10px] opacity-40 font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
          </div>
        </div>

        <div className="mt-16 flex justify-center gap-8 opacity-20 text-slate-500 font-bold text-[9px] uppercase tracking-widest pt-8 border-t border-slate-50">
           <span>Protocol: RBAC_S4</span>
           <span>Status: ONLINE</span>
        </div>
      </motion.div>
      <div className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-widest">Nexus Operating System v2.4.1</div>
    </div>
  );
}
