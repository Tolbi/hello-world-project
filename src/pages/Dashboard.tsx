
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, Users, Maximize, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [producers, setProducers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducers = async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('*');
      
      if (!error && data) {
        setProducers(data);
      }
      setLoading(false);
    };

    fetchProducers();
  }, []);

  // Calcul des stats
  const stats = {
    count: producers.length,
    totalArea: producers.reduce((acc, p) => acc + (Number(p.area_hectares) || 0), 0),
    avgYield: producers.length ? producers.reduce((acc, p) => acc + (Number(p.yield_actual) || 0), 0) / producers.length : 0,
    totalProd: producers.reduce((acc, p) => acc + ((Number(p.yield_actual) || 0) * (Number(p.area_hectares) || 0)), 0)
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#006B3D]" size={40} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tableau de Bord</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Supervision Globale de la Saison</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Producteurs" 
          value={stats.count.toString()} 
          icon={<Users />} 
          trend="Actifs" 
        />
        <StatCard 
          label="Surface Totale" 
          value={`${stats.totalArea.toFixed(1)} ha`} 
          icon={<Maximize />} 
          trend="Enrôlés" 
          color="text-blue-500"
        />
        <StatCard 
          label="Rendement Moyen" 
          value={`${stats.avgYield.toFixed(2)} t/ha`} 
          icon={<TrendingUp />} 
          trend="Estimé" 
          color="text-amber-500"
        />
        <StatCard 
          label="Production Totale" 
          value={`${stats.totalProd.toFixed(0)} T`} 
          icon={<Target />} 
          trend="Prévision" 
        />
      </div>

      {/* Main Chart Section */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-[400px] flex flex-col">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase">Répartition par Union</h3>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepareUnionData(producers)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="area" fill="#006B3D" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, trend, color = "text-[#006B3D]" }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center ${color} group-hover:bg-[#006B3D] group-hover:text-white transition-all`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase bg-slate-50 px-2 py-1 rounded text-slate-400">{trend}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const prepareUnionData = (producers: any[]) => {
  const grouped = producers.reduce((acc: any, p) => {
    const union = p.union_name || 'Non défini';
    if (!acc[union]) acc[union] = 0;
    acc[union] += Number(p.area_hectares) || 0;
    return acc;
  }, {});
  
  return Object.keys(grouped).map(k => ({ name: k.replace('UNION ', ''), area: grouped[k] }));
};

export default Dashboard;
