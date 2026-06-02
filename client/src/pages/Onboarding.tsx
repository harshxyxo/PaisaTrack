import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 1,
    icon: ShieldCheck,
    iconColor: 'text-[#bd9dff]',
    iconBg: 'bg-[#bd9dff]/10',
    borderColor: 'border-[#bd9dff]/20',
    title1: 'Track every',
    title2: 'rupee',
    title2Color: 'text-[#bd9dff]',
    desc: 'Automatic expense logging for the modern digital native.'
  },
  {
    id: 2,
    icon: Users,
    iconColor: 'text-[#10B981]',
    iconBg: 'bg-[#10B981]/10',
    borderColor: 'border-[#10B981]/20',
    title1: 'Split bills',
    title2: 'instantly',
    title2Color: 'text-[#10B981]',
    desc: 'No more awkward "Who owes what?" at the end of the night.'
  },
  {
    id: 3,
    icon: Trophy,
    iconColor: 'text-[#F43F5E]',
    iconBg: 'bg-[#F43F5E]/10',
    borderColor: 'border-[#F43F5E]/20',
    title1: 'Beat your',
    title2: 'goals',
    title2Color: 'text-[#F43F5E]',
    desc: 'From a new sneaker drop to a trip to Goa—we get you there.'
  }
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      navigate('/dashboard');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const skipToDashboard = () => {
    navigate('/dashboard');
  };

  // FIX: Assigned to a capitalized variable so React renders it properly
  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen bg-[#080e1d] flex flex-col items-center justify-between font-['Inter'] px-6 py-10 relative overflow-hidden">
      
      {/* Top Bar */}
      <header className="w-full max-w-md flex items-center justify-between z-10">
        <span className="text-xl font-black text-[#bd9dff] tracking-tight italic uppercase">PaisaTrack</span>
        <button onClick={skipToDashboard} className="text-[#a5aabf] text-sm font-bold border border-dashed border-[#a5aabf]/40 px-3 py-1 rounded-lg hover:text-white transition-colors">
          Skip
        </button>
      </header>

      {/* Main Slider Content */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center relative z-10 mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Center Image / Icon Placeholder */}
            <div className={`w-48 h-48 rounded-[2.5rem] ${slides[currentSlide].iconBg} border ${slides[currentSlide].borderColor} flex items-center justify-center mb-12 shadow-2xl relative`}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#080e1d] to-transparent opacity-50 rounded-[2.5rem]"></div>
              {/* FIX: Using CurrentIcon here */}
              <CurrentIcon size={80} className={`${slides[currentSlide].iconColor} relative z-10 drop-shadow-[0_0_15px_currentColor]`} strokeWidth={1.5} />
            </div>

            {/* Typography strictly matching Stitch */}
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
              {slides[currentSlide].title1} <br/>
              <span className={`${slides[currentSlide].title2Color} italic`}>
                {slides[currentSlide].title2}
              </span>
            </h2>
            <p className="text-[#a5aabf] text-sm font-medium mt-4 max-w-[280px] leading-relaxed">
              {slides[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex flex-col items-center gap-8 z-10">
        
        {/* Dot Indicators */}
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentSlide ? 'w-6 bg-[#bd9dff]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Get Started Button */}
        <button 
          onClick={nextSlide}
          className="w-full bg-gradient-to-r from-[#a370f0] to-[#bd9dff] text-[#2e006c] py-4 rounded-full font-black text-sm shadow-[0_10px_30px_rgba(189,157,255,0.3)] hover:shadow-[0_15px_40px_rgba(189,157,255,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {currentSlide === slides.length - 1 ? 'Start Tracking' : 'Get Started'} <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
};

export default Onboarding;