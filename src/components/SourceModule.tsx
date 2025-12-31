
import React from 'react';
import { 
  Package, TrendingUp, AlertTriangle, ArrowRight, 
  ShoppingCart, Filter, Download, MoreHorizontal,
  Plus, CheckCircle2, Clock, Truck
} from 'lucide-react';
import { InputStock, PurchaseOrder } from '../types';

const MOCK_STOCK: InputStock[] = [
  { id: '1', name: 'Urée 46%', category: 'Engrais', quantity: 1250, unit: 'Sacs', status: 'En Stock' },
  { id: '2', name: 'NPK 15-15-15', category: 'Engrais', quantity: 450, unit: 'Sacs', status: 'Critique' },
  { id: '3', name: 'Semences Pioneer P30', category: 'Semence', quantity: 85, unit: 'Doses', status: 'Rupture' },
  { id: '4', name: 'Glyphosate 360', category: 'Produit Phyto', quantity: 200, unit: 'Litres', status: 'En Stock' },
];

const MOCK_ORDERS: PurchaseOrder[] = [
  { id: 'ORD-2025-001', provider: 'Senchim SA', date: '2025-08-10', amount: 4500000, status: 'Livré' },
  { id: 'ORD-2025-002', provider: 'Sodefitex', date: '2025-08-15', amount: 1200000, status: 'En cours' },
  { id: 'ORD-2025-003', provider: 'Tropicasa', date: '2025-08-18', amount: 890000, status: 'En cours' },
];

interface Props {
  view: string;
}

const SourceModule: React.FC<Props> = ({ view }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header du Module */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A2B3D]">Gestion du Sourcing</h1>
          <p className="text-slate-400 font-medium">Contrôle des stocks et approvisionnement des producteurs</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50">
            <Download size={18} /> Exporter
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#006B3D] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#006B3D]/20 hover:scale-105 transition-transform">
            <Plus size={18} /> Nouvelle Commande
          </button>
        </div>
      </div>

      {/* Cartes de Statut Sourcing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SourceStatCard label="Valeur de l'Inventaire" value="65.4M FCFA" trend="+12.5%" icon={<Package />} />
        <SourceStatCard label="Commandes en cours" value="14 Commandes" trend="3 Alertes" icon={<ShoppingCart />} trendColor="text-[#FFCB05]" />
        <SourceStatCard label="Fournisseurs Actifs" value="28 Entités" trend="Top: Senchim" icon={<Truck />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste Inventaire (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-extrabold text-[#1A2B3D]">Stock Intrants</h3>
            <button className="text-slate-400"><Filter size={20} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="px-8 py-4">Article</th>
                  <th className="px-8 py-4">Catégorie</th>
                  <th className="px-8 py-4">Quantité</th>
                  <th className="px-8 py-4">Statut</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_STOCK.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="font-bold text-[#1A2B3D]">{item.name}</span>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">REF-{item.id}00X</p>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">{item.category}</td>
                    <td className="px-8 py-5">
                      <span className="font-black text-slate-900">{item.quantity}</span>
                      <span className="ml-1 text-[10px] text-slate-400 font-bold">{item.unit}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        item.status === 'En Stock' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'Critique' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-300 transition-all"><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historique Commandes (1/3) */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
             <h3 className="text-xl font-extrabold text-[#1A2B3D]">Commandes</h3>
             <TrendingUp size={20} className="text-[#006B3D]" />
          </div>
          <div className="flex-1 p-6 space-y-4">
             {MOCK_ORDERS.map(order => (
               <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#006B3D]/30 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#006B3D] group-hover:text-white transition-all">
                      <ShoppingCart size={18} />
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                      order.status === 'Livré' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#1A2B3D] truncate">{order.provider}</h4>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{order.id}</span>
                    <span className="font-black text-[#006B3D]">{order.amount.toLocaleString()} <small className="text-[10px]">FCFA</small></span>
                  </div>
               </div>
             ))}
          </div>
          <div className="p-6 border-t border-slate-50">
            <button className="w-full text-center text-sm font-bold text-[#006B3D] hover:underline flex items-center justify-center gap-2">
              Voir tout l'historique <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SourceStatCard = ({ label, value, trend, icon, trendColor = 'text-emerald-500' }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex items-start gap-5">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-[#006B3D] group-hover:text-white transition-all">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-[#1A2B3D] leading-none mb-2">{value}</p>
      <span className={`text-[11px] font-bold ${trendColor}`}>{trend}</span>
    </div>
  </div>
);

export default SourceModule;
