
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { Producer, UnionName } from '../types';
import { 
  TrendingUp, Map as MapIcon, Sprout, Search, BarChart3, 
  Download, FileJson, FileSpreadsheet, BrainCircuit,
  Droplets, Target, Info, Users, Maximize, Zap
} from 'lucide-react';

interface Props {
  producers: Producer[];
  selectedUnion: UnionName | 'All';
  onViewInsights: () => void;
}

const Dashboard: React.FC<Props> = ({ producers, selectedUnion, onViewInsights }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducers = useMemo(() => {
    let result = selectedUnion === 'All' 
      ? producers 
      : producers.filter(p => p.union === selectedUnion);
    
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.parcelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.village.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [producers, selectedUnion, searchTerm]);

  const stats = useMemo(() => {
    const totalYield = filteredProducers.reduce((acc, p) => acc + p.productionTonnes, 0);
    const avgYield = filteredProducers.reduce((acc, p) => acc + p.yieldActual, 0) / filteredProducers.length || 0;
    const avgDensity = filteredProducers.reduce((acc, p) => acc + p.density, 0) / filteredProducers.length || 0;
    const avgFertility = filteredProducers.reduce((acc, p) => acc + p.fertilityIndex, 0) / filteredProducers.length || 0;
    const totalAreaHa = filteredProducers.reduce((acc, p) => acc + p.areaHectares, 0);
    const producerCount = filteredProducers.length;
    return { totalYield, avgDensity, avgYield, avgFertility, producerCount, totalAreaHa };
  }, [filteredProducers]);

  const unionStats = useMemo(() => {
    const uniqueUnions = Array.from(new Set(producers.map(p => p.union)));
    
    return uniqueUnions.map(union => {
      const unionProds = producers.filter(p => p.union === union);
      const totalProd = unionProds.reduce((acc, p) => acc + p.productionTonnes, 0);
      const avgYield = unionProds.reduce((acc, p) => acc + p.yieldActual, 0) / unionProds.length || 0;
      
      return { 
        // Fix: Cast union to string to allow toUpperCase() to resolve 'unknown' error
        name: (union as string).toUpperCase().replace('UNION SECTEUR ', 'S.').replace('UNION ', ''), 
        fullName: union,
        totalProduction: parseFloat(totalProd.toFixed(1)), 
        avgYield: parseFloat(avgYield.toFixed(2))
      };
    }).sort((a, b) => b.totalProduction - a.totalProduction);
  }, [producers]);

  const fertilityDistribution = useMemo(() => {
    const counts = { haute: 0, moyenne: 0, basse: 0 };
    filteredProducers.forEach(p => {
      if (p.fertilityIndex > 70) counts.haute++;
      else if (p.fertilityIndex > 40) counts.moyenne++;
      else counts.basse++;
    });
    return [
      { name: 'Optimale', value: counts.haute, color: '#10b981' },
      { name: 'Modérée', value: counts.moyenne, color: '#f59e0b' },
      { name: 'Critique', value: counts.basse, color: '#ef4444' },
    ];
  }, [filteredProducers]);

  const downloadGeoJSON = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: filteredProducers.map(p => ({
        type: 'Feature',
        geometry: p.geometry || { type: 'Point', coordinates: p.location },
        properties: {
          id: p.id,
          nom: p.name,
          union: p.union,
          village: p.village,
          rendement: p.yieldActual,
          production: p.productionTonnes,
          surface_ha: p.areaHectares,
          densite: p.density,
          fertilite: p.fertilityIndex,
          maj: p.lastUpdate
        }
      }))
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tolbi_export_${selectedUnion.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    const headers = ['ID', 'Nom', 'Union', 'Village', 'ID Parcelle', 'Surface (ha)', 'Rendement (t/ha)', 'Production (T)', 'Densite (p/ha)', 'Fertilite (%)', 'Derniere MAJ'];
    const rows = filteredProducers.map(p => [
      p.id,
      `"${p.name}"`,
      `"${p.union}"`,
      `"${p.village}"`,
      `"${p.parcelId}"`,
      p.areaHectares.toFixed(2),
      p.yieldActual,
      p.productionTonnes,
      p.density,
      p.fertilityIndex,
      p.lastUpdate
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tolbi_data_${selectedUnion.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Banner AI - TOLBI xAI Investigation Tool */}
      <div className="bg-gradient-to-r from-[#006B3D] to-[#004d2c] rounded-[32px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden group border border-emerald-400/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
           <BrainCircuit size={120} />
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#FFCB05] text-[#006B3D] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
              <Zap size={8} className="fill-[#006B3D]" /> Outil d'investigation agronomique
            </span>
          </div>
          <h2 className="text-2xl font-black mb-2 leading-tight uppercase tracking-tighter">TOLBI xAI : Précision et Analyse de Saison.</h2>
          <p className="text-emerald-50/80 text-xs mb-6 font-medium leading-relaxed">
            Un véritable assistant d'investigation pour croiser vos rasters SIG avec les meilleures pratiques agricoles. Prenez des décisions basées sur des preuves terrain.
          </p>
          <button 
            onClick={onViewInsights}
            className="bg-white text-[#006B3D] px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#FFCB05] hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 shadow-inner"
          >
            <BrainCircuit size={14} /> Lancer l'investigation
          </button>
        </div>
      </div>

      {/* Résumé des statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Producteurs" value={stats.producerCount.toString()} icon={<Users className="w-4 h-4" />} trend="Actif" />
        <StatCard label="Production" value={`${stats.totalYield.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} t`} icon={<Target className="w-4 h-4" />} trend="Total Brut" />
        <StatCard label="Surface" value={`${stats.totalAreaHa.toFixed(1)} ha`} icon={<Maximize className="w-4 h-4" />} trend="Territoire" trendColor="text-blue-500" />
        <StatCard label="Fertilité" value={`${Math.round(stats.avgFertility)}%`} icon={<Droplets className="w-4 h-4" />} trend="Moyenne" trendColor="text-amber-500" />
        <StatCard label="Rendement" value={`${stats.avgYield.toFixed(2)} t/ha`} icon={<TrendingUp className="w-4 h-4" />} trend="Moyen" />
      </div>

      {/* Graphiques Principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Production par Union</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Volume net enregistré (Tonnes)</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <BarChart3 className="w-5 h-5 text-[#006B3D]" />
            </div>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unionStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 700}} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', padding: '12px'}}
                />
                <Bar dataKey="totalProduction" radius={[8, 8, 0, 0]} barSize={35}>
                  {unionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#006B3D' : index === 1 ? '#059669' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Santé des Sols</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Index de fertilité</p>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={fertilityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fertilityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-6">
            {fertilityDistribution.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{item.name}</span>
                </div>
                <span className="font-black text-slate-900 text-xs">{item.value} parcs.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registre des Producteurs */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Registre</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Saison Maïs 2025</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#006B3D] rounded-xl text-xs transition-all outline-none" 
              />
            </div>

            <div className="flex gap-2">
              <button onClick={downloadGeoJSON} className="px-4 py-3 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100"><FileJson size={14} /></button>
              <button onClick={downloadExcel} className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#006B3D] hover:text-white transition-all border border-emerald-100"><FileSpreadsheet size={14} /></button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md text-slate-400 uppercase text-[8px] font-black tracking-widest border-b border-slate-100 z-10">
              <tr>
                <th className="px-8 py-4">Producteur</th>
                <th className="px-8 py-4 text-center">Surface (ha)</th>
                <th className="px-8 py-4 text-center">Rendement (t/ha)</th>
                <th className="px-8 py-4 text-center">Production (T)</th>
                <th className="px-8 py-4 text-center">Fertilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#006B3D]/10 rounded-lg flex items-center justify-center font-black text-[#006B3D] group-hover:bg-[#006B3D] group-hover:text-white transition-all text-[10px]">{p.name.charAt(0)}</div>
                      <div>
                        <span className="font-black text-slate-900 block text-[11px]">{p.name}</span>
                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tight">{p.union}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="font-black text-slate-600">{p.areaHectares.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="font-black text-emerald-600 text-sm">{p.yieldActual.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="font-black text-slate-900 text-sm">{p.productionTonnes.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 max-w-[60px] h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.fertilityIndex > 70 ? 'bg-emerald-500' : p.fertilityIndex > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${p.fertilityIndex}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-slate-900">{p.fertilityIndex}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; trend: string; trendColor?: string }> = ({ 
  label, value, icon, trend, trendColor = 'text-emerald-500' 
}) => (
  <div className="bg-white p-4 md:p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-[#006B3D] group-hover:bg-[#006B3D] group-hover:text-white transition-all duration-300">{icon}</div>
      <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded ${trendColor}`}>{trend}</span>
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
