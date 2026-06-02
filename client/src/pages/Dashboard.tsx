import React, { useState, useEffect, useRef } from 'react';
import { Settings, ArrowDown, ArrowUp, Coffee, Car, ShoppingBag, Plus, AlertCircle, Utensils, Zap, Receipt, Target, MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [recentTrans, setRecentTrans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatSession, setChatSession] = useState<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error("Gemini API key is missing. AI won't work.");
      return;
    }

    const prompt = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);
    setIsChatLoading(true);

    try {
      let session = chatSession;
      if (!session) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: `You are PaisaTrack's AI Financial Advisor. Current financial context: Total Income: ₹${summary?.totalIncome || 0}, Total Expenses: ₹${summary?.totalExpense || 0}, Net Balance: ₹${summary?.netBalance || 0}, Category Breakdown: ${JSON.stringify(summary?.categoryBreakdown || [])}. Provide helpful, concise, and friendly financial advice based on this context. Keep responses short.`
        });
        session = model.startChat({ history: [] });
        setChatSession(session);
      }

      const result = await session.sendMessage(prompt);
      setChatHistory(prev => [...prev, { role: 'model', text: result.response.text() }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response from AI Advisor.");
    } finally {
      setIsChatLoading(false);
    }
  };
  
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, transRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/transactions?limit=5')
        ]);
        setSummary(sumRes.data);
        setRecentTrans(transRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('swiggy') || cat.includes('zomato')) return <Utensils size={20} />;
    if (cat.includes('travel') || cat.includes('uber') || cat.includes('ola')) return <Car size={20} />;
    if (cat.includes('shop') || cat.includes('amazon') || cat.includes('myntra')) return <ShoppingBag size={20} />;
    if (cat.includes('bill') || cat.includes('recharge')) return <Receipt size={20} />;
    if (cat.includes('entertainment') || cat.includes('netflix')) return <Zap size={20} />;
    return <Target size={20} />;
  };

  if (loading && !summary) return (
    <div className="h-screen flex items-center justify-center bg-[#080e1d]">
      <div className="w-10 h-10 border-4 border-[#bd9dff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 pt-4 animate-in fade-in duration-700 w-full max-w-4xl mx-auto px-6 md:px-8 overflow-x-hidden font-['Inter']">
      
      {/* Top Navigation */}
      <nav className="flex justify-between items-center w-full py-4 mb-8">
        <div>
          <p className="text-[10px] font-black text-[#a5aabf] uppercase tracking-widest flex items-center gap-1 mb-0.5">
            Hey {user?.name?.split(' ')[0] || 'User'} <span className="text-sm">👋</span>
          </p>
          <h1 className="text-2xl font-black text-[#bd9dff] tracking-tight italic uppercase">
            {currentMonth}
          </h1>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-xl border border-white/10 bg-[#1d253b]/60 flex items-center justify-center text-[#bd9dff] hover:opacity-80 transition-all active:scale-95 shadow-lg"
        >
          <Settings size={20} />
        </button>
      </nav>

      <main className="space-y-6">
        {/* Total Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#131B2C] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#bd9dff]/10 rounded-full blur-[80px] pointer-events-none"></div>

          <p className="text-[#a5aabf] text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Net Balance</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter mb-10 relative z-10">
            ₹{(summary?.netBalance || 0).toLocaleString('en-IN')}
          </h2>
          
          <div className="flex gap-6 relative z-10">
            <div className="flex-1 bg-[#0B1120] rounded-2xl p-5 border border-white/5 shadow-inner">
               <p className="text-[#10B981] text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                 <ArrowDown size={12} strokeWidth={3} /> Income
               </p>
               <p className="text-2xl font-black text-white italic">₹{(summary?.totalIncome || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="flex-1 bg-[#0B1120] rounded-2xl p-5 border border-white/5 shadow-inner">
               <p className="text-[#F43F5E] text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                 <ArrowUp size={12} strokeWidth={3} /> Expenses
               </p>
               <p className="text-2xl font-black text-white italic">₹{(summary?.totalExpense || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>

        {/* Guilt Score & Spending Vibe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-[#131B2C] border border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center shadow-lg"
           >
             <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-6">Guilt Score</p>
             <div className="relative w-28 h-28 mb-6">
                {(() => {
                  const guiltLevel = summary?.guiltLevel || 'decent';
                  const guiltColor = guiltLevel === 'monk' ? '#10B981' : guiltLevel === 'decent' ? '#bd9dff' : guiltLevel === 'worried' ? '#F59E0B' : '#F43F5E';
                  return (
                    <>
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90" style={{ filter: `drop-shadow(0 0 8px ${guiltColor}40)` }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0B1120" strokeWidth="4" />
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" stroke={guiltColor} strokeWidth="4" 
                          strokeDasharray={`${(summary?.guiltScore || 0) * 10}, 100`} 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black italic" style={{ color: guiltColor }}>{summary?.guiltScore || 0}</span>
                      </div>
                      <p className="absolute -bottom-10 w-[200px] left-1/2 -translate-x-1/2 text-xs font-bold mb-1 tracking-wide" style={{ color: guiltColor }}>{summary?.guiltMessage || 'Stay mindful 😅'}</p>
                    </>
                  );
                })()}
             </div>
             <p className="text-[#a5aabf] text-[8px] font-black uppercase tracking-widest opacity-60 mt-10">Based on your spending behavior</p>
           </motion.div>
           
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-[#131B2C] border border-white/5 rounded-[2rem] p-6 shadow-lg flex flex-col"
           >
             <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-6">Spending Vibe</p>
             <div className="flex flex-col items-center justify-center gap-6 flex-1">
                <div className="relative w-24 h-24">
                   <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                     {summary?.categoryBreakdown?.map((item: any, i: number) => {
                       const offset = summary.categoryBreakdown.slice(0, i).reduce((sum: number, prev: any) => sum + prev.percentage, 0);
                       const colors = ['#bd9dff', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6'];
                       const itemColor = colors[i % colors.length];
                       return (
                        <path 
                          key={i}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke={itemColor} 
                          strokeWidth="5" 
                          strokeDasharray={`${item.percentage}, 100`} 
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                        />
                       );
                     })}
                     {(!summary?.categoryBreakdown || summary.categoryBreakdown.length === 0) && (
                        <path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke="#0B1120" 
                          strokeWidth="5" 
                        />
                     )}
                   </svg>
                </div>
                <div className="space-y-3 w-full px-6">
                  {summary?.categoryBreakdown?.slice(0, 3).map((item: any, i: number) => {
                    const colors = ['#bd9dff', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6'];
                    return (
                      <div key={i} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#a5aabf]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span> 
                        {item.category} <span className="text-white ml-auto">{item.percentage}%</span>
                      </div>
                    );
                  })}
                  {(!summary?.categoryBreakdown || summary.categoryBreakdown.length === 0) && (
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#a5aabf] opacity-40 text-center">No categories yet</div>
                  )}
                </div>
             </div>
           </motion.div>
        </div>

        {/* Recent Flows List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-6 px-2">
             <h3 className="text-white font-black italic text-xl tracking-tight">Recent Flows 💸</h3>
             <Link to="/analytics" className="text-[#bd9dff] text-[9px] font-black uppercase tracking-widest hover:underline underline-offset-4">VIEW ALL</Link>
          </div>

          <div className="space-y-4">
            {recentTrans.length > 0 ? (
              recentTrans.map((t, i) => (
                <div 
                  key={i} 
                  className="bg-[#131B2C] border border-white/5 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm hover:border-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#bd9dff]/10 text-[#bd9dff]'}`}>
                      {getCategoryIcon(t.description || t.merchantName || t.category)}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">{t.description || t.merchantName || t.category}</p>
                      <p className="text-[#a5aabf] text-[9px] font-black tracking-widest uppercase mt-0.5">
                        {t.category} • {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-black italic text-lg tracking-tighter ${t.type === 'income' ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                    {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-[#131B2C] border border-white/5 p-12 rounded-[2rem] flex flex-col items-center justify-center text-[#a5aabf]/40">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Flow is currently empty</p>
                <Link to="/add" className="mt-6 flex items-center gap-2 bg-[#bd9dff] text-[#2e006c] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                  Start Flow <Plus size={14} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* AI Advisor Chat Modal & FAB */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 max-h-[28rem] bg-[#131B2C] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-['Inter']"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0B1120]">
              <h3 className="text-white font-black italic text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-[#bd9dff]" /> AI Advisor
              </h3>
              <button onClick={() => setIsChatOpen(false)} className="text-[#a5aabf] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-gradient-to-b from-[#131B2C] to-[#0B1120] max-h-72">
              {chatHistory.length === 0 && (
                <div className="text-center text-[#a5aabf] text-xs mt-4">
                  Ask me anything about your finances! 💸
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-[#bd9dff] text-[#2e006c] rounded-tr-sm font-medium' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white p-3 rounded-xl rounded-tl-sm text-xs flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-[#0B1120] border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about your budget..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#bd9dff]/50"
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-[#bd9dff] text-[#2e006c] p-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-[#a370f0] to-[#bd9dff] text-[#2e006c] rounded-full shadow-[0_0_20px_rgba(189,157,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default Dashboard;