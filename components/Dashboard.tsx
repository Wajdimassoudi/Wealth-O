
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Zap, 
  Cpu, 
  Wallet, 
  Activity,
  RefreshCw,
  Terminal,
  LogOut,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Share2,
  Star,
  Coins,
  Gem,
  Lock,
  Maximize2,
  Trophy,
  ListChecks,
  Globe,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Eye,
  Rocket,
  Crown
} from 'lucide-react';
import { ViewLog, UserRecord, TaskItem, LeaderboardEntry } from '../types';
import FakeNotifications from './FakeNotifications';
import { supabase } from '../services/supabase';

const DAILY_LIMIT = 21; 
const MIN_WITHDRAW = 500;
const CLICK_REWARD_WOS = 0.2;
const TASK_REWARD_WOS = 0.5; // Updated to 0.5 as requested

interface DashboardProps {
  username: string;
  onLogout: () => void;
  onNavigateAirdrop: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ username, onLogout, onNavigateAirdrop }) => {
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [viewedToday, setViewedToday] = useState<number>(0);
  const [wallet, setWallet] = useState<string>('');
  const [viewLog, setViewLog] = useState<ViewLog[]>([]);
  const [isWalletLocked, setIsWalletLocked] = useState(false);
  const [loadingNode, setLoadingNode] = useState<number | null>(null);
  const [flashNotify, setFlashNotify] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [stats, setStats] = useState({
    totalDistributed: 428904.20,
    activeNodes: 12450,
    globalVol: 89.4
  });

  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'CLICK HERE TO GET 0.5 WOS', reward: TASK_REWARD_WOS, icon: 'Eye', completed: false, link: 'https://example-ads.com/v1' },
    { id: '2', title: 'CLICK HERE TO GET 0.5 WOS', reward: TASK_REWARD_WOS, icon: 'Shield', completed: false, link: 'https://example-ads.com/v2' },
    { id: '3', title: 'CLICK HERE TO GET 0.5 WOS', reward: TASK_REWARD_WOS, icon: 'Cpu', completed: false, link: 'https://example-ads.com/v3' }
  ]);

  const leaderboard = useMemo(() => {
    const today = new Date().getDate();
    const base = [
      { username: 'ALEX_***_88', earnings: 4250.20 + today, rank: 1 },
      { username: 'CRYPT***_ZG', earnings: 3890.50 + today, rank: 2 },
      { username: 'SAMIR***_99', earnings: 2100.10 + today, rank: 3 },
      { username: 'NODE_***_XX', earnings: 1850.40 + today, rank: 4 },
      { username: 'GHOST***_7', earnings: 1420.00 + today, rank: 5 }
    ];
    if (today % 2 === 0) return base.reverse().map((u, i) => ({ ...u, rank: i + 1 }));
    return base;
  }, []);

  const syncFromCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (data && !error) {
        const lastReset = new Date(data.last_reset);
        const today = new Date();
        const isNewDay = lastReset.toDateString() !== today.toDateString();

        let currentViewed = data.viewed_today || 0;
        if (isNewDay) {
          currentViewed = 0;
          await supabase.from('users').update({ 
            viewed_today: 0, 
            last_reset: today.toISOString() 
          }).eq('id', data.id);
        }

        setUserData(data);
        setBalance(data.earnings || 0);
        setViewedToday(currentViewed);
        setWallet(data.wallet || '');

        if (data.wallet_updated_at) {
          const lastUpdate = new Date(data.wallet_updated_at).getTime();
          if (Date.now() - lastUpdate < 90 * 24 * 60 * 60 * 1000) setIsWalletLocked(true);
        }
      }
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  }, [username]);

  useEffect(() => {
    syncFromCloud();
    const statInterval = setInterval(() => {
      setStats(prev => ({
        totalDistributed: prev.totalDistributed + (Math.random() * 0.5),
        activeNodes: prev.activeNodes + (Math.random() > 0.8 ? 1 : 0),
        globalVol: parseFloat((prev.globalVol + (Math.random() * 0.01)).toFixed(2))
      }));
    }, 5000);
    return () => clearInterval(statInterval);
  }, [syncFromCloud]);

  const triggerAd = () => {
    if (typeof (window as any).intstl === 'function') {
      (window as any).intstl('show');
    }
  };

  const handleClaimTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    triggerAd();
    
    window.open(task.link, '_blank');
    setTimeout(async () => {
      const newBalance = balance + TASK_REWARD_WOS;
      setBalance(newBalance);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      setFlashNotify(`Ad Verified! +${TASK_REWARD_WOS} WOS`);
      if (userData) {
        await supabase.from('users').update({ earnings: newBalance }).eq('id', userData.id);
      }
      setTimeout(() => setFlashNotify(null), 3000);
    }, 1500);
  };

  const handleClaimNode = async () => {
    if (viewedToday >= DAILY_LIMIT) return;
    if (!userData) return;
    
    triggerAd();

    const newBalance = balance + CLICK_REWARD_WOS;
    const newViewed = viewedToday + 1;
    setBalance(newBalance);
    setViewedToday(newViewed);
    await supabase.from('users').update({ earnings: newBalance, viewed_today: newViewed }).eq('id', userData.id);
    setFlashNotify(`Node Synced! +${CLICK_REWARD_WOS} WOS`);
    setTimeout(() => setFlashNotify(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans pb-20 custom-scrollbar">
      <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <Terminal size={18} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="font-orbitron text-sm md:text-lg font-black text-white tracking-widest uppercase">WEALTH <span className="text-cyan-500">OS</span></h1>
              <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`}></span> 
                Protocol Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateAirdrop} 
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:scale-105 transition-all"
            >
              <Gem size={14} className="animate-bounce" /> <span className="hidden sm:inline">BUY NODES</span>
            </button>
            <button onClick={onLogout} className="p-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl border border-white/10 transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        
        {/* VIP INVESTOR GATEWAY */}
        <section className="relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-amber-500/20 to-cyan-500/20 blur-[80px] opacity-30 group-hover:opacity-60 transition-opacity"></div>
           <div className="relative glass-panel p-1 rounded-[2.5rem] border border-white/10">
              <div className="bg-slate-950/60 rounded-[2.2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                 <div className="space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
                       <Crown size={14} className="text-amber-500 animate-pulse" />
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">VIP Investor Access</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-orbitron font-black text-white leading-tight">
                       GATEWAY TO <br className="hidden md:block"/> <span className="text-cyan-500">QUANTUM ASSETS</span>
                    </h2>
                    <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-md">
                       Get your own nodes now and join the visionaries in building the decentralized future of WealthOS.
                    </p>
                 </div>
                 
                 <button 
                   onClick={onNavigateAirdrop}
                   className="relative group/btn flex items-center justify-center p-1 rounded-3xl transition-transform hover:scale-105 active:scale-95"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-amber-500 to-cyan-500 rounded-3xl animate-[spin_4s_linear_infinite] opacity-50"></div>
                    <div className="relative bg-slate-950 px-10 py-6 rounded-[1.4rem] flex items-center gap-4 border border-white/10">
                       <div className="flex flex-col items-start">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Portal</span>
                          <span className="text-lg font-orbitron font-black text-white group-hover/btn:text-cyan-400 transition-colors">INVEST NOW</span>
                       </div>
                       <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                          <Rocket size={24} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                       </div>
                    </div>
                 </button>
              </div>
           </div>
        </section>

        {/* Network Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Distributed', val: `${stats.totalDistributed.toLocaleString()} WOS`, icon: <Globe className="text-cyan-400" /> },
            { label: 'Active Network Nodes', val: stats.activeNodes.toLocaleString(), icon: <Cpu className="text-amber-500" /> },
            { label: 'Protocol Stability', val: `${stats.globalVol}%`, icon: <Activity className="text-emerald-500" /> }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center gap-5">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">{stat.icon}</div>
              <div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                <div className="text-xl font-orbitron font-black text-white tracking-tighter">{stat.val}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Main Balance & Withdrawal */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <div className="text-6xl md:text-8xl font-orbitron font-black text-white tracking-tighter">
                   {balance.toFixed(2)} <span className="text-cyan-500 text-3xl">WOS</span>
                </div>
                <button onClick={() => balance < MIN_WITHDRAW ? setWithdrawError(`Min 500 WOS required`) : alert('Request Logged')} className="w-full sm:w-auto bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3">
                   Request Payout <ArrowUpRight size={18} />
                </button>
                {withdrawError && <p className="text-red-400 text-[9px] font-black uppercase tracking-widest animate-bounce">{withdrawError}</p>}
             </div>
          </div>

          <div className="glass-panel p-8 rounded-[3rem] border border-white/10 flex flex-col justify-between">
             <div className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wallet size={16} /> Settlement Node</h3>
                <input 
                  type="text" 
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  disabled={isWalletLocked}
                  placeholder="ENTER BEP20 ADDRESS"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 px-6 text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500/50"
                />
             </div>
          </div>
        </section>

        {/* Missions & Leaderboard */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <h2 className="text-lg font-orbitron font-black text-white flex items-center gap-3 uppercase"><ListChecks className="text-cyan-400" /> Active Missions</h2>
              <div className="grid gap-3">
                 {tasks.map((task) => (
                   <div 
                     key={task.id} 
                     className={`glass-panel p-6 rounded-2xl border transition-all cursor-pointer ${task.completed ? 'border-amber-500/20 opacity-60' : 'border-cyan-500/30 ad-glow bg-cyan-500/5'} flex items-center justify-between group overflow-hidden`}
                     onClick={() => !task.completed && handleClaimTask(task.id)}
                   >
                      <div className="flex items-center gap-4 relative z-10">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${task.completed ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                            {task.icon === 'Eye' ? <Eye size={24} /> : <Zap size={24} />}
                         </div>
                         <div>
                            <div className="text-[11px] font-black text-white uppercase tracking-[0.1em] group-hover:text-cyan-400 transition-colors">
                               {task.completed ? 'MISSION COMPLETED' : (
                                 <span className="animate-pulse">CLICK HERE TO GET 0.5 WOS</span>
                               )}
                            </div>
                            <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Protocol Verification Required</div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end relative z-10">
                         <div className="text-xs font-orbitron font-black text-cyan-500 mb-1">+{task.reward} WOS</div>
                         <button 
                           className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${task.completed ? 'bg-slate-900 text-slate-600' : 'bg-white text-slate-950 group-hover:bg-cyan-400'}`}
                         >
                            {task.completed ? 'CLAIMED' : 'OPEN'}
                         </button>
                      </div>
                      {!task.completed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                      )}
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-lg font-orbitron font-black text-white flex items-center gap-3 uppercase"><Trophy className="text-amber-500" /> Top Operators (24H)</h2>
              <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                 <div className="divide-y divide-white/5">
                    {leaderboard.map((user) => (
                      <div key={user.rank} className="px-6 py-5 flex justify-between items-center hover:bg-white/5">
                         <div className="flex items-center gap-4">
                            <span className={`text-xs font-orbitron font-black ${user.rank === 1 ? 'text-amber-500' : 'text-slate-500'}`}>0{user.rank}</span>
                            <div className="text-[11px] font-black text-white tracking-widest uppercase">{user.username}</div>
                         </div>
                         <div className="text-xs font-orbitron font-black text-cyan-400">{user.earnings.toLocaleString()} WOS</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Quantum Nodes Area */}
        <section className="space-y-6">
           <h2 className="text-lg font-orbitron font-black text-white flex items-center gap-3 uppercase"><Zap className="text-cyan-400" /> Sync Quantum Nodes</h2>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <button 
                  key={i}
                  disabled={loadingNode !== null || viewedToday >= DAILY_LIMIT}
                  onClick={() => {
                    setLoadingNode(i);
                    setTimeout(() => { handleClaimNode(); setLoadingNode(null); }, 3000);
                  }}
                  className="glass-panel aspect-square rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-4 group active:scale-95 disabled:opacity-30"
                >
                  {loadingNode === i ? <RefreshCw size={24} className="text-cyan-400 animate-spin" /> : <Cpu size={24} className="text-slate-500" />}
                  <span className="text-[9px] font-black text-slate-500 uppercase">Node_{i}</span>
                </button>
              ))}
           </div>
        </section>

      </main>

      {flashNotify && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase shadow-2xl flex items-center gap-3">
          <CheckCircle2 size={16} /> {flashNotify}
        </div>
      )}

      <FakeNotifications />
    </div>
  );
};

export default Dashboard;
