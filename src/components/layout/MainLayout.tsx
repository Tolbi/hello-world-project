
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Package, GitGraph, BrainCircuit, 
  Settings, Zap, Search, Bell, Menu, LogOut 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MainLayout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Supervision", icon: <LayoutDashboard size={20} /> },
    { path: "/logistique", label: "Logistique", icon: <Package size={20} /> },
    { path: "/tracabilite", label: "Traçabilité", icon: <GitGraph size={20} /> },
    // { path: "/analytics", label: "Intelligence", icon: <BrainCircuit size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-['Plus_Jakarta_Sans'] overflow-hidden">
      
      {/* 1. SIDEBAR (Verte Tolbi) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[80px] md:w-[280px] bg-white md:bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="h-[80px] flex items-center justify-center md:justify-start px-0 md:px-8 border-b border-slate-50">
          <div className="w-10 h-10 bg-[#006B3D] rounded-xl flex items-center justify-center text-[#FFCB05] shadow-lg shrink-0">
            <Zap size={24} fill="#FFCB05" />
          </div>
          <div className="hidden md:block ml-4">
            <h1 className="text-sm font-black text-[#006B3D] uppercase tracking-wider">TOLBI OS</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase">v3.0 Cloud</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-[#006B3D] text-white shadow-lg shadow-emerald-900/20' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="hidden md:block text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              {/* Active Indicator for mobile */}
              <div className="md:hidden absolute left-0 w-1 h-8 bg-[#FFCB05] rounded-r-full opacity-0 group-[.active]:opacity-100" />
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start gap-4 w-full p-3 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden md:block text-[10px] font-black uppercase">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-[80px] bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-400">
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <span>Application</span>
              <span className="text-slate-200">/</span>
              <span className="text-[#006B3D]">Vue Active</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="RECHERCHE GLOBALE..." 
                className="w-64 pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-[#006B3D]/20 transition-all"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-[#006B3D] transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg">
              AD
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
