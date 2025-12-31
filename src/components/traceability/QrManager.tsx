import React, { useState, useMemo } from 'react';
import { 
  QrCode, Plus, Trash2, Edit, CheckSquare, Square, 
  FileDown, Download, Search, Filter, ChevronLeft, 
  ChevronRight, X, Save, Smartphone, MousePointer, 
  FileSpreadsheet, User, Users, UserPlus, AlertCircle, 
  Loader2, Clock, UserCheck
} from 'lucide-react';
import { QRCodeObj, Producer, Entity, AssigneeType, QRStatus, AssignmentMethod } from '../../types';
import { jsPDF } from "jspdf";
import { toDataURL } from "qrcode";
import saveAs from "file-saver";

const MOCK_ENTITIES: Entity[] = [
  { id: 'E-01', name: 'COOPÉRATIVE ANAMBÉ NORD', type: 'Coopérative' },
  { id: 'E-02', name: 'GIE PRODUCTEURS DE MAÏS', type: 'GIE' },
  { id: 'E-03', name: 'AGRO-INDUSTRIE DU SUD', type: 'Industriel' },
];

interface Props {
  qrList: QRCodeObj[];
  setQrList: React.Dispatch<React.SetStateAction<QRCodeObj[]>>;
  producers: Producer[];
}

