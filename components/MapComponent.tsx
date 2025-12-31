
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import * as GeoTIFF from 'geotiff';
import proj4 from 'proj4';
import { Producer, LayerType } from '../types';
import { X, Loader2, MapPin, Target, Zap, Layers } from 'lucide-react';
import { MAPBOX_TOKEN } from '../constants';

// Projections pour la zone Anambé / Sénégal (UTM 28N)
proj4.defs("EPSG:32628", "+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

interface Props {
  producers: Producer[];
  activeLayer: LayerType;
  rasterRegistry?: Map<string, File>;
  selectedProducerId?: string | null;
  onSelectProducer?: (id: string | null) => void;
}

const MapComponent: React.FC<Props> = ({ producers, activeLayer, rasterRegistry, selectedProducerId, onSelectProducer }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const rasterLayerRef = useRef<L.ImageOverlay | null>(null);
  const [isProcessingRaster, setIsProcessingRaster] = useState(false);
  
  const renderRequestId = useRef(0);
  const rasterCache = useRef<Map<string, {url: string, bounds: L.LatLngBoundsExpression}>>(new Map());

  const activeProducer = useMemo(() => producers.find(p => p.id === selectedProducerId), [producers, selectedProducerId]);

  const legendConfig = {
    yield: {
      title: 'RENDEMENT (T/HA)',
      min: 'Bas',
      max: 'Haut',
      gradient: 'linear-gradient(to right, #ef4444, #fbbf24, #22c55e)',
      colors: { low: [239, 68, 68], mid: [251, 191, 36], high: [34, 197, 94] }
    },
    density: {
      title: 'DENSITÉ (P/HA)',
      min: 'Faible',
      max: 'Optimale',
      gradient: 'linear-gradient(to right, #e0f2fe, #3b82f6, #1e3a8a)',
      colors: { low: [224, 242, 254], mid: [59, 130, 246], high: [30, 58, 138] }
    },
    fertility: {
      title: 'FERTILITÉ (AZOTE)',
      min: 'Carence',
      max: 'Vigueur',
      gradient: 'linear-gradient(to right, #78350f, #f3f4f6, #065f46)',
      colors: { low: [120, 53, 15], mid: [243, 244, 246], high: [6, 95, 70] }
    }
  };

  const getRobustLimits = (data: Float32Array) => {
    // Filtrage pour ignorer les valeurs NoData (-9999)
    const validData = data.filter(v => !isNaN(v) && v > -900 && v < 500000);
    if (validData.length === 0) return { min: 0, max: 1 };
    
    const sorted = [...validData].sort((a, b) => a - b);
    const p2 = sorted[Math.floor(sorted.length * 0.02)];
    const p98 = sorted[Math.floor(sorted.length * 0.98)];
    
    return { min: p2, max: Math.max(p98, p2 + 0.00001) };
  };

  const generateRasterOverlay = async (file: File, layerType: LayerType) => {
    const cacheKey = `${file.name}_${layerType}`;
    if (rasterCache.current.has(cacheKey)) return rasterCache.current.get(cacheKey);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      
      const width = image.getWidth();
      const height = image.getHeight();
      const bbox = image.getBoundingBox();
      const noData = (image as any).getGDALNoData ? (image as any).getGDALNoData() : null;
      
      if (!bbox || bbox.length !== 4) return null;

      const isAlreadyWGS84 = Math.abs(bbox[0]) <= 180 && Math.abs(bbox[2]) <= 180;
      let sw, ne;
      
      if (isAlreadyWGS84) {
        sw = [bbox[0], bbox[1]];
        ne = [bbox[2], bbox[3]];
      } else {
        sw = proj4("EPSG:32628", "EPSG:4326", [bbox[0], bbox[1]]);
        ne = proj4("EPSG:32628", "EPSG:4326", [bbox[2], bbox[3]]);
      }

      if (isNaN(sw[0]) || isNaN(sw[1]) || isNaN(ne[0]) || isNaN(ne[1])) return null;
      
      const bounds: L.LatLngBoundsExpression = [[sw[1], sw[0]], [ne[1], ne[0]]];
      const rasters = await image.readRasters();
      const data = new Float32Array(Array.isArray(rasters) ? rasters[0] as any : rasters);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.createImageData(width, height);
      const { min, max } = getRobustLimits(data);
      const config = legendConfig[layerType].colors;

      for (let i = 0; i < data.length; i++) {
        const val = data[i];
        const offset = i * 4;
        
        // NoData
        if (isNaN(val) || val === noData || val <= -900) {
          imageData.data[offset + 3] = 0; 
          continue;
        }

        // Pour le rendement (Yield), les valeurs nulles sont souvent hors-bordure
        if (layerType === 'yield' && val === 0) {
          imageData.data[offset + 3] = 0;
          continue;
        }

        const norm = Math.max(0, Math.min(1, (val - min) / (max - min)));
        let r, g, b;
        
        if (norm < 0.5) {
          const t = norm * 2;
          r = Math.round(config.low[0] + t * (config.mid[0] - config.low[0]));
          g = Math.round(config.low[1] + t * (config.mid[1] - config.low[1]));
          b = Math.round(config.low[2] + t * (config.mid[2] - config.low[2]));
        } else {
          const t = (norm - 0.5) * 2;
          r = Math.round(config.mid[0] + t * (config.high[0] - config.mid[0]));
          g = Math.round(config.mid[1] + t * (config.high[1] - config.mid[1]));
          b = Math.round(config.mid[2] + t * (config.high[2] - config.mid[2]));
        }

        imageData.data[offset] = r;
        imageData.data[offset + 1] = g;
        imageData.data[offset + 2] = b;
        imageData.data[offset + 3] = 255; 
      }
      
      ctx.putImageData(imageData, 0, 0);
      const result = { url: canvas.toDataURL('image/png'), bounds };
      rasterCache.current.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error("[SIG] Error Rendering TIFF:", err);
      return null;
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, 
      attributionControl: false,
      center: [12.94, -14.15], 
      zoom: 12
    });

    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
      tileSize: 256,
      zoomOffset: 0
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (geojsonLayerRef.current) mapRef.current.removeLayer(geojsonLayerRef.current);
    geojsonLayerRef.current = L.geoJSON({
      type: 'FeatureCollection',
      features: producers.map(p => ({
        type: 'Feature', id: p.id,
        geometry: p.geometry || { type: 'Point', coordinates: p.location },
        properties: { ...p }
      }))
    } as any, {
      style: (f) => ({
        fillColor: f?.properties.id === selectedProducerId ? '#FFCB05' : 'transparent',
        weight: f?.properties.id === selectedProducerId ? 4 : 2,
        opacity: 0.9, 
        color: f?.properties.id === selectedProducerId ? '#FFF' : '#006B3D', 
        fillOpacity: f?.properties.id === selectedProducerId ? 0.3 : 0,
      }),
      onEachFeature: (f, l) => l.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectProducer?.(f.properties.id);
      })
    }).addTo(mapRef.current);
  }, [producers, selectedProducerId]);

  useEffect(() => {
    const currentId = ++renderRequestId.current;
    let isMounted = true;

    const updateOverlay = async () => {
      if (rasterLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(rasterLayerRef.current);
        rasterLayerRef.current = null;
      }

      if (!mapRef.current || !rasterRegistry || !activeProducer) {
        setIsProcessingRaster(false);
        return;
      }

      const keywords: Record<LayerType, string[]> = {
        yield: ['yield', 'rendement', 'prod', 'tonnes', 'vrt_yield'],
        density: ['density', 'densite', 'dens', 'semis', 'count', 'pop', 'field_density'],
        fertility: ['nitrogen', 'application', 'fertility', 'fertilite', 'fert', 'ndre', 'azote', 'vigour']
      };

      const targetFileName = activeProducer.rasters?.find(name => {
        const lowerName = name.toLowerCase();
        return keywords[activeLayer].some(k => lowerName.includes(k));
      });
      
      if (!targetFileName) {
        setIsProcessingRaster(false);
        if (selectedProducerId) mapRef.current.setView([activeProducer.location[1], activeProducer.location[0]], 17);
        return;
      }

      const file = rasterRegistry.get(targetFileName);
      if (!file) {
        setIsProcessingRaster(false);
        return;
      }

      setIsProcessingRaster(true);
      
      const data = await generateRasterOverlay(file, activeLayer);
      if (!isMounted || currentId !== renderRequestId.current) return;
      
      setIsProcessingRaster(false);

      if (data && mapRef.current) {
        const newLayer = L.imageOverlay(data.url, data.bounds, { 
          opacity: 0, 
          interactive: false, 
          zIndex: 1500,
          className: 'raster-layer-fade-in'
        }).addTo(mapRef.current);
        
        setTimeout(() => { if (isMounted) newLayer.setOpacity(0.98); }, 50);
        rasterLayerRef.current = newLayer;
        mapRef.current.fitBounds(data.bounds, { padding: [100, 100], duration: 1.2 });
      }
    };

    updateOverlay();
    return () => { isMounted = false; };
  }, [selectedProducerId, activeLayer, activeProducer, rasterRegistry]);

  const currentLegend = legendConfig[activeLayer];

  return (
    <div className="relative w-full h-full">
      <style>{`.raster-layer-fade-in { transition: opacity 0.8s ease-in-out; }`}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0f172a]" />
      
      {/* Légende flottante */}
      <div className="absolute bottom-6 left-6 z-[2000] bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-[24px] shadow-2xl w-60">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3 h-3 text-[#006B3D]" />
          <h5 className="text-[9px] font-black uppercase text-slate-900 tracking-wider">{currentLegend.title}</h5>
        </div>
        <div className="h-3 w-full rounded-full mb-2 bg-slate-100 p-[1px]">
          <div className="h-full w-full rounded-full transition-all duration-500" style={{ background: currentLegend.gradient }} />
        </div>
        <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase">
          <span>{currentLegend.min}</span><span>{currentLegend.max}</span>
        </div>
      </div>

      {/* Loader SIG */}
      {isProcessingRaster && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[3000]">
          <div className="bg-white/90 backdrop-blur-2xl border-b-[#006B3D] border-b-2 px-8 py-4 rounded-full flex items-center gap-4 shadow-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-[#006B3D]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-900 font-black uppercase tracking-widest leading-none">Matrice SIG</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Analyse de {activeLayer}...</span>
            </div>
          </div>
        </div>
      )}

      {/* Panel Info Producteur */}
      {selectedProducerId && activeProducer && (
        <div className="absolute bottom-6 right-6 w-[320px] bg-white rounded-[32px] shadow-2xl border border-slate-100 z-[2000] overflow-hidden animate-in slide-in-from-right">
          <div className="relative p-6 bg-[#006B3D] text-white">
            <button onClick={() => onSelectProducer?.(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 p-2 rounded-xl transition-all">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#FFCB05] text-[#006B3D] rounded-[18px] flex items-center justify-center font-black text-xl shrink-0">
                {activeProducer.name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-[8px] font-black text-[#FFCB05] uppercase tracking-widest mb-0.5">Exploitation SIG</p>
                <h4 className="text-lg font-black leading-tight tracking-tight truncate uppercase">{activeProducer.name}</h4>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Rendement</p>
                <p className="text-sm font-black text-[#1A2B3D]">{activeProducer.yieldActual?.toFixed(2)} t/ha</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Surface</p>
                <p className="text-sm font-black text-[#1A2B3D]">{activeProducer.areaHectares?.toFixed(2)} ha</p>
              </div>
            </div>
            <div className="space-y-3 pt-2 text-[10px]">
               <div className="flex justify-between items-center"><span className="text-slate-400 font-black tracking-widest uppercase flex items-center gap-2">Village</span><span className="font-black uppercase text-slate-900">{activeProducer.village}</span></div>
               <div className="flex justify-between items-center"><span className="text-slate-400 font-black tracking-widest uppercase flex items-center gap-2">Union</span><span className="font-black uppercase text-slate-900">{activeProducer.union.replace('UNION SECTEUR ', 'S.')}</span></div>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[#006B3D] font-black text-[9px] uppercase tracking-widest border-t border-slate-50">
               <Layers size={10} /> {activeProducer.rasters?.length || 0} Calques cartographiés
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
