
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Producer, UnionName, RasterFile, LayerType, KnowledgeFile } from '../types';
import { 
  Upload, FileJson, Database, FileType, 
  Sparkles, BookOpen, Trash2, FileUp, Settings,
  CheckCircle, Save, Link2, Download, AlertCircle, HelpCircle, RefreshCcw
} from 'lucide-react';

interface Props {
  producers: Producer[];
  onUpdateProducers: (producers: Producer[]) => void;
  rasterFiles: File[]; // Ajout de la prop pour la synchronisation
  onUpdateRasterFiles: (files: File[]) => void;
  knowledgeBase: KnowledgeFile[];
  onUpdateKnowledgeBase: (files: KnowledgeFile[]) => void;
  systemInstruction: string;
  onUpdateSystemInstruction: (instruction: string) => void;
}

const AdminPanel: React.FC<Props> = ({ 
  producers, onUpdateProducers, 
  rasterFiles, onUpdateRasterFiles,
  knowledgeBase, onUpdateKnowledgeBase,
  systemInstruction, onUpdateSystemInstruction
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'rasters' | 'manage' | 'config-ia'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectedProducers, setDetectedProducers] = useState<Producer[]>([]);
  const [configSavedStatus, setConfigSavedStatus] = useState(false);
  
  const geojsonInputRef = useRef<HTMLInputElement>(null);
  const rasterInputRef = useRef<HTMLInputElement>(null);
  const knowledgeInputRef = useRef<HTMLInputElement>(null);

  const normalizeString = (str: string) => {
    return (str || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9]/g, "") 
      .trim();
  };

  // Dérivation de la liste des rasters depuis les fichiers réels passés en props
  const currentRasterList = useMemo(() => {
    return rasterFiles.map((file: any) => {
      const cleanName = file.name.replace(/\.(tif|tiff)$/i, '');
      const parts = cleanName.split(/[_\s]+/);
      
      // Détection du type
      let type: LayerType | 'unknown' = 'unknown';
      const nameLower = file.name.toLowerCase();
      if (['density', 'densite', 'semis'].some(k => nameLower.includes(k))) type = 'density';
      else if (['yield', 'rendement', 'prod', 'tonnes'].some(k => nameLower.includes(k))) type = 'yield';
      else if (['fertility', 'nitrogen', 'azote', 'vrt', 'application', 'fertilite'].some(k => nameLower.includes(k))) type = 'fertility';

      // Vérification du lien avec un producteur existant
      const isLinked = producers.some(p => {
        const pNameNorm = normalizeString(p.name);
        const pIdStr = String(p.id);
        return nameLower.includes(pIdStr) || normalizeString(file.name).includes(pNameNorm);
      });

      return {
        name: file.name,
        type,
        status: isLinked ? 'linked' : 'orphan',
        size: file.size
      };
    });
  }, [rasterFiles, producers]);

  const downloadGeoJSONTemplate = () => {
    const template = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "3731",
            "NOM & PRENOM": "Nom du Producteur",
            union: "UNION SECTEUR 1&2",
            VILLAGES: "Nom du Village",
            SURFACE: 1.5,
            yield_act: 12.5,
            density: 65000,
            fertility: 80
          },
          geometry: {
            type: "Polygon",
            coordinates: [[[-14.189, 12.975], [-14.188, 12.975], [-14.188, 12.976], [-14.189, 12.976], [-14.189, 12.975]]]
          }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_producteurs_tolbi.geojson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulateProgress = (callback: () => void) => {
    setUploadProgress(0);
    setIsProcessing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 25;
      if (current >= 100) {
        setUploadProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setUploadProgress(0);
          callback();
        }, 400);
      } else {
        setUploadProgress(current);
      }
    }, 100);
  };

  const handleKnowledgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    simulateProgress(() => {
      const newDocs: KnowledgeFile[] = [];
      // Fix: Cast Array.from(files) to any[] to resolve 'unknown' inference error
      const pdfFiles = (Array.from(files) as any[]).filter(f => f.type === 'application/pdf');
      
      // Fix: Cast file to any in forEach to satisfy property access and readAsDataURL expectations
      pdfFiles.forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newDocs.push({
            name: file.name,
            data: event.target?.result as string,
            mimeType: file.type
          });
          if (newDocs.length === pdfFiles.length) {
            onUpdateKnowledgeBase([...knowledgeBase, ...newDocs]);
          }
        };
        // Fix: 'file' as any resolves the Blob assignment error
        reader.readAsDataURL(file);
      });
      if (knowledgeInputRef.current) knowledgeInputRef.current.value = '';
    });
  };

  const handleGeoJSONUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    simulateProgress(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const json = JSON.parse(content);
          const features = Array.isArray(json.features) ? json.features : (json.type === 'Feature' ? [json] : []);
          const extracted: Producer[] = features.map((f: any, index: number) => {
            const props = f.properties || {};
            const yieldActual = Number(props['yield_mean_t_ha'] || props.yield_act || props.yield || 0);
            return {
              id: String(props.id || props.ID_PARCELLE || props.producer_id || `parc-${index}`).trim(),
              name: (props['NOM & PRENOM'] || props.name || props.producer_name || 'Producteur Inconnu').trim(),
              union: (props.union || 'UNION SECTEUR 1&2') as UnionName,
              parcelId: String(props.parcelId || props.ID_PARCELLE || `P-${index}`).trim(),
              location: [0, 0],
              geometry: f.geometry,
              areaHectares: Number(props.SURFACE || props.area || 1.0),
              areaM2: Number(props.SURFACE_M2 || props.areaM2 || 10000),
              yieldExpected: parseFloat((yieldActual * 1.1).toFixed(2)),
              yieldActual: parseFloat(yieldActual.toFixed(2)),
              productionTonnes: parseFloat((yieldActual * (props.SURFACE || 1.0)).toFixed(2)),
              density: Number(props.density || props.DENSITE || 52000),
              fertilityIndex: Number(props.fertility || props.FERTILITE || 65),
              lastUpdate: new Date().toISOString().split('T')[0],
              village: props['VILLAGES'] || props.village || 'Inconnu',
              phone: props.phone || 'N/A',
              rasters: []
            };
          });
          setDetectedProducers(extracted);
        } catch (err) { alert("Erreur de lecture GeoJSON"); }
        if (geojsonInputRef.current) geojsonInputRef.current.value = '';
      };
      reader.readAsText(file);
    });
  };

  const handleRasterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    simulateProgress(() => {
      const filesArray = Array.from(files);
      // On filtre pour ne pas envoyer de doublons au registre global (par nom de fichier)
      // Fix: Cast f to any to resolve 'unknown' error during property access
      const existingNames = new Set(rasterFiles.map((f: any) => f.name));
      const filteredNewFiles = filesArray.filter((f: any) => !existingNames.has(f.name));
      
      onUpdateRasterFiles(filteredNewFiles);
      if (rasterInputRef.current) rasterInputRef.current.value = '';
    });
  };

  const confirmImport = () => {
    // Logique d'Upsert (Update or Insert)
    // Fix: Explicitly type Map to resolve 'unknown' inference errors during lookup
    const currentProducersMap = new Map<string, Producer>(producers.map(p => [p.id, p]));
    
    detectedProducers.forEach(newP => {
      // Fix: Cast existing value to any to allow spread of potential undefined and property access
      const existing = currentProducersMap.get(newP.id) as any;
      currentProducersMap.set(newP.id, {
        ...(existing || {}),
        ...newP,
        // On préserve les rasters déjà liés si on met à jour un producteur
        rasters: existing?.rasters || []
      } as Producer);
    });

    onUpdateProducers(Array.from(currentProducersMap.values()));
    setDetectedProducers([]);
    alert(`${detectedProducers.length} producteurs ont été intégrés au registre.`);
  };

  const linkRastersToProducers = () => {
    if (rasterFiles.length === 0) {
      alert("Aucun fichier raster n'est présent dans le registre.");
      return;
    }
    
    const updated = producers.map(p => {
      const pNameNorm = normalizeString(p.name);
      const pIdStr = String(p.id);
      
      // Recherche de tous les fichiers qui pourraient correspondre au producteur
      const matchingFiles = rasterFiles.filter((file: any) => {
        const fileNameNorm = normalizeString(file.name);
        return file.name.includes(pIdStr) || fileNameNorm.includes(pNameNorm);
      });

      if (matchingFiles.length === 0) return p;
      
      const existingRasters = p.rasters || [];
      const newRasterNames = matchingFiles.map((f: any) => f.name);
      const uniqueRasters = Array.from(new Set([...existingRasters, ...newRasterNames]));
      
      return { ...p, rasters: uniqueRasters };
    });

    onUpdateProducers(updated);
    alert("L'appairage intelligent a été mis à jour pour l'ensemble du registre.");
  };

  const clearRegister = () => {
    if (confirm("Voulez-vous vraiment vider tout le registre ? Cette action est irréversible.")) {
      onUpdateProducers([]);
      onUpdateRasterFiles([]); // On vide aussi les fichiers
      alert("Le registre a été réinitialisé.");
    }
  };

  const handleSaveIAConfig = () => {
    setConfigSavedStatus(true);
    setTimeout(() => setConfigSavedStatus(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {isProcessing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-[2000]">
          <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_#10b981]" style={{width: `${uploadProgress}%`}}></div>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex bg-slate-50 border-b overflow-x-auto">
          <TabBtn active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={<Upload className="w-4 h-4" />} label="Import SIG" />
          <TabBtn active={activeTab === 'rasters'} onClick={() => setActiveTab('rasters')} icon={<Link2 className="w-4 h-4" />} label={`Appairage (${currentRasterList.length})`} />
          <TabBtn active={activeTab === 'config-ia'} onClick={() => setActiveTab('config-ia')} icon={<Sparkles className="w-4 h-4" />} label="Config TOLBI xAI" />
          <TabBtn active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Database className="w-4 h-4" />} label="Registre" />
        </div>

        <div className="p-10">
          {activeTab === 'upload' && (
            <div className="space-y-10">
              <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[32px] flex items-start gap-6">
                <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg">
                   <HelpCircle size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-xs mb-2">Guide de mise à jour</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-2xl">
                    Le système supporte désormais l'import successif. Charger un nouveau GeoJSON mettra à jour les parcelles existantes (via ID) ou en créera de nouvelles. 
                    Les fichiers TIFF sont conservés dans un registre global pour éviter les pertes lors des changements d'onglets.
                  </p>
                  <div className="flex gap-4 mt-4">
                    <button onClick={downloadGeoJSONTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                      <Download size={14} /> Template GeoJSON
                    </button>
                    <button onClick={clearRegister} className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                      <Trash2 size={14} /> Vider le registre
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <UploadCard 
                  title="Parcelles GeoJSON" desc="Mise à jour ou Ajout" icon={<FileJson className="w-10 h-10" />} 
                  onClick={() => geojsonInputRef.current?.click()} isActive={detectedProducers.length > 0} 
                  input={<input type="file" className="hidden" ref={geojsonInputRef} onChange={handleGeoJSONUpload} accept=".geojson,.json" />} 
                />
                <div>
                  <UploadCard 
                    title="Images TIFF" desc="Ajouter au registre global" icon={<FileType className="w-10 h-10" />} 
                    onClick={() => rasterInputRef.current?.click()} isActive={rasterFiles.length > 0} theme="amber" 
                    input={<input type="file" className="hidden" ref={rasterInputRef} onChange={handleRasterUpload} multiple accept=".tif,.tiff" />} 
                  />
                  <div className="mt-3 flex items-center gap-2 px-4 text-amber-600/60">
                    <AlertCircle size={12} />
                    <p className="text-[8px] font-bold uppercase">{rasterFiles.length} fichiers chargés au total</p>
                  </div>
                </div>
                
                {detectedProducers.length > 0 && (
                  <div className="col-span-full pt-4 animate-in fade-in slide-in-from-top-4">
                    <button onClick={confirmImport} className="w-full bg-slate-900 text-white p-6 rounded-[28px] font-black uppercase text-xs hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-4">
                      <RefreshCcw size={16} /> Fusionner {detectedProducers.length} nouveaux éléments
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rasters' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h4 className="font-black text-slate-900 uppercase text-sm">Synchronisation des Fichiers</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Liez les rasters aux producteurs du registre (ID ou Nom)</p>
                  </div>
                  <button 
                    onClick={linkRastersToProducers} 
                    className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                  >
                    <Link2 size={16} /> Actualiser l'Appairage
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {currentRasterList.map((r, i) => (
                  <div key={i} className={`p-4 rounded-[20px] border transition-all ${r.status === 'linked' ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <FileType size={14} className={r.status === 'linked' ? 'text-emerald-500' : 'text-slate-300'} />
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${r.status === 'linked' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {r.status === 'linked' ? 'Opérationnel' : 'Non lié'}
                      </span>
                    </div>
                    <p className="font-black text-[10px] text-slate-900 truncate">{r.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{r.type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'config-ia' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-slate-900 text-[#FFCB05] rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 uppercase text-xs">Directives TOLBI xAI</h4>
                </div>
                <textarea 
                  value={systemInstruction}
                  onChange={(e) => onUpdateSystemInstruction(e.target.value)}
                  className="w-full h-[250px] bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-xs font-medium text-slate-600 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none resize-none transition-all shadow-inner"
                  placeholder="Définissez le comportement de l'IA..."
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 uppercase text-xs">Base de Connaissances (PDF)</h4>
                </div>

                <div 
                  onClick={() => knowledgeInputRef.current?.click()}
                  className="p-10 border-2 border-dashed border-slate-200 rounded-[28px] flex flex-col items-center justify-center gap-3 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all group"
                >
                  <input type="file" ref={knowledgeInputRef} onChange={handleKnowledgeUpload} className="hidden" accept=".pdf" multiple />
                  <FileUp size={20} className="text-slate-300 group-hover:text-emerald-500" />
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Importer des guides techniques</p>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {knowledgeBase.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-black text-slate-600 truncate max-w-[150px]">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => onUpdateKnowledgeBase(knowledgeBase.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-full pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${knowledgeBase.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                    <CheckCircle size={16} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                    Moteur IA synchronisé.<br/>
                    Documents actifs : <span className="text-slate-900 font-black">{knowledgeBase.length}</span>
                  </p>
                </div>
                <button 
                  onClick={handleSaveIAConfig}
                  className={`flex items-center gap-3 px-10 py-5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl w-full md:w-auto justify-center ${
                    configSavedStatus ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'
                  }`}
                >
                  {configSavedStatus ? (
                    <><CheckCircle size={16} /> Configuration Appliquée</>
                  ) : (
                    <><Save size={16} /> Valider la Configuration</>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-inner">
               <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 font-black uppercase text-slate-400">
                    <tr><th className="px-6 py-4">Producteur</th><th className="px-6 py-4">Village</th><th className="px-6 py-4 text-center">Fichiers liés</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {producers.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-black text-slate-900 uppercase">{p.name}</td>
                        <td className="px-6 py-4 text-slate-400 font-bold uppercase">{p.village}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg font-black ${p.rasters?.length ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {p.rasters?.length || 0} rasters
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${active ? 'bg-white text-emerald-600 border-emerald-600' : 'text-slate-400 hover:text-slate-600 border-transparent'}`}>
    <div className="flex items-center gap-2">{icon} {label}</div>
  </button>
);

const UploadCard = ({ title, desc, icon, onClick, isActive, input, theme }: any) => {
  const activeClass = theme === "amber" ? "border-amber-500 bg-amber-50" : "border-emerald-500 bg-emerald-50";
  return (
    <div onClick={onClick} className={`relative p-8 border-2 border-dashed rounded-[32px] text-center cursor-pointer transition-all ${isActive ? activeClass : 'border-slate-100 hover:border-emerald-300 hover:bg-slate-50'}`}>
      {input}
      <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>{icon}</div>
      <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">{title}</h4>
      <p className="text-[8px] text-slate-300 font-bold mt-1 uppercase">{desc}</p>
    </div>
  );
};

export default AdminPanel;
