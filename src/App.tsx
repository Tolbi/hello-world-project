
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Settings, BrainCircuit, Bell, 
  Map as MapIcon, Package, ShoppingCart, 
  Layers, ChevronRight, Home, Grid, Zap,
  Search, Users, Filter, Sparkles, GitGraph,
  QrCode, Share2, Smartphone, ShieldCheck
} from 'lucide-react';
import { ModuleType, ViewType, Producer, UnionName, KnowledgeFile } from './types';
import { MOCK_PRODUCERS, UNIONS } from './constants';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import GisView from './components/GisView';
import SourceModule from './components/SourceModule';
import InsightsView from './components/InsightsView';
import TraceabilityModule from './components/TraceabilityModule';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('crop-view');
  const [activeView, setActiveView] = useState<ViewType | 'insights'>('dashboard');
  const [producers, setProducers] = useState<Producer[]>(MOCK_PRODUCERS);
  const [selectedUnion, setSelectedUnion] = useState<UnionName | 'All'>('All');
  
  // Persistance globale
  const [rasterFiles, setRasterFiles] = useState<File[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeFile[]>([]);
  const [systemInstruction, setSystemInstruction] = useState(
    "Tu es l'expert agronome de TOLBI OS. Tu analyses les densités de semis (optimal: 55k-65k), les rendements (objectif: >10t/ha) et la fertilisation à partir des données fournies. Utilise les documents PDF de la base de connaissances pour justifier tes conseils techniques."
  );

  const rasterRegistry = useMemo(() => {
    const registry = new Map<string, File>();
    rasterFiles.forEach(file => {
      registry.set(file.name, file);
    });
    return registry;
  }, [rasterFiles]);
  
  const switchModule = (mod: ModuleType) => {
    setActiveModule(mod);
    if (mod === 'crop-view') setActiveView('dashboard');
    else if (mod === 'source') setActiveView('inventory');
    else if (mod === 'analytics') setActiveView('insights');
    else if (mod === 'traceability') setActiveView('workflow');
  };

  const viewLabels: Record<string, string> = {
    dashboard: 'Tableau de Bord',
    sig: 'Carte',
    admin: 'Configuration Système',
    inventory: 'Inventaire',
    orders: 'Commandes',
    providers: 'Fournisseurs',
    insights: 'Assistant IA',
    workflow: 'Workflow Builder',
    lots: 'QR Manager',
    viz: 'Flux Viz',
    simulator: 'App Agent',
    audit: 'Audit Unitaire'
  };

  const moduleLabels: Record<string, string> = {
    'crop-view': 'Supervision',
    'source': 'Logistique',
    'analytics': 'Intelligence',
    'traceability': 'Traçabilité'
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#1A2B3D] overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Launcher Bar */}
      <aside className="w-[68px] bg-[#006B3D] flex flex-col items-center py-6 gap-6 shrink-0 z-[100]">
        <div className="w-10 h-10 bg-[#FFCB05] rounded-xl flex items-center justify-center mb-4 shadow-lg">
          <Zap className="text-[#006B3D] w-6 h-6 fill-[#006B3D]" />
        </div>
        
        <ModuleIcon 
          active={activeModule === 'crop-view'} 
          onClick={() => switchModule('crop-view')} 
          icon={<Layers className="w-6 h-6" />} 
          label="Supervision"
        />
        <ModuleIcon 
          active={activeModule === 'source'} 
          onClick={() => switchModule('source')} 
          icon={<Package className="w-6 h-6" />} 
          label="Logistique"
        />
        <ModuleIcon 
          active={activeModule === 'traceability'} 
          onClick={() => switchModule('traceability')} 
          icon={<GitGraph className="w-6 h-6" />} 
          label="Traçabilité"
        />
        <ModuleIcon 
          active={activeModule === 'analytics'} 
          onClick={() => switchModule('analytics')} 
          icon={<BrainCircuit className="w-6 h-6" />} 
          label="Intelligence"
        />
        
        <div className="mt-auto flex flex-col gap-6">
          <button 
            onClick={() => { setActiveModule('crop-view'); setActiveView('admin'); }}
            className={`transition-colors ${activeView === 'admin' ? 'text-[#FFCB05]' : 'text-white/50 hover:text-white'}`} 
            title="Configuration"
          >
            <Settings className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-[10px] border border-white/30 cursor-pointer hover:bg-white/30">TOLBI</div>
        </div>
      </aside>

      {/* 2. Module Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">Module</h2>
          <h1 className="text-xl font-black text-[#006B3D]">
            {moduleLabels[activeModule]}
          </h1>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {activeModule === 'crop-view' && (
            <>
              <SideNavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
              <SideNavItem active={activeView === 'sig'} onClick={() => setActiveView('sig')} icon={<MapIcon size={20}/>} label="Carte" />
              <SideNavItem active={activeView === 'admin'} onClick={() => setActiveView('admin')} icon={<Settings size={20}/>} label="Configuration" />
              
              <div className="mt-10 pt-6 border-t border-slate-50">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                  <Filter size={12} /> Filtre Union
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setSelectedUnion('All')}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedUnion === 'All' ? 'bg-[#006B3D] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Toutes les Unions
                  </button>
                  {UNIONS.map(u => (
                    <button 
                      key={u}
                      onClick={() => setSelectedUnion(u)}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all truncate ${selectedUnion === u ? 'bg-[#006B3D] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeModule === 'source' && (
            <>
              <SideNavItem active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={<Package size={20}/>} label="Stock Intrants" />
              <SideNavItem active={activeView === 'orders'} onClick={() => setActiveView('orders')} icon={<ShoppingCart size={20}/>} label="Commandes" />
              <SideNavItem active={activeView === 'providers'} onClick={() => setActiveView('providers')} icon={<Users size={20}/>} label="Fournisseurs" />
            </>
          )}

          {activeModule === 'traceability' && (
            <>
              <SideNavItem active={activeView === 'workflow'} onClick={() => setActiveView('workflow')} icon={<Grid size={20}/>} label="Workflow Builder" />
              <SideNavItem active={activeView === 'lots'} onClick={() => setActiveView('lots')} icon={<QrCode size={20}/>} label="QR Manager" />
              <SideNavItem active={activeView === 'audit'} onClick={() => setActiveView('audit')} icon={<ShieldCheck size={20}/>} label="Audit Unitaire" />
              <SideNavItem active={activeView === 'viz'} onClick={() => setActiveView('viz')} icon={<Share2 size={20}/>} label="Flux Viz" />
              <SideNavItem active={activeView === 'simulator'} onClick={() => setActiveView('simulator')} icon={<Smartphone size={20}/>} label="App Agent" />
            </>
          )}

          {activeModule === 'analytics' && (
            <>
              <SideNavItem active={activeView === 'insights'} onClick={() => setActiveView('insights')} icon={<Sparkles size={20}/>} label="Assistant IA" />
            </>
          )}
        </nav>
        
        <div className="p-8 border-t border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 bg-[#FFCB05] rounded-xl flex items-center justify-center shadow-md">
                <Zap size={20} className="text-[#006B3D]" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-900 uppercase">TOLBI OS</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">v2.5 Enterprise</p>
             </div>
          </div>
          <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#006B3D] hover:text-white transition-all">Support Technique</button>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F9FAFB] custom-scrollbar">
        <header className="h-[80px] bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <Home size={14} />
            <ChevronRight size={12} />
            <span className="text-slate-900">{moduleLabels[activeModule]}</span>
            <ChevronRight size={12} />
            <span className="text-emerald-600">{viewLabels[activeView] || activeView}</span>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="relative hidden xl:block">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" placeholder="RECHERCHE GLOBALE..." className="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black w-72 focus:ring-2 focus:ring-[#006B3D]/20 outline-none" />
             </div>
             <div className="flex items-center gap-6">
               <button className="relative text-slate-300 hover:text-[#006B3D] transition-colors"><Bell size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span></button>
               <div className="h-6 w-[1px] bg-slate-100"></div>
               <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-slate-900 uppercase leading-none">Abdoulaye Diaw</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">Directeur Technique</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg">AD</div>
               </div>
             </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto h-[calc(100vh-80px)] overflow-y-auto">
          {activeModule === 'crop-view' && (
            <>
              {activeView === 'dashboard' && <Dashboard producers={producers} selectedUnion={selectedUnion} onViewInsights={() => switchModule('analytics')} />}
              {activeView === 'sig' && <GisView producers={producers} selectedUnion={selectedUnion} rasterRegistry={rasterRegistry} />}
              {activeView === 'admin' && (
                <AdminPanel 
                  producers={producers} 
                  onUpdateProducers={setProducers} 
                  rasterFiles={rasterFiles} 
                  onUpdateRasterFiles={setRasterFiles} 
                  knowledgeBase={knowledgeBase}
                  onUpdateKnowledgeBase={setKnowledgeBase}
                  systemInstruction={systemInstruction}
                  onUpdateSystemInstruction={setSystemInstruction}
                />
              )}
            </>
          )}
          {activeModule === 'source' && <SourceModule view={activeView} />}
          {activeModule === 'traceability' && <TraceabilityModule view={activeView} producers={producers} />}
          {activeModule === 'analytics' && (
            <InsightsView 
              producers={producers} 
              knowledgeBase={knowledgeBase}
              systemInstruction={systemInstruction}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const ModuleIcon = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    title={label}
    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${
      active ? 'bg-white text-[#006B3D] shadow-2xl scale-110' : 'text-white/40 hover:text-white hover:bg-white/10'
    }`}
  >
    {icon}
    {active && <div className="absolute -left-6 w-2 h-8 bg-[#FFCB05] rounded-r-full shadow-lg"></div>}
  </button>
);

const SideNavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-[#006B3D]/5 text-[#006B3D] border border-[#006B3D]/10' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;
