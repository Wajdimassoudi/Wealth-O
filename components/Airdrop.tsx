
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  Globe, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  DollarSign,
  Target,
  BrainCircuit,
  Network,
  Radar,
  Compass,
  Milestone,
  Eye,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { sendAdminNotification } from '../services/telegramService';

interface AirdropProps {
  onBack: () => void;
}

const generateHash = () => `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;

const Airdrop: React.FC<AirdropProps> = ({ onBack }) => {
  const [copied, setCopied] = useState(false);
  const [userWallet, setUserWallet] = useState('');
  const [isWalletSaved, setIsWalletSaved] = useState(false);
  const [wosBalance, setWosBalance] = useState<number>(0);
  const [investAmount, setInvestAmount] = useState<string>('10');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error' | 'not_found'>('idle');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const BSC_API_KEY = "Q5DHPUZX5HA9M4U7TMEJUCT4CF98RI645X";
  const TARGET_WALLET = "0x9eb989d94300c1a7a8a2f2ba03201ed3395ffff3";
  const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

  useEffect(() => {
    const fetchUser = async () => {
      const username = localStorage.getItem('wealthos_active_session');
      if (username) {
        const { data } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
        if (data) {
          setUserWallet(data.wallet || '');
          setWosBalance(data.earnings || 0);
          if (data.wallet_updated_at) setIsWalletSaved(true);
        }
      }
    };
    fetchUser();
    
    const timer = setInterval(() => {
      const launchDate = new Date('2026-12-29T00:00:00').getTime();
      const diff = launchDate - new Date().getTime();
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const verifyPayment = async () => {
    if (!isWalletSaved) return;
    const amountToVerify = parseFloat(investAmount);
    if (isNaN(amountToVerify) || amountToVerify < 10) { setVerifyStatus('error'); return; }
    setVerifying(true);
    setVerifyStatus('idle');
    try {
      const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${TARGET_WALLET}&page=1&offset=100&sort=desc&apikey=${BSC_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "1" && Array.isArray(data.result)) {
        const tx = data.result.find((t: any) => t.from.toLowerCase() === userWallet.toLowerCase());
        if (tx) {
          const actualAmount = parseFloat(tx.value) / 1e18;
          if (actualAmount >= amountToVerify) {
            const tokensGained = actualAmount / 0.0364;
            const newBalance = wosBalance + tokensGained;
            await supabase.from('users').update({ earnings: newBalance }).eq('username', localStorage.getItem('wealthos_active_session'));
            setWosBalance(newBalance);
            setVerifyStatus('success');
          } else setVerifyStatus('error');
        } else setVerifyStatus('not_found');
      } else setVerifyStatus('not_found');
    } catch (err) { setVerifyStatus('error'); } finally { setVerifying(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 pb-20 relative overflow-x-hidden font-sans custom-scrollbar">
      <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <button onClick={onBack} className="p-2 text-xs font-black uppercase text-slate-400 flex items-center gap-2"><ArrowLeft size={18} /> Exit Portal</button>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-[10px] font-black text-emerald-400">$0.0364</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-16">
        {/* Countdown */}
        <section className="glass-panel p-6 rounded-[2rem] border border-cyan-500/30 text-center">
           <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4">Mainnet Launch Countdown</h3>
           <div className="flex justify-center gap-8">
              {[ {l: 'Days', v: timeLeft.days}, {l: 'Hrs', v: timeLeft.hours}, {l: 'Min', v: timeLeft.mins}, {l: 'Sec', v: timeLeft.secs} ].map((t,i) => (
                <div key={i} className="flex flex-col"><span className="text-2xl font-orbitron font-black text-white">{t.v}</span><span className="text-[8px] font-black text-slate-500 uppercase">{t.l}</span></div>
              ))}
           </div>
        </section>

        {/* Investment Card */}
        <section className={`transition-all ${isWalletSaved ? 'opacity-100' : 'opacity-30'}`}>
          <div className="glass-panel p-10 rounded-[3rem] border-2 border-amber-500/20 space-y-8 relative overflow-hidden">
             {verifying && <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in"><Radar size={60} className="text-cyan-500 animate-spin" /><span className="text-xs font-black text-white uppercase tracking-widest">Scanning Chain...</span></div>}
             <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-500 uppercase">Auto-Detection Active</div>
                <h2 className="text-xl font-orbitron font-black text-white uppercase tracking-widest">Deploy Liquidity</h2>
             </div>
             <div className="space-y-4">
                <input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none" placeholder="AMOUNT USDT" />
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                   <div className="truncate font-mono text-xs text-amber-500">{TARGET_WALLET}</div>
                   <button onClick={() => { navigator.clipboard.writeText(TARGET_WALLET); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 bg-white text-slate-950 rounded-xl">{copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}</button>
                </div>
                <button onClick={verifyPayment} className="w-full bg-amber-500 text-slate-950 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all">Verify Transaction</button>
                {verifyStatus === 'success' && <p className="text-center text-emerald-400 text-[10px] font-black uppercase">Success! Balance Updated.</p>}
                {verifyStatus === 'not_found' && <p className="text-center text-red-400 text-[10px] font-black uppercase tracking-widest">No TX Detected. Try Again.</p>}
             </div>
          </div>
        </section>

        {/* Visionaries Section */}
        <section className="space-y-12">
           <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-full border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                 <Compass size={24} className="text-cyan-400 animate-[spin_10s_linear_infinite]" />
              </div>
              <h2 className="text-3xl font-orbitron font-black text-white uppercase tracking-tighter">Visionaries <span className="text-cyan-500 text-lg block md:inline md:ml-4">Quantum Visionaries</span></h2>
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  title: 'Quantum Bridge', 
                  desc: 'Developing a liquidity bridge between BNB and Solana chains to ensure the fastest withdrawals and transfers for investors.',
                  icon: <Network className="text-cyan-500" />,
                  phase: 'Phase 01'
                },
                { 
                  title: 'Neural Yield AI', 
                  desc: 'Activating AI algorithms to distribute profits based on network stability and global node distribution.',
                  icon: <BrainCircuit className="text-amber-500" />,
                  phase: 'Phase 02'
                },
                { 
                  title: 'Global Governance', 
                  desc: 'Granting large node holders the right to vote on future token burn and distribution protocols.',
                  icon: <ShieldCheck className="text-emerald-500" />,
                  phase: 'Phase 03'
                },
                { 
                  title: 'Sovereign Node', 
                  desc: 'Launching physical mining devices linked to the WealthOS system to increase decentralized network strength.',
                  icon: <Cpu className="text-red-500" />,
                  phase: 'Phase 04'
                }
              ].map((item, i) => (
                <div key={i} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-cyan-500/30 transition-all">
                   <div className="absolute top-6 right-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.phase}</div>
                   <div className="p-3 bg-white/5 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform">{item.icon}</div>
                   <h3 className="text-lg font-orbitron font-black text-white mb-3 uppercase">{item.title}</h3>
                   <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase">{item.desc}</p>
                </div>
              ))}
           </div>

           <div className="glass-panel p-8 rounded-[3rem] border border-cyan-500/20 bg-cyan-500/5 text-center space-y-6">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-[0.5em]">Investor Protocol</h4>
              <p className="text-sm font-bold text-white max-w-2xl mx-auto italic">"We are not just building a dashboard; we are building an independent financial system that relies on community strength and AI to generate wealth sustainably."</p>
              <div className="flex justify-center gap-4 text-slate-500">
                 <Milestone size={16} /> <Eye size={16} /> <Target size={16} />
              </div>
           </div>
        </section>

        <section className="text-center opacity-30 pb-10">
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">© 2026 WealthOS Genesis • Visionary Node ID: 99420-OS</p>
        </section>
      </main>
    </div>
  );
};

export default Airdrop;
