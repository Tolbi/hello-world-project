import React, { useState, useMemo } from 'react';
import { Search, QrCode, User, MapPin, Calendar, Clock, ChevronRight, Box, ShieldCheck, ArrowRight, History } from 'lucide-react';
import { QRCodeObj, Producer } from '../../types';

interface Props {
  qrList: QRCodeObj[];
  producers: Producer[];
}

const AuditView: React.FC<Props> = ({ qrList, producers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQr, setSelectedQr] = useState<QRCodeObj | null>(null);

  const handleSearch = () => {
    const found = qrList.find(q => q.code.toLowerCase().trim() === searchQuery.toLowerCase().trim());
    setSelectedQr(found || null);
  };

  return (
    <div className="h-full bg-slate-50/50 flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center text-[#FFCB05] mb-6 shadow-xl">
           <ShieldCheck size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Audit & Traçabilité unitaire</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Identifier le parcours complet d'un sac</p>
        
        <div className="relative w-full max-w-xl">
          <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="SAISISSEZ OU SCANNEZ UN CODE QR (ex: LOT-2025-00001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-14 pr-32 py-5 bg-slate-50 border border-slate-200 rounded-[28px] text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#006B3D]/5 focus:border-[#006B3D] transition-all shadow-inner"
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-[#006B3D] transition-all shadow-lg active:scale-95"
          >
            Vérifier
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {!selectedQr ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
             <Box size={100} strokeWidth={1} />
             <p className="text-sm font-black uppercase tracking-widest mt-6">En attente de recherche...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Main Info Card */}
            <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-emerald-600 text-white px-8 py-3 rounded-bl-[32px] text-[10px] font-black uppercase tracking-widest">
                  Authentifié
               </div>
               
               <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="w-40 h-40 bg-slate-50 border border-slate-100 rounded-[32px] flex flex-col items-center justify-center shrink-0">
                     <QrCode size={80} className="text-slate-900" />
                     <span className="text-[9px] font-black text-slate-300 mt-4 uppercase tracking-widest">QR ID: {selectedQr.id}</span>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Code Unitaire</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedQr.code}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Producteur Affecté</p>
                         <p className="text-sm font-black text-slate-800 uppercase">{selectedQr.assigneeName || 'Non affecté'}</p>
                       </div>
                       <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={12}/> Création Lot</p>
                         <p className="text-sm font-black text-slate-800 uppercase">{selectedQr.date}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Timeline */}
            <div>
               <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 px-2">
                  <History size={16} className="text-[#006B3D]" /> Journal des opérations
               </h4>
               
               <div className="space-y-6 relative ml-4">
                  <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                  
                  {(!selectedQr.history || selectedQr.history.length === 0) ? (
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center text-slate-400 italic text-xs">
                       Aucun historique enregistré pour ce code.
                    </div>
                  ) : (
                    selectedQr.history.map((item, idx) => (
                      <div key={idx} className="relative flex gap-10 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 150}ms` }}>
                         <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center text-slate-900 shadow-sm relative z-10">
                            {idx === 0 ? <Box size={18} /> : <Clock size={18} />}
                         </div>
                         
                         <div className="flex-1 bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm group hover:border-[#006B3D]/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <h5 className="text-sm font-black text-slate-900 uppercase">{item.step}</h5>
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Par {item.agent}</p>
                               </div>
                               <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg uppercase">{item.date}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                               {Object.entries(item.details).map(([key, val]: any) => (
                                 <div key={key}>
                                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1">{key.replace('f_', '').replace('_', ' ')}</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{val}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditView;