
import React, { useState, useMemo } from 'react';
import { 
  Smartphone, Signal, Wifi, Battery, Home, Menu, GitGraph, 
  ChevronRight, QrCode, ArrowLeft, CheckCircle2, ShieldAlert, 
  X, Clock, User, Layers, Box, Truck, Factory, Search, CheckSquare, Square,
  UserCheck, MapPin, Scale, History, ShieldCheck, SearchCode, Calendar,
  Activity, Tag, Award, UserCog, ClipboardCheck
} from 'lucide-react';
import { Producer, QRCodeObj, WorkflowTemplate, WorkflowStep } from '../../types';

interface Props {
  producers: Producer[];
  qrList: QRCodeObj[];
  activeWorkflows: WorkflowTemplate[];
  onSimSubmit: (qrIds: string[], prodId: string, metadata: any) => void;
}

const MobileSimulator: React.FC<Props> = ({ producers, qrList, activeWorkflows, onSimSubmit }) => {
  const [simScreen, setSimScreen] = useState<'home' | 'scan' | 'form' | 'success' | 'incident' | 'audit'>('home');
  const [simActiveStep, setSimActiveStep] = useState<WorkflowStep | null>(null);
  const [simScannedQrs, setSimScannedQrs] = useState<string[]>([]);
  const [simIsScanning, setSimIsScanning] = useState(false);
  const [bulkScanMode, setBulkScanMode] = useState(false);
  const [blindScanCount, setBlindScanCount] = useState(0); 
  
  // State Audit local
  const [auditQuery, setAuditQuery] = useState('');
  const [auditResult, setAuditResult] = useState<QRCodeObj | null>(null);

  // State Formulaire local
  const [localFormData, setLocalFormData] = useState<Record<string, any>>({});

  const handleSimSubmit = () => {
    let idsToSubmit = simScannedQrs;
    if (bulkScanMode && blindScanCount > 0) {
      const freeQrs = qrList.filter(q => q.status === 'free').slice(0, blindScanCount);
      idsToSubmit = freeQrs.map(q => q.id);
      if (idsToSubmit.length < blindScanCount) {
        const assignedQrs = qrList.filter(q => q.status === 'assigned').slice(0, blindScanCount - idsToSubmit.length);
        idsToSubmit = [...idsToSubmit, ...assignedQrs.map(q => q.id)];
      }
    }

    const prodId = localFormData['f_id_prod'] || localFormData['f_dep_prod'] || 'unknown';
    onSimSubmit(idsToSubmit, prodId, { ...localFormData, count: blindScanCount || idsToSubmit.length });
    
    setSimScreen('success');
    setTimeout(() => {
      setSimScreen('home');
      setLocalFormData({});
      setSimScannedQrs([]);
      setBlindScanCount(0);
      setSimActiveStep(null);
      setBulkScanMode(false);
    }, 2000);
  };

  const toggleQrSelection = (id: string) => {
    setSimScannedQrs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSimScanComplete = () => {
    setSimIsScanning(false);
    setSimScreen('form');
  };

  const handleAuditSearch = () => {
    // Robust search: trim spaces and case insensitive
    const cleanQuery = auditQuery.replace(/\s+/g, '').toLowerCase();
    const found = qrList.find(q => q.code.replace(/\s+/g, '').toLowerCase() === cleanQuery);
    setAuditResult(found || null);
  };

  const wf = activeWorkflows[0] || { name: 'Aucun Workflow Actif', steps: [] };

  const getStepIcon = (idx: number) => {
    const icons = [<UserCheck size={18}/>, <Truck size={18}/>, <Factory size={18}/>];
    return icons[idx % icons.length];
  };

  const selectedProducer = useMemo(() => {
    const id = localFormData['f_id_prod'] || localFormData['f_dep_prod'];
    return producers.find(p => p.id === id);
  }, [localFormData, producers]);

  // Helper pour extraire les labels des détails de l'audit
  const renderDetailItem = (key: string, val: any) => {
    const fieldMapping: Record<string, { label: string, icon: any }> = {
      f_id_prod: { label: 'Producteur', icon: User },
      f_tra_driver: { label: 'Chauffeur', icon: UserCog },
      f_tra_plate: { label: 'Camion', icon: Truck },
      f_rec_qual: { label: 'Qualité', icon: Award },
      f_rec_name: { label: 'Réceptionnaire', icon: ClipboardCheck },
      f_rec_weight: { label: 'Poids (kg)', icon: Scale },
      f_tra_total: { label: 'Poids Total', icon: Scale },
      f_tra_sheet: { label: 'Fiche de Lot', icon: Tag },
      f_id_gps: { label: 'Localisation', icon: MapPin },
      village: { label: 'Village', icon: Home },
      producer: { label: 'Détenteur', icon: User }
    };

    const config = fieldMapping[key] || { label: key.replace('f_', '').replace('_', ' '), icon: Tag };
    if (key === 'blindCount' || key === 'count' || key === 'producer') return null;

    return (
      <div key={key} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 mb-1 mr-1">
        <config.icon size={10} className="text-[#006B3D]" />
        <div className="leading-tight">
          <p className="text-[7px] font-black text-slate-400 uppercase leading-none">{config.label}</p>
          <p className="text-[10px] font-bold text-slate-700 uppercase truncate max-w-[120px]">{val}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-100 flex items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0 opacity-10"><div className="absolute top-0 -left-20 w-96 h-96 bg-[#006B3D] rounded-full blur-[100px]"></div></div>
      
      <div className="relative z-10 w-[370px] h-[750px] bg-slate-900 rounded-[3.5rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* STATUS BAR */}
        <div className="h-10 bg-slate-50 flex items-center justify-between px-6 shrink-0 relative z-20">
          <span className="text-[10px] font-bold text-slate-900">12:30</span>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-28 bg-slate-900 rounded-b-2xl"></div>
          <div className="flex gap-2 text-slate-900"><Signal size={12} /><Wifi size={12} /><Battery size={12} /></div>
        </div>

        {/* SCREEN CONTENT */}
        <div className="flex-1 bg-slate-50 overflow-y-auto custom-scrollbar relative flex flex-col">
          
          {simScreen === 'home' && (
            <>
              <div className="p-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#006B3D] rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">MD</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Bienvenue</p>
                      <h3 className="text-sm font-black text-slate-900 leading-none">Agent Moussa</h3>
                    </div>
                  </div>
                  <button className="p-2 bg-white rounded-full shadow-sm text-slate-400"><Menu size={16} /></button>
                </div>
              </div>
              <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-5 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Campagne Active</p>
                    <h4 className="text-base font-black uppercase leading-tight mb-4">{wf.name}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFCB05] w-1/4"></div>
                      </div>
                      <span className="text-[9px] font-black uppercase">25%</span>
                    </div>
                  </div>
                  <GitGraph className="absolute -bottom-6 -right-6 text-slate-800 opacity-50" size={100} />
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Opérations de terrain</h4>
                  <div className="space-y-3">
                    {wf.steps.map((step, idx) => (
                      <button 
                        key={step.id} 
                        onClick={() => { 
                          setSimActiveStep(step); 
                          setSimScreen('form'); 
                        }} 
                        className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#006B3D] group-hover:bg-[#006B3D] group-hover:text-white transition-all shadow-inner">
                            {getStepIcon(idx)}
                          </div>
                          <div className="text-left">
                             <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">{step.name}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Démarrer la saisie</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setSimScreen('audit')}
                  className="w-full p-5 bg-slate-100 rounded-3xl border border-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <ShieldCheck size={20} className="text-[#006B3D]" />
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Traçabilité Unitaire / Audit</span>
                </button>
              </div>
            </>
          )}

          {simScreen === 'scan' && (
            <div className="flex-1 flex flex-col bg-black animate-in fade-in duration-300">
              <div className="p-6 pt-10 flex items-center gap-4 text-white z-20">
                <button onClick={() => setSimScreen('form')} className="p-2 bg-white/10 rounded-full"><ArrowLeft size={18} /></button>
                <div>
                   <p className="text-[10px] font-bold uppercase opacity-50">{bulkScanMode ? 'Mode Rafale' : 'Scanner'}</p>
                   <h3 className="text-sm font-black uppercase">{simActiveStep?.name}</h3>
                </div>
              </div>
              
              <div className="flex-1 relative flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/20 rounded-[40px] relative">
                  <div className="absolute inset-0 border-2 border-[#FFCB05] rounded-[40px] animate-pulse"></div>
                  {!simIsScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <QrCode size={64} className="text-white/10" />
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest text-center px-8">
                        Viseur de scan actif
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-t-[3rem] shadow-2xl relative z-20">
                <div className="mb-6 flex justify-between items-center text-white">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Articles détectés</p>
                    <p className="text-lg font-black uppercase">
                      {bulkScanMode ? blindScanCount : simScannedQrs.length} Unité(s)
                    </p>
                  </div>
                  {(simScannedQrs.length > 0 || blindScanCount > 0) && (
                    <button 
                      onClick={() => { setSimScannedQrs([]); setBlindScanCount(0); }} 
                      className="bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"
                    >
                      Reset
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    if (bulkScanMode) {
                      setBlindScanCount(prev => prev + 1);
                    } else {
                      setSimIsScanning(true);
                    }
                  }} 
                  className="w-full py-5 bg-[#FFCB05] text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 transition-all mb-4 shadow-xl"
                >
                  {bulkScanMode ? 'Ajouter un article (Bip)' : (simIsScanning ? 'Scan en cours...' : 'Ouvrir Scanner')}
                </button>
                <button onClick={handleSimScanComplete} className="w-full py-2 text-emerald-400 font-black uppercase text-[10px] tracking-widest">Valider la liste</button>
                
                {simIsScanning && !bulkScanMode && (
                  <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col p-8 animate-in slide-in-from-bottom-10 rounded-t-[3rem]">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-white font-black uppercase text-sm tracking-widest">Choisir le code</h4>
                      <button onClick={handleSimScanComplete} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Confirmer</button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                      {qrList.filter(q => q.status === 'free').slice(0, 20).map(qr => (
                        <button 
                          key={qr.id} 
                          onClick={() => {
                            setSimScannedQrs([qr.id]); 
                            handleSimScanComplete();
                          }} 
                          className="w-full p-4 rounded-2xl text-left bg-slate-800 border-transparent text-slate-400 hover:bg-emerald-600 hover:text-white transition-all flex justify-between items-center"
                        >
                          <span className="text-xs font-black">{qr.code}</span>
                          <span className="text-[8px] font-bold uppercase opacity-50">Libre</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {simScreen === 'form' && simActiveStep && (
            <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300">
              <div className="p-6 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => setSimScreen('home')} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <ArrowLeft size={20} className="text-slate-900" />
                </button>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opération Mobile</p>
                  <h3 className="text-sm font-black text-slate-900 uppercase truncate w-48 tracking-tight">{simActiveStep.name}</h3>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-24">
                {simActiveStep.fields.map(field => (
                  <div key={field.id} className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                      {field.label} {field.required && <span className="text-rose-500 font-black">*</span>}
                    </label>
                    
                    {field.type === 'qr_scan' || field.type === 'qr_bulk_scan' ? (
                      <button 
                        onClick={() => {
                          setBulkScanMode(field.type === 'qr_bulk_scan');
                          setSimScreen('scan');
                        }}
                        className={`w-full p-6 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${
                          (simScannedQrs.length > 0 || blindScanCount > 0) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-400 hover:border-[#006B3D] hover:bg-slate-50'
                        }`}
                      >
                        <QrCode size={36} />
                        <div className="text-center">
                          <p className="text-xs font-black uppercase">
                            {field.type === 'qr_bulk_scan'
                              ? (blindScanCount > 0 ? `${blindScanCount} unités enregistrées` : 'Lancer le scan rafale')
                              : (simScannedQrs.length > 0 ? `Code prêt` : 'Lancer le scan')}
                          </p>
                          {(simScannedQrs.length > 0 || blindScanCount > 0) && <p className="text-[8px] font-bold opacity-60 uppercase mt-1">Toucher pour modifier</p>}
                        </div>
                      </button>
                    ) : field.type === 'producer_select' ? (
                      <div className={`p-1 rounded-[28px] transition-all ${selectedProducer ? 'bg-emerald-600 shadow-xl shadow-emerald-900/20' : 'bg-slate-200'}`}>
                        <select 
                          className="w-full p-5 bg-white border-none rounded-[24px] text-xs font-black uppercase outline-none transition-all cursor-pointer shadow-inner"
                          onChange={(e) => setLocalFormData({...localFormData, [field.id]: e.target.value})}
                          value={localFormData[field.id] || ""}
                        >
                          <option value="">-- Choisir un producteur --</option>
                          {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {selectedProducer && (
                          <div className="px-5 py-3 text-white flex justify-between items-center">
                             <div>
                               <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Zone Localisée</p>
                               <p className="text-[10px] font-black uppercase mt-0.5">{selectedProducer.village}</p>
                             </div>
                             <CheckCircle2 size={16} className="text-emerald-300" />
                          </div>
                        )}
                      </div>
                    ) : field.type === 'gps' ? (
                      <div className="p-5 bg-slate-900 rounded-[24px] text-white flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><MapPin size={22} className="text-emerald-400" /></div>
                          <div><p className="text-[8px] font-bold uppercase opacity-50 tracking-widest">Position Actuelle</p><p className="text-[11px] font-black tracking-tighter">12.975476, -14.188846</p></div>
                        </div>
                        <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full uppercase border border-emerald-500/30">Précis</span>
                      </div>
                    ) : (
                      <input 
                        type={field.type === 'number' ? 'number' : 'text'} 
                        className="w-full p-5 bg-white border border-slate-200 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-[#006B3D]/5 focus:border-[#006B3D] transition-all shadow-sm"
                        placeholder={field.type === 'number' ? "0.00" : "Valeur à saisir..."}
                        onChange={(e) => setLocalFormData({...localFormData, [field.id]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-slate-100 absolute bottom-0 left-0 w-full z-10">
                <button 
                  onClick={handleSimSubmit} 
                  disabled={bulkScanMode ? (blindScanCount === 0) : (simScannedQrs.length === 0)}
                  className="w-full py-5 bg-[#006B3D] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-emerald-900/20"
                >
                  <CheckCircle2 size={18} /> Transmettre les données
                </button>
              </div>
            </div>
          )}

          {simScreen === 'audit' && (
            <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50 sticky top-0 z-10">
                <button onClick={() => setSimScreen('home')} className="p-2 bg-white rounded-xl shadow-sm text-slate-900">
                  <ArrowLeft size={18} />
                </button>
                <h3 className="text-sm font-black uppercase tracking-tight">Audit de Traçabilité</h3>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification du sac</p>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        placeholder="SCANNER OU SAISIR CODE QR"
                        className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-[24px] text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#006B3D]/10 focus:border-[#006B3D] transition-all shadow-inner"
                        value={auditQuery}
                        onChange={(e) => setAuditQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuditSearch()}
                      />
                      <button 
                        onClick={handleAuditSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"
                      >
                         <ChevronRight size={20} />
                      </button>
                   </div>
                </div>

                {!auditResult ? (
                  <div className="py-24 flex flex-col items-center justify-center text-slate-200 gap-6 opacity-50">
                     <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center border-2 border-dashed border-slate-200">
                        <History size={40} />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-center px-16 leading-relaxed">Scannez un code pour obtenir l'historique complet des opérations (ex: LOT-2025-00001)</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
                    <div className="p-6 bg-slate-900 rounded-[32px] text-white relative overflow-hidden shadow-2xl border-b-4 border-emerald-500">
                       <QrCode className="absolute -right-6 -top-6 opacity-10" size={120} />
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Lot Identifié</p>
                            <h4 className="text-3xl font-black tracking-tighter">{auditResult.code}</h4>
                          </div>
                          <div className="bg-emerald-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">Authentifié</div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                          <div>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 flex items-center gap-2"><User size={8}/> Dernier Détenteur</p>
                            <p className="text-[11px] font-black truncate">{auditResult.assigneeName || 'En attente'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 flex items-center gap-2"><Calendar size={8}/> Enregistré le</p>
                            <p className="text-[11px] font-black uppercase">{auditResult.date}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-2">
                         <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                           <Activity size={14} className="text-[#006B3D]" /> Chronologie du produit
                         </h5>
                         <span className="text-[8px] font-black text-slate-400 uppercase">{auditResult.history?.length || 0} Étapes</span>
                       </div>

                       <div className="space-y-6 relative ml-4">
                          <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-100"></div>
                          {(!auditResult.history || auditResult.history.length === 0) ? (
                            <div className="p-8 bg-slate-50 rounded-3xl text-center border-2 border-dashed border-slate-200">
                               <p className="text-[10px] text-slate-400 italic">Aucune donnée de mouvement disponible pour ce sac.</p>
                            </div>
                          ) : (
                            auditResult.history.map((h, idx) => (
                              <div key={idx} className="relative flex gap-6 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                 <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[#006B3D] z-10 shadow-sm shrink-0">
                                    {h.step.includes('Enrôlement') ? <UserCheck size={14} /> : 
                                     h.step.includes('Transport') ? <Truck size={14} /> : 
                                     <Factory size={14} />}
                                 </div>
                                 <div className="flex-1 bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm group hover:border-[#006B3D]/20 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                       <div>
                                         <p className="text-[11px] font-black uppercase text-slate-900 leading-tight">{h.step}</p>
                                         <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Saisi par {h.agent.split('(')[0]}</p>
                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                            <p className="text-[8px] font-bold text-slate-400">{h.date.split(' ')[1] || h.date}</p>
                                         </div>
                                       </div>
                                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{h.date.split(' ')[0]}</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1 pt-3 border-t border-slate-50">
                                       {Object.entries(h.details).map(([k, v]) => renderDetailItem(k, v))}
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
          )}

          {simScreen === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#006B3D] text-white p-10 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 shadow-2xl scale-110">
                <CheckCircle2 size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase text-center mb-3 tracking-tighter">Envoi Réussi</h3>
              <p className="text-emerald-100 text-[10px] font-bold text-center uppercase tracking-widest opacity-70 leading-relaxed">Les données de traçabilité ont été synchronisées avec succès.</p>
            </div>
          )}

          {simScreen === 'incident' && (
            <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col p-8 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-10">
                <h4 className="text-white font-black uppercase text-sm flex items-center gap-3"><ShieldAlert className="text-rose-500" /> Alerte Terrain</h4>
                <button onClick={() => setSimScreen('home')} className="text-slate-500 hover:text-white p-2"><X size={24} /></button>
              </div>
              <textarea 
                className="w-full h-48 bg-slate-800 text-white p-6 rounded-[2.5rem] text-xs font-medium border border-slate-700 outline-none mb-6 focus:border-rose-500 transition-all resize-none shadow-inner" 
                placeholder="Expliquez l'incident (ex: code QR illisible, sac endommagé...)"
              ></textarea>
              <button 
                onClick={() => { alert('Rapport d\'incident envoyé.'); setSimScreen('home'); }} 
                className="w-full py-5 bg-rose-500 text-white rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-transform"
              >
                Signaler au Superviseur
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM NAV BAR */}
        <div className="h-20 bg-white border-t border-slate-100 flex justify-around items-center px-4 shrink-0 relative z-20">
          <button onClick={() => setSimScreen('home')} className={`p-3 transition-all rounded-2xl ${simScreen === 'home' ? 'bg-emerald-50 text-[#006B3D]' : 'text-slate-300'}`}>
            <Home size={22} />
          </button>
          <button onClick={() => setSimScreen('audit')} className={`p-3 transition-all rounded-2xl ${simScreen === 'audit' ? 'bg-emerald-50 text-[#006B3D]' : 'text-slate-300'}`}>
            <ShieldCheck size={22} />
          </button>
          <button onClick={() => setSimScreen('incident')} className={`p-3 transition-all rounded-2xl ${simScreen === 'incident' ? 'bg-emerald-100 text-rose-500' : 'text-slate-300'}`}>
            <ShieldAlert size={22} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-900 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default MobileSimulator;