const QrManager: React.FC<Props> = ({ qrList, setQrList, producers }) => {
  const [qrPrefix, setQrPrefix] = useState('LOT-2025-');
  const [qrQty, setQrQty] = useState(5);
  const [assignMode, setAssignMode] = useState<'manual' | 'import'>('manual');
  const [targetType, setTargetType] = useState<AssigneeType>('producer');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilterStatus, setTableFilterStatus] = useState<'all' | 'free' | 'assigned'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [editingQr, setEditingQr] = useState<QRCodeObj | null>(null);
  const itemsPerPage = 10;

  const generateCodes = () => {
    const batchId = `B-${Math.floor(Math.random() * 1000)}`;
    const newCodes: QRCodeObj[] = [];
    let maxSeq = 0;
    qrList.forEach(item => {
      if (item.code.startsWith(qrPrefix)) {
        const num = parseInt(item.code.replace(qrPrefix, ''), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    for (let i = 1; i <= qrQty; i++) {
      newCodes.push({
        id: Math.random().toString(36).substr(2, 9),
        code: `${qrPrefix}${(maxSeq + i).toString().padStart(5, '0')}`,
        batchId, status: 'free', date: new Date().toISOString().split('T')[0]
      });
    }
    setQrList([...newCodes, ...qrList]);
  };

  const handleManualAssign = () => {
    if (!selectedBeneficiaryId) return;
    let bName = targetType === 'producer' ? producers.find(x => x.id === selectedBeneficiaryId)?.name : MOCK_ENTITIES.find(x => x.id === selectedBeneficiaryId)?.name;
    setQrList(prev => prev.map(qr => (selectedIds.has(qr.id) && qr.status === 'free') ? { ...qr, status: 'assigned', assigneeId: selectedBeneficiaryId, assigneeType: targetType, assigneeName: bName, assignmentMethod: 'manual', assignedBy: 'Admin', assignedAt: new Date().toISOString() } : qr));
    setSelectedIds(new Set());
  };

  const handleExportPDF = async () => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let x = 10, y = 10;
      const selectedQrs = qrList.filter(q => selectedIds.has(q.id));
      for (let i = 0; i < selectedQrs.length; i++) {
        const dataUrl = await toDataURL(selectedQrs[i].code, { width: 100, margin: 1 });
        if (i > 0 && i % 12 === 0) { doc.addPage(); x = 10; y = 10; }
        doc.addImage(dataUrl, 'PNG', x, y, 50, 50);
        doc.setFontSize(10); doc.text(selectedQrs[i].code, x + 5, y + 55);
        x += 60; if (x > 150) { x = 10; y += 70; }
      }
      doc.save(`qrcodes-${Date.now()}.pdf`);
    } finally { setIsExporting(false); }
  };

  const filteredQrList = useMemo(() => qrList.filter(qr => {
    const matchSearch = qr.code.toLowerCase().includes(tableSearch.toLowerCase()) || (qr.assigneeName?.toLowerCase() || '').includes(tableSearch.toLowerCase());
    const matchStatus = tableFilterStatus === 'all' || qr.status === tableFilterStatus;
    return matchSearch && matchStatus;
  }), [qrList, tableSearch, tableFilterStatus]);

  const paginatedQrList = useMemo(() => filteredQrList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredQrList, currentPage]);

  return (
    <div className="flex flex-col xl:flex-row h-full animate-in fade-in duration-300">
      <div className="w-full xl:w-[420px] border-r border-slate-100 flex flex-col bg-slate-50/30 overflow-y-auto">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-[#006B3D] text-white rounded-xl flex items-center justify-center shadow-lg"><QrCode size={18} /></div><div><h3 className="text-sm font-black text-slate-900 uppercase">Générateur</h3></div></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block">Préfixe</label><input type="text" value={qrPrefix} onChange={(e) => setQrPrefix(e.target.value)} className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-[10px] font-bold outline-none" /></div>
              <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block">Quantité</label><input type="number" value={qrQty} onChange={(e) => setQrQty(parseInt(e.target.value))} className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-[10px] font-bold outline-none" /></div>
            </div>
            <button onClick={generateCodes} className="w-full bg-[#006B3D] text-white py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl hover:bg-[#005a32]">Créer le lot</button>
          </div>
        </div>
        <div className="p-8 flex-1">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-sm"><UserPlus size={18} /></div><div><h3 className="text-sm font-black text-slate-900 uppercase">Attribution</h3></div></div>
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setAssignMode('manual')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${assignMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Manuel</button>
            <button onClick={() => setAssignMode('import')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${assignMode === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Import Excel</button>
          </div>
          {assignMode === 'manual' ? (
            <div className="space-y-4">
              <select value={targetType} onChange={(e) => setTargetType(e.target.value as AssigneeType)} className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-[10px] font-bold outline-none"><option value="producer">Producteur Individuel</option><option value="entity">Entité (GIE / Coop)</option></select>
              <select value={selectedBeneficiaryId} onChange={(e) => setSelectedBeneficiaryId(e.target.value)} className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-[10px] font-bold outline-none"><option value="">-- Sélectionner --</option>{targetType === 'producer' ? producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : MOCK_ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
              <button onClick={handleManualAssign} disabled={selectedIds.size === 0} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50">Valider ({selectedIds.size})</button>
            </div>
          ) : <div className="text-center py-10 opacity-30 uppercase font-black text-[9px]">Fonctionnalité d'import bientôt disponible</div>}
        </div>
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-white flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-900 uppercase">Registre des Codes</h3>
          <div className="flex gap-2">
            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[#006B3D] text-white rounded-xl text-[9px] font-black shadow-lg hover:bg-slate-900 transition-all">{isExporting ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14}/>} Telecharger codes</button>
          </div>
        </div>
        <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 mb-4"><div className="flex-1 relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Rechercher..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"/></div><select value={tableFilterStatus} onChange={(e) => setTableFilterStatus(e.target.value as any)} className="bg-transparent text-xs font-black uppercase text-slate-600 outline-none"><option value="all">Tout</option><option value="free">Libre</option><option value="assigned">Assigné</option></select></div>
        <div className="border border-slate-100 rounded-[24px] flex-1 flex flex-col overflow-hidden bg-white shadow-sm relative">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest sticky top-0 z-10 shadow-sm"><tr><th className="p-4 w-12 text-center bg-slate-50"><button onClick={() => selectedIds.size === paginatedQrList.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(paginatedQrList.map(q => q.id)))}>{selectedIds.size > 0 ? <CheckSquare size={16} className="text-[#006B3D]"/> : <Square size={16}/>}</button></th><th className="p-4 bg-slate-50">Code QR</th><th className="p-4 bg-slate-50">Statut</th><th className="p-4 bg-slate-50">Affecté à</th><th className="p-4 bg-slate-50 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{paginatedQrList.map(qr => (<tr key={qr.id} className={`hover:bg-slate-50/50 transition-colors text-[11px] font-medium text-slate-600 ${selectedIds.has(qr.id) ? 'bg-emerald-50/30' : ''}`}><td className="p-4 text-center"><button onClick={() => { const n = new Set(selectedIds); if(n.has(qr.id)) n.delete(qr.id); else n.add(qr.id); setSelectedIds(n); }}>{selectedIds.has(qr.id) ? <CheckSquare size={16} className="text-[#006B3D]"/> : <Square size={16} className="text-slate-300"/>}</button></td><td className="p-4"><span className="font-black text-slate-900">{qr.code}</span></td><td className="p-4"><span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${qr.status === 'assigned' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{qr.status === 'assigned' ? 'Assigné' : 'Libre'}</span></td><td className="p-4">{qr.assigneeName || '--'}</td><td className="p-4 text-right"><button onClick={() => setQrList(qrList.filter(q => q.id !== qr.id))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></td></tr>))}</tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">Page {currentPage} <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-1 border rounded"><ChevronLeft size={14}/></button><button onClick={() => setCurrentPage(p => p + 1)} className="p-1 border rounded"><ChevronRight size={14}/></button></div></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QrManager);