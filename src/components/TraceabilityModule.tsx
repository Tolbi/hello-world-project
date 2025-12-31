
import React, { useState, useCallback } from 'react';
import { Producer, WorkflowTemplate, QRCodeObj } from '../types';
import WorkflowBuilder from './traceability/WorkflowBuilder';
import QrManager from './traceability/QrManager';
import FluxViz from './traceability/FluxViz';
import MobileSimulator from './traceability/MobileSimulator';
import AuditView from './traceability/AuditView';

const INITIAL_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'WF-2025-GLOBAL',
    name: 'Chaîne de Valeur Maïs 2025',
    status: 'active',
    updatedAt: '2025-08-15',
    steps: [
      {
        id: 'step-id',
        name: '1. Identification & Enrôlement',
        fields: [
          { id: 'f_id_prod', label: 'Nom du Producteur', type: 'producer_select', required: true },
          { id: 'f_id_bulk', label: 'Scan Rafale (Nouveaux Sacs)', type: 'qr_bulk_scan', required: true },
          { id: 'f_id_gps', label: 'Point GPS Distribution', type: 'gps', required: true }
        ]
      },
      {
        id: 'step-transport',
        name: '2. Transport & Logistique',
        fields: [
          { id: 'f_tra_driver', label: 'Nom du Chauffeur', type: 'text', required: true },
          { id: 'f_tra_plate', label: 'Matricule Camion', type: 'text', required: true },
          { id: 'f_tra_bulk', label: 'Vérification Chargement (Rafale)', type: 'qr_bulk_scan', required: true },
          { id: 'f_tra_total', label: 'Poids Total Chargement', type: 'number', required: true },
          { id: 'f_tra_sheet', label: 'N° Fiche de Lot', type: 'text', required: true }
        ]
      },
      {
        id: 'step-reception',
        name: '3. Réception Usine',
        fields: [
          { id: 'f_rec_bulk', label: 'Scan Réception Usine (Rafale)', type: 'qr_bulk_scan', required: true },
          { id: 'f_rec_qual', label: 'Qualité (A/B/C)', type: 'text', required: true },
          { id: 'f_rec_name', label: 'Nom du Réceptionnaire', type: 'text', required: true },
          { id: 'f_rec_weight', label: 'Poids Réceptionné', type: 'number', required: true }
        ]
      }
    ]
  }
];

const INITIAL_QR_DATA: QRCodeObj[] = Array.from({ length: 45 }).map((_, i) => {
  const isDemo = i === 0;
  return {
    id: `${i + 1}`,
    code: `LOT-2025-${(i + 1).toString().padStart(5, '0')}`,
    batchId: 'B-01',
    status: isDemo ? 'assigned' : 'free',
    assigneeName: isDemo ? 'THIERNO Diallo' : undefined,
    date: '2025-08-15',
    history: isDemo ? [
      {
        step: '1. Identification & Enrôlement',
        date: '2025-08-15 10:30',
        agent: 'Moussa (Agent Mobile)',
        details: { f_id_prod: 'THIERNO Diallo', f_id_gps: '12.9754,-14.1888', village: 'Awataba' }
      },
      {
        step: '2. Transport & Logistique',
        date: '2025-08-16 14:15',
        agent: 'Abdou (Contrôleur)',
        details: { f_tra_driver: 'Bakary Sagna', f_tra_plate: 'AA-123-ZZ', f_tra_total: '2400', f_tra_sheet: 'LOT-X-098' }
      },
      {
        step: '3. Réception Usine',
        date: '2025-08-17 09:00',
        agent: 'Fatou (Chef Usine)',
        details: { f_rec_qual: 'Qualité A (Premium)', f_rec_name: 'Fatou Ndiaye', f_rec_weight: '51.5' }
      }
    ] : []
  };
});

interface Props {
  view: string;
  producers: Producer[];
}

const TraceabilityModule: React.FC<Props> = ({ view, producers }) => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(INITIAL_WORKFLOWS);
  const [qrList, setQrList] = useState<QRCodeObj[]>(INITIAL_QR_DATA);

  const handleSaveWorkflow = useCallback((newWorkflows: WorkflowTemplate[]) => {
    setWorkflows(newWorkflows);
  }, []);

  const handleSimSubmit = useCallback((qrIds: string[], prodId: string, metadata: any) => {
    setQrList(prev => prev.map(q => {
      if (qrIds.includes(q.id)) {
        const producer = producers.find(p => p.id === prodId);
        const prodName = producer?.name || metadata.f_tra_driver || metadata.f_rec_name || 'Agent Terrain';
        
        const activeWF = workflows[0];
        const step = activeWF.steps.find(s => s.fields.some(f => metadata[f.id] !== undefined)) || activeWF.steps[0];

        const newHistory = [...(q.history || []), {
          step: step.name,
          date: new Date().toLocaleString('fr-FR'),
          agent: 'Agent Mobile (Moussa)',
          details: { ...metadata, producer: prodName }
        }];

        return {
          ...q,
          status: 'assigned',
          assigneeId: prodId,
          assigneeType: 'producer',
          assigneeName: prodName,
          assignmentMethod: 'mobile',
          assignedBy: 'Agent Mobile',
          assignedAt: new Date().toISOString(),
          history: newHistory
        } as QRCodeObj;
      }
      return q;
    }));
  }, [producers, workflows]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 pb-2">
      <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        
        {view === 'workflow' && (
          <WorkflowBuilder 
            workflows={workflows} 
            onSave={handleSaveWorkflow} 
          />
        )}

        {view === 'lots' && (
          <QrManager 
            qrList={qrList} 
            setQrList={setQrList} 
            producers={producers} 
          />
        )}

        {view === 'audit' && (
          <AuditView 
            qrList={qrList} 
            producers={producers} 
          />
        )}

        {view === 'viz' && (
          <FluxViz workflows={workflows} />
        )}

        {view === 'simulator' && (
          <MobileSimulator 
            producers={producers} 
            qrList={qrList} 
            activeWorkflows={workflows.filter(w => w.status === 'active')}
            onSimSubmit={handleSimSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default TraceabilityModule;
