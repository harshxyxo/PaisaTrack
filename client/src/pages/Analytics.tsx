import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/axios';

const Analytics: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/summary?month=${month}&year=${year}`);
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [month, year]);

  const nextMonth = () => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    setDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(date);
    prev.setMonth(prev.getMonth() - 1);
    setDate(prev);
  };

  const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getMonth() + 1 === month && todayDate.getFullYear() === year;
  const currentDay = todayDate.getDate();

  if (loading && !summary) return (
    <div className="h-screen flex items-center justify-center bg-[#080e1d]">
      <div className="w-10 h-10 border-4 border-[#bd9dff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 pt-4 animate-in fade-in duration-700 w-full max-w-4xl mx-auto px-6 md:px-8 overflow-x-hidden font-['Inter']">
      
      <nav className="flex justify-center items-center w-full py-4 mb-8">
        <div className="flex items-center gap-4 bg-[#131B2C] border border-white/5 rounded-full px-5 py-2.5 shadow-lg">
          <button onClick={prevMonth} className="text-[#a5aabf] hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm min-w-[100px] text-center uppercase tracking-widest">{monthName}</span>
          <button onClick={nextMonth} className="text-[#a5aabf] hover:text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </nav>

      <main className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-[#131B2C] border border-white/5 rounded-[2rem] p-8 shadow-xl flex flex-col"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-white font-black italic uppercase text-sm tracking-tight">Spending Trend</h3>
              <span className="text-[#10B981] text-[10px] font-black uppercase tracking-widest">
                Daily Avg: ₹{Math.round((summary?.totalExpense || 0) / (summary?.elapsedDays || 30))}
              </span>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-1 h-48 mt-auto">
              {summary?.dailySpending?.map((day: any, idx: number) => {
                const maxVal = Math.max(...summary.dailySpending.map((d: any) => d.amount), 1);
                const height = (day.amount / maxVal) * 100;
                const isToday = isCurrentMonth && day.day === currentDay;
                
                return (
                  <div 
                    key={idx} 
                    className={`w-full rounded-t-[4px] transition-all duration-500 relative group cursor-pointer ${
                      isToday ? 'bg-[#bd9dff] shadow-[0_0_15px_rgba(189,157,255,0.4)]' :
                      day.amount > (summary.totalExpense / 30) * 1.5 ? 'bg-[#F43F5E]' : 
                      'bg-[#2d3a5a] hover:bg-[#3d4b6d]'
                    }`}
                    style={{ height: `${Math.max(4, height)}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0B1120] text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap border border-white/10">
                      ₹{day.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-[8px] font-black text-[#a5aabf] uppercase tracking-widest mt-4">
              <span>Day 01</span>
              <span>Day 15</span>
              <span>Day {summary?.dailySpending?.length || 30}</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#131B2C] border border-white/5 rounded-[2rem] p-8 shadow-xl flex flex-col"
          >
            <h3 className="text-white font-black italic uppercase text-sm mb-8 tracking-tight">Breakdown</h3>
            <div className="flex flex-col items-center flex-1 justify-center">
              <div className="relative w-36 h-36 mb-8">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0B1120" strokeWidth="4" />
                  {summary?.categoryBreakdown?.map((item: any, i: number) => {
                     const offset = summary.categoryBreakdown.slice(0, i).reduce((sum: number, prev: any) => sum + prev.percentage, 0);
                     const colors = ['#bd9dff', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];
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
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white italic tracking-tighter">₹{(summary?.totalExpense || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[9px] font-black text-[#a5aabf] uppercase tracking-widest opacity-60">Monthly Flow</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                {summary?.categoryBreakdown?.map((item: any, i: number) => {
                  const colors = ['#bd9dff', '#10B981', '#F43F5E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];
                  return (
                    <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#a5aabf]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span> 
                        <span>{item.category}</span>
                      </div>
                      <span className="text-white">{item.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summary?.insights?.filter((i: any) => i.type !== 'ai').map((insight: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className={`border rounded-[1.5rem] p-6 shadow-lg flex items-start gap-4 ${
                insight.type === 'warning' ? 'bg-[#F43F5E]/5 border-[#F43F5E]/20' : 
                insight.type === 'success' ? 'bg-[#10B981]/5 border-[#10B981]/20' : 
                'bg-[#131B2C] border-white/5'
              }`}
            >
              <span className="text-3xl">{insight.emoji}</span>
              <p className="text-sm text-white font-medium leading-relaxed">
                {insight.message}
              </p>
            </motion.div>
          ))}
          {(!summary?.insights || summary.insights.length === 0) && (
            <div className="md:col-span-3 text-center py-12 text-[#a5aabf] opacity-40 text-[10px] uppercase font-black tracking-widest bg-[#131B2C] rounded-[1.5rem] border border-white/5">
              Analyzing your spending vibes... 🔍
            </div>
          )}
        </div>

        {/* AI Insight Bento Box */}
        {summary?.insights?.filter((i: any) => i.type === 'ai').map((aiInsight: any, idx: number) => (
          <motion.div 
            key={`ai-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#bd9dff]/10 to-[#131B2C] border border-[#bd9dff]/20 rounded-[2rem] p-8 shadow-[0_0_30px_rgba(189,157,255,0.05)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bd9dff]/5 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{aiInsight.emoji}</span>
              <h3 className="text-[#bd9dff] font-black italic uppercase text-sm tracking-tight">AI Insights</h3>
            </div>
            <p className="text-white text-base font-medium leading-relaxed max-w-2xl">
              {aiInsight.message}
            </p>
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#131B2C] border border-white/5 rounded-[2rem] p-8 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp size={18} className="text-[#bd9dff]" />
            <h3 className="text-white font-black italic uppercase text-sm tracking-tight">Top Merchant Flows</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summary?.topMerchants?.length > 0 ? summary.topMerchants.map((m: any, i: number) => (
              <div key={i} className="bg-[#0B1120] border border-white/5 rounded-[1.5rem] p-5 flex items-center justify-between shadow-inner hover:border-[#bd9dff]/30 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#bd9dff]/20 to-transparent flex items-center justify-center shrink-0">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random&color=fff&bold=true`} 
                      alt={m.name} 
                      className="w-8 h-8 rounded-lg" 
                    />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-bold text-sm truncate">{m.name}</p>
                    <p className="text-[9px] font-black text-[#a5aabf] uppercase tracking-widest mt-0.5">{m.count} Flows</p>
                  </div>
                </div>
                <span className="text-[#F43F5E] font-black italic shrink-0 ml-2">₹{m.amount.toLocaleString('en-IN')}</span>
              </div>
            )) : (
              <div className="col-span-3 text-center text-[#a5aabf] opacity-30 text-[9px] font-black uppercase tracking-widest py-10">No recent merchant data</div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;