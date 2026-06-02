import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Target, 
  PlusCircle, 
  Users, 
  UserCircle, 
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/goals', label: 'Budget Goals', icon: Target },
    { path: '/add', label: 'Add Transaction', icon: PlusCircle },
    { path: '/splits', label: 'Split Bills', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCircle },
  ];

  // Mobile Bottom Nav logic (Keep your existing mobile layout intact)
  const isMobileNavVisible = ['/dashboard', '/analytics', '/goals', '/add', '/splits', '/profile'].includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-[#080e1d] font-['Inter']">
      
      {/* Desktop Sidebar (Cleaned up Sci-Fi Text) */}
      <aside className="w-72 fixed h-screen border-r border-white/5 bg-[#080e1d] flex-col hidden lg:flex z-50">
        
        {/* Logo Area */}
        <div className="p-8 pb-4 mt-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#131B2C] border border-white/5 flex items-center justify-center shadow-lg">
              <Wallet className="text-[#bd9dff]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">PaisaTrack</h1>
              {/* Removed Core Protocol v3.1 */}
              <p className="text-[9px] font-black text-[#a5aabf] uppercase tracking-[0.2em] mt-0.5">Finance Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          {/* Removed Navigation Engine */}
          <p className="px-4 text-[10px] font-black text-[#a5aabf] uppercase tracking-[0.2em] mb-4 opacity-60">
            Main Menu
          </p>
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => 
                    `flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#131B2C] text-white shadow-lg border border-white/5 relative overflow-hidden' 
                        : 'text-[#a5aabf] hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Premium Purple Indicator Line for Active Tab */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-[#bd9dff] rounded-r-full shadow-[0_0_15px_rgba(189,157,255,0.8)]"></div>
                      )}
                      <Icon size={20} className={isActive ? "text-[#bd9dff]" : "text-[#a5aabf]"} />
                      <span className="uppercase tracking-widest text-[10px] mt-0.5">{link.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Logout Area (Removed "Disconnect Sync") */}
        <div className="p-6 mb-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black text-[#F43F5E] border border-white/5 bg-[#131B2C] hover:bg-[#F43F5E]/10 transition-all uppercase tracking-widest active:scale-95"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-h-screen relative w-full overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      {isMobileNavVisible && (
        <nav className="lg:hidden fixed bottom-0 w-full bg-[#080e1d]/90 backdrop-blur-xl border-t border-white/5 z-50 px-6 py-4 flex justify-between items-center pb-safe">
          {navLinks.slice(0, 5).map((link) => {
            const Icon = link.icon;
            return (
              <NavLink 
                key={link.path} 
                to={link.path}
                className={({ isActive }) => 
                  `p-3 rounded-2xl transition-all ${isActive ? 'bg-[#131B2C] text-[#bd9dff] shadow-lg' : 'text-[#a5aabf]'}`
                }
              >
                <Icon size={20} />
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default Layout;