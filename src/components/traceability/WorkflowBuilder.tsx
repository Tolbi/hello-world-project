
import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, Save, Upload, Download, ArrowLeft, 
  GripVertical, AlignLeft, Hash, Calendar, User, 
  QrCode, MapPin, Camera, CheckSquare, GitGraph, Eye, EyeOff
} from 'lucide-react';
import { WorkflowTemplate, WorkflowStep, WorkflowField, FieldType } from '../../types';

interface Props {
  workflows: WorkflowTemplate[];
  onSave: (workflows: WorkflowTemplate[]) => void;
}

// Fix: Added missing qr_bulk_scan to FIELD_TYPES_CONFIG to satisfy the Record<FieldType, ...> requirement
const FIELD_TYPES_CONFIG: Record<FieldType, { label: string, icon: any }> = {
  text: { label: 'Texte court', icon: AlignLeft },
  number: { label: 'Nombre', icon: Hash },
  date: { label: 'Date', icon: Calendar },
  producer_select: { label: 'Sélecteur Producteur', icon: User },
  qr_scan: { label: 'Scan QR Sac', icon: QrCode },
  qr_bulk_scan: { label: 'Scan Rafale (Sacs)', icon: QrCode },
  gps: { label: 'Géolocalisation', icon: MapPin },
  photo: { label: 'Photo / Caméra', icon: Camera },
};

const WorkflowFieldAdder = ({ onAdd }: { onAdd: (f: WorkflowField) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(true);

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({ id: `f-${Date.now()}`, label, type, required });
    setLabel('');
    setIsOpen(false);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="w-full py-4 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase hover:border-[#006B3D] hover:text-[#006B3D] hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2">
      <Plus size={14} /> Ajouter un champ
    </button>
  );

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Label</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Poids du sac" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#006B3D]" autoFocus />
        </div>
        <div className="w-1/3">
          <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as FieldType)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer">
            {Object.entries(FIELD_TYPES_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${required ? 'bg-[#006B3D] border-[#006B3D]' : 'bg-white border-slate-300'}`}>
            {required && <CheckSquare size={10} className="text-white" />}
          </div>
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="hidden" />
          <span className="text-[9px] font-black text-slate-500 uppercase">Obligatoire</span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase">Annuler</button>
          <button onClick={handleAdd} className="px-4 py-1.5 bg-[#006B3D] text-white rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-[#005a32] transition-all">Ajouter</button>
        </div>
      </div>
    </div>
  );
};

const WorkflowBuilder: React.FC<Props> = ({ workflows, onSave }) => {
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateWorkflow = () => {
    setEditingWorkflow({ id: `WF-${Date.now()}`, name: 'Nouveau Processus', status: 'draft', steps: [], updatedAt: new Date().toISOString().split('T')[0] });
  };

  const handleEditWorkflow = (wf: WorkflowTemplate) => setEditingWorkflow(JSON.parse(JSON.stringify(wf)));

  const handleFinalSave = () => {
    if (!editingWorkflow) return;
    const existingIdx = workflows.findIndex(w => w.id === editingWorkflow.id);
    const updated = existingIdx >= 0 ? workflows.map(w => w.id === editingWorkflow.id ? editingWorkflow : w) : [...workflows, editingWorkflow];
    onSave(updated);
    setEditingWorkflow(null);
  };

  const handleImportWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.steps) throw new Error();
        onSave([...workflows, { ...parsed, id: `WF-${Date.now()}`, name: `${parsed.name} (Import)`, status: 'draft', updatedAt: new Date().toISOString().split('T')[0] }]);
      } catch (err) { alert("Format invalide."); }
    };
    reader.readAsText(file);
  };

  if (editingWorkflow) return (
    <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => setEditingWorkflow(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><ArrowLeft size={20} /></button>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nom du workflow</label>
            <input type="text" value={editingWorkflow.name} onChange={(e) => setEditingWorkflow({...editingWorkflow, name: e.target.value})} className="text-xl font-black text-slate-900 bg-transparent outline-none placeholder:text-slate-300 w-96 border-b-2 border-transparent focus:border-[#006B3D] hover:border-slate-200 transition-all" placeholder="Ex: Collecte Coton 2025" autoFocus />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditingWorkflow({...editingWorkflow, status: editingWorkflow.status === 'active' ? 'draft' : 'active'})} className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${editingWorkflow.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {editingWorkflow.status === 'active' ? <Eye size={14} /> : <EyeOff size={14} />} {editingWorkflow.status === 'active' ? 'Publié' : 'Brouillon'}
          </button>
          <button onClick={handleFinalSave} className="px-6 py-3 bg-[#006B3D] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-[#005a32] shadow-lg flex items-center gap-2"><Save size={14} /> Sauvegarder</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
        <div className="max-w-3xl mx-auto space-y-8">
          {editingWorkflow.steps.map((step, index) => (
            <div key={step.id} className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md">{index + 1}</div>
                  <input type="text" value={step.name} onChange={(e) => setEditingWorkflow({...editingWorkflow, steps: editingWorkflow.steps.map(s => s.id === step.id ? {...s, name: e.target.value} : s)})} className="bg-transparent font-bold text-slate-900 outline-none w-full placeholder:text-slate-300 text-sm border-b-2 border-transparent focus:border-[#006B3D] transition-all" placeholder="Nom de l'étape" />
                </div>
                <button onClick={() => setEditingWorkflow({...editingWorkflow, steps: editingWorkflow.steps.filter(s => s.id !== step.id)})} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
              <div className="p-6 space-y-3">
                {step.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-[#006B3D]/30 transition-all group">
                    <GripVertical size={16} className="text-slate-200 cursor-move" />
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-[#006B3D]">{React.createElement(FIELD_TYPES_CONFIG[field.type].icon, { size: 18 })}</div>
                    <div className="flex-1"><p className="text-xs font-black text-slate-900">{field.label}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{FIELD_TYPES_CONFIG[field.type].label}</p></div>
                    {field.required && <span className="bg-rose-50 text-rose-500 text-[8px] font-black px-2 py-1 rounded uppercase">Requis</span>}
                    <button onClick={() => setEditingWorkflow({...editingWorkflow, steps: editingWorkflow.steps.map(s => s.id === step.id ? {...s, fields: s.fields.filter(f => f.id !== field.id)} : s)})} className="p-2 text-slate-200 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                ))}
                <WorkflowFieldAdder onAdd={(f) => setEditingWorkflow({...editingWorkflow, steps: editingWorkflow.steps.map(s => s.id === step.id ? {...s, fields: [...s.fields, f]} : s)})} />
              </div>
            </div>
          ))}
          <button onClick={() => setEditingWorkflow({...editingWorkflow, steps: [...editingWorkflow.steps, { id: `step-${Date.now()}`, name: `Étape ${editingWorkflow.steps.length+1}`, fields: [] }]})} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-[24px] text-slate-400 font-black uppercase text-xs hover:border-[#006B3D] hover:text-[#006B3D] transition-all flex items-center justify-center gap-2"><Plus size={16} /> Ajouter une étape</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-slate-50/30 overflow-y-auto custom-scrollbar p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Modèles de Collecte</h3><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Gérez vos processus de traçabilité</p></div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportWorkflow} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase hover:border-[#006B3D] hover:text-[#006B3D] transition-all group shadow-sm"><Upload size={16} /> Importer Modèle</button>
          <button onClick={handleCreateWorkflow} className="flex items-center gap-3 px-6 py-4 bg-[#006B3D] text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-[#005a32] transition-all"><Plus size={16} /> Nouveau Modèle</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map(wf => (
          <div key={wf.id} className="bg-white border border-slate-200 rounded-[32px] p-8 relative overflow-hidden group hover:border-[#006B3D]/30 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><GitGraph size={100} /></div>
            <div className="flex justify-between items-center mb-6">
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${wf.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{wf.status === 'active' ? 'Actif' : 'Brouillon'}</span>
              <span className="text-[9px] font-black text-slate-300">#{wf.id.split('-')[1]}</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2 pr-8">{wf.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-8">{wf.steps.length} Étapes • MAJ {wf.updatedAt}</p>
            <div className="space-y-3 relative z-10">
              {wf.steps.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex items-center gap-3"><div className="w-6 h-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[#006B3D] font-black text-[9px]">{idx + 1}</div><span className="text-[10px] font-bold uppercase text-slate-600 truncate">{step.name}</span></div>
              ))}
            </div>
            <button onClick={() => handleEditWorkflow(wf)} className="w-full mt-8 bg-slate-50 border border-slate-100 py-3.5 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm">Configurer le workflow</button>
          </div>
        ))}
        <button onClick={handleCreateWorkflow} className="border-4 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-12 gap-4 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all group">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-[#006B3D] group-hover:text-white shadow-sm"><Plus size={32}/></div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#006B3D]">Créer un modèle</p>
        </button>
      </div>
    </div>
  );
};

export default React.memo(WorkflowBuilder);
