import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import { Activity, User, Package, Truck, Factory, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { WorkflowTemplate } from '../../types';

const STATIC_VIZ_DATA: Record<string, { nodes: Node[], edges: Edge[] }> = {
  'coton-2025': {
    nodes: [
      { id: 'v1', type: 'custom', position: { x: 0, y: 150 }, data: { label: 'CHAMPS', type: 'Origine', icon: <User size={14}/>, detail: 'Producteurs Enrôlés', count: 1420, alerts: 0, color: '#3b82f6', textColor: 'text-blue-500' } },
      { id: 'v2', type: 'custom', position: { x: 300, y: 150 }, data: { label: 'COLLECTE', type: 'Opération', icon: <Package size={14}/>, detail: 'Sacs Pesés', count: 8560, alerts: 12, color: '#FFCB05', textColor: 'text-amber-600' } },
      { id: 'v3', type: 'custom', position: { x: 600, y: 150 }, data: { label: 'TRANSPORT', type: 'Logistique', icon: <Truck size={14}/>, detail: 'Camions en Transit', count: 45, alerts: 3, color: '#10b981', textColor: 'text-emerald-500' } },
      { id: 'v4', type: 'custom', position: { x: 900, y: 150 }, data: { label: 'USINE', type: 'Destination', icon: <Factory size={14}/>, detail: 'Réceptionés', count: 42, alerts: 0, color: '#0f172a', textColor: 'text-slate-900' } }
    ],
    edges: [
      { id: 'e1-2', source: 'v1', target: 'v2', animated: true, style: { strokeWidth: 3, stroke: '#e2e8f0' }, label: 'Flux Récolte' },
      { id: 'e2-3', source: 'v2', target: 'v3', animated: true, style: { strokeWidth: 3, stroke: '#FFCB05' }, label: 'Chargement' },
      { id: 'e3-4', source: 'v3', target: 'v4', animated: true, style: { strokeWidth: 3, stroke: '#006B3D' }, label: 'Livraison' }
    ]
  }
};

const CustomNode = ({ data }: any) => (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[200px] border-l-4 transition-transform hover:scale-105" style={{borderLeftColor: data.color || '#006B3D'}}>
    <div className="absolute -top-3 -right-3 flex gap-1">
      {data.alerts > 0 && <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md animate-pulse flex items-center gap-1"><AlertTriangle size={10} /> {data.alerts}</div>}
      <div className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md">{data.count?.toLocaleString()}</div>
    </div>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-300 border-2 border-white" />
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl bg-slate-50 ${data.textColor || 'text-[#006B3D]'}`}>{data.icon}</div>
      <div><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{data.type}</p><h4 className="text-xs font-black text-slate-900 uppercase truncate max-w-[120px]">{data.label}</h4></div>
    </div>
    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex justify-between items-center"><p className="text-[9px] font-bold text-slate-500 leading-tight">{data.detail}</p><ChevronRight size={12} className="text-slate-300" /></div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-[#006B3D] border-2 border-white" />
  </div>
);

const nodeTypes = { custom: CustomNode };

interface Props { workflows: WorkflowTemplate[]; }

const FluxViz: React.FC<Props> = ({ workflows }) => {
  const [vizWorkflow, setVizWorkflow] = useState<string>('coton-2025');
  const [selectedStageNode, setSelectedStageNode] = useState<any | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(STATIC_VIZ_DATA['coton-2025'].nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(STATIC_VIZ_DATA['coton-2025'].edges);

  useEffect(() => {
    if (STATIC_VIZ_DATA[vizWorkflow]) {
      setNodes(STATIC_VIZ_DATA[vizWorkflow].nodes); setEdges(STATIC_VIZ_DATA[vizWorkflow].edges);
    } else {
      const wf = workflows.find(w => w.id === vizWorkflow);
      if (wf) {
        const dNodes = wf.steps.map((s, i) => ({ id: s.id, type: 'custom', position: { x: i * 320, y: 150 }, data: { label: s.name, type: `ÉTAPE ${i + 1}`, icon: <Activity size={14}/>, detail: `${s.fields.length} champs`, count: Math.floor(Math.random() * 500) + 10, alerts: 0, color: '#3b82f6', textColor: 'text-blue-500' } }));
        const dEdges = wf.steps.slice(0, -1).map((s, i) => ({ id: `e-${s.id}-${wf.steps[i+1].id}`, source: s.id, target: wf.steps[i+1].id, animated: true, style: { strokeWidth: 3, stroke: '#cbd5e1' } }));
        setNodes(dNodes); setEdges(dEdges);
      }
    }
  }, [vizWorkflow, workflows, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative bg-slate-50/30 flex flex-col animate-in fade-in duration-300">
      <div className="px-8 py-6 bg-white border-b border-slate-200 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center text-[#FFCB05] shadow-lg"><Activity size={24} /></div>
          <div><h3 className="text-lg font-black text-slate-900 uppercase leading-none">Pilotage des Flux</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supervision Temps Réel</p></div>
          <select value={vizWorkflow} onChange={(e) => setVizWorkflow(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-900 font-black text-xs uppercase pl-5 pr-10 py-3 rounded-xl cursor-pointer ml-4">
            <option value="coton-2025">Coton 2025 (Démo)</option>
            {workflows.filter(w => w.status === 'active').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} onNodeClick={(_, n) => setSelectedStageNode(n)} fitView>
          <Background color="#cbd5e1" gap={32} size={1} />
          <Controls className="bg-white border-slate-200 shadow-xl rounded-2xl m-4" />
        </ReactFlow>
        {selectedStageNode && (
          <div className="absolute top-0 right-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-black text-slate-900 uppercase">{selectedStageNode.data.label}</h3>
                <button onClick={() => setSelectedStageNode(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Volume Traité</p><p className="text-2xl font-black text-slate-900">{selectedStageNode.data.count?.toLocaleString()}</p></div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar"><h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Flux des 24h</h4><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-900 flex justify-between"><span>LOT-2025-{1000+i}</span><span className="text-slate-300">{new Date().toLocaleTimeString()}</span></div>)}</div></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FluxViz);