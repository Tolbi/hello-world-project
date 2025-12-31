
import React, { useState, useMemo, useCallback } from 'react';
import { Producer, LayerType, UnionName } from '../types';
import { 
  Search, ChevronRight, Droplets, TrendingUp, 
  PanelLeftClose, PanelLeftOpen, Target, LayoutGrid,
  ChevronLeft, Maximize2, Minimize2
} from 'lucide-react';
import MapComponent from './MapComponent';

interface Props {
  producers: Producer[];
  selectedUnion: UnionName | 'All';
  rasterRegistry: Map<string, File>;
}

const GisView: React.FC<Props> = ({ producers, selectedUnion, rasterRegistry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLayer, setActiveLayer] = useState<LayerType>('yield');
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const filteredProducers = useMemo(() => {
    return producers.filter(p => {
      const matchUnion = selectedUnion === 'All' || p.union === selectedUnion;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.village.toLowerCase().includes(searchTerm.toLowerCase());
      return matchUnion && matchSearch;
    });
  }, [producers, searchTerm, selectedUnion]);

  const handleSelectProducer = useCallback((id: string | null) => {
    setSelectedProducerId(id);
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-140px)] w-full overflow-hidden bg-white rounded-[40px] shadow-sm border border-slate-200">
      
      {/* 1. Sidebar Registre SIG */}
      <div 
        className={`relative z-[1100] h-full bg-white transition-all duration-500 ease-in-out border-r border-slate-100 ${
          isSidebarOpen ? 'w-[360px]' : 'w-0 opacity-0 -translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full w-[360px]">
          {/* Header Sidebar */}
          <div className="p-8 pb-6 border-b border-slate-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">REGISTRE SIG</h3>
                <p className="text-[9px] font-black text-[#006B3D] uppercase tracking-[0.2em] mt-0.5">Saison Maïs 2025</p>
              </div>
              <div className="bg-[#006B3D]/10 text-[#006B3D] text-[9px] font-black px-3 py-1.5 rounded-lg uppercase">
                {filteredProducers.length} unités
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                type="text" 
                placeholder="RECHERCHER UN PRODUCTEUR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none focus:ring-4 focus:ring-[#006B3D]/5 focus:border-[#006B3D]/30 transition-all placeholder:text-slate-300 uppercase"
              />
            </div>
          </div>

          {/* Liste des Producteurs */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2.5">
            {filteredProducers.map(p => (
              <button 
                key={p.id} 
                onClick={() => setSelectedProducerId(p.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                  selectedProducerId === p.id 
                  ? 'bg-[#006B3D] border-[#006B3D] shadow-lg shadow-emerald-900/20' 
                  : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                    selectedProducerId === p.id 
                    ? 'bg-[#FFCB05] text-[#006B3D] scale-105' 
                    : 'bg-slate-50 text-slate-400 group-hover:bg-[#FFCB05] group-hover:text-[#006B3D]'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="max-w-[160px]">
                    <p className={`font-black text-[11px] tracking-tight truncate ${selectedProducerId === p.id ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </p>
                    <p className={`text-[8px] uppercase font-bold tracking-widest mt-1 ${selectedProducerId === p.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {p.village} • {p.areaHectares.toFixed(1)} ha
                    </p>
                  </div>
                </div>
                <div className={`flex flex-col items-end ${selectedProducerId === p.id ? 'opacity-100' : 'opacity-40'}`}>
                   <span className={`text-[9px] font-black ${selectedProducerId === p.id ? 'text-[#FFCB05]' : 'text-[#006B3D]'}`}>
                    {activeLayer === 'yield' ? `${p.yieldActual} t/ha` : activeLayer === 'density' ? `${(p.density/1000).toFixed(0)}k` : `${p.fertilityIndex}%`}
                   </span>
                   <ChevronRight size={12} className={selectedProducerId === p.id ? 'text-[#FFCB05]' : 'text-slate-300'} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Zone Carte Intégrale */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden">
        
        {/* NOUVEAU CONTROLE DE SIDEBAR UNIFIE (UX AMÉLIORÉE) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out z-[1500]"
          style={{ left: isSidebarOpen ? '0px' : '20px' }}
        >
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center justify-center w-10 h-14 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-r-2xl text-slate-400 hover:text-[#006B3D] transition-all group ${
              !isSidebarOpen ? 'rounded-l-2xl' : ''
            }`}
            title={isSidebarOpen ? "Agrandir la carte" : "Afficher le registre"}
          >
             <div className="flex flex-col items-center gap-1 transition-transform duration-500" style={{ transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                {isSidebarOpen ? <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /> : <PanelLeftOpen size={20} />}
             </div>
          </button>
        </div>

        {/* BARRE D'OUTILS LAYERS - Design flottant */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1300] flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-full shadow-2xl animate-in fade-in slide-in-from-top duration-700">
          <LayerBtn active={activeLayer === 'yield'} onClick={() => setActiveLayer('yield')} icon={<TrendingUp className="w-4 h-4" />} label="Rendement" />
          <LayerBtn active={activeLayer === 'density'} onClick={() => setActiveLayer('density')} icon={<LayoutGrid className="w-4 h-4" />} label="Densité" />
          <LayerBtn active={activeLayer === 'fertility'} onClick={() => setActiveLayer('fertility')} icon={<Droplets className="w-4 h-4" />} label="Fertilité" />
        </div>

        {/* Badge Union - Minimaliste */}
        <div className="absolute top-8 right-8 z-[1200]">
           <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-6 py-4 rounded-[24px] flex items-center gap-4 shadow-xl">
              <div className="w-10 h-10 bg-[#FFCB05] rounded-xl flex items-center justify-center shadow-inner">
                <Target size={18} className="text-[#006B3D]" />
              </div>
              <div className="leading-none">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Secteur Actif</p>
                <p className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[140px] tracking-tight">{selectedUnion}</p>
              </div>
           </div>
        </div>

        {/* Composant Carte Principal */}
        <div className="w-full h-full z-0">
          <MapComponent 
            producers={filteredProducers} 
            activeLayer={activeLayer} 
            rasterRegistry={rasterRegistry}
            selectedProducerId={selectedProducerId}
            onSelectProducer={handleSelectProducer}
          />
        </div>
      </div>
    </div>
  );
};

const LayerBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
      active 
      ? 'bg-[#006B3D] text-[#FFCB05] shadow-lg scale-105' 
      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50/50'
    }`}
  >
    {icon} <span className="hidden sm:inline">{label}</span>
  </button>
);

export default GisView;
