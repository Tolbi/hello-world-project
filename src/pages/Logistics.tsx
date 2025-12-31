
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Download, Plus, Filter, AlertTriangle } from "lucide-react";

const Logistics = () => {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      if (data) setInventory(data);
    };
    fetchInventory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-emerald-100 text-emerald-700';
      case 'Critical': return 'bg-amber-100 text-amber-700';
      case 'Out of Stock': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestion Logistique</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Stocks et Approvisionnements</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase shadow-sm hover:bg-slate-50">
            <Download size={16} /> Exporter
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#006B3D] text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-[#006B3D]/20 hover:scale-105 transition-transform">
            <Plus size={16} /> Nouvel Article
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-[#1A2B3D] uppercase">Inventaire Temps Réel</h3>
          <button className="text-slate-400 hover:text-[#006B3D]"><Filter size={20} /></button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <th className="px-8 py-5">Article</th>
                <th className="px-8 py-5">Catégorie</th>
                <th className="px-8 py-5">Quantité</th>
                <th className="px-8 py-5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">REF-{item.id.slice(0,6)}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">{item.category}</td>
                  <td className="px-8 py-5">
                    <span className="font-black text-slate-900">{item.quantity}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
                    Aucune donnée d'inventaire disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logistics;
