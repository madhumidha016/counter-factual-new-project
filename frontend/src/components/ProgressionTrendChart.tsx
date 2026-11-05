import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { ProgressionTimelinePoint } from '../types';

interface ProgressionTrendChartProps {
  data: ProgressionTimelinePoint[];
}

export const ProgressionTrendChart: React.FC<ProgressionTrendChartProps> = ({ data }) => {
  const getDotColor = (item: ProgressionTimelinePoint) => {
    if (item.type === 'Projected') return '#06B6D4'; // Cyan for extrapolation
    if (item.status === 'Growth') return '#EF4444'; // Red
    if (item.status === 'Reduction') return '#22C55E'; // Green
    if (item.status === 'Stable' || item.status === 'Baseline') return '#F59E0B'; // Orange/Yellow
    return '#3B82F6';
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 25, left: -10, bottom: 15 }}
        >
          <defs>
            <linearGradient id="colorDiameter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis 
            dataKey="session" 
            tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
          />
          <YAxis 
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
            unit=" mm"
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ProgressionTimelinePoint;
                return (
                  <div className="bg-[#151D2E] p-3.5 border border-white/15 rounded-xl shadow-glass text-xs space-y-1">
                    <p className="font-bold text-white">{item.session}</p>
                    <p className="text-slate-400 text-[11px]">Date: {item.date} ({item.type})</p>
                    <p className="text-cyan-300 font-bold text-sm">Diameter: {item.diameter_mm} mm</p>
                    <p className="text-slate-300">Cross-Sectional Area: {item.area_mm2} mm²</p>
                    <p className="text-slate-400">Estimated Volume: {item.volume_mm3} mm³</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="diameter_mm" 
            stroke="#06B6D4" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorDiameter)" 
          />
          {data.map((entry, index) => (
            <ReferenceDot
              key={index}
              x={entry.session}
              y={entry.diameter_mm}
              r={entry.type === 'Observed' ? 6 : 5}
              fill={getDotColor(entry)}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
