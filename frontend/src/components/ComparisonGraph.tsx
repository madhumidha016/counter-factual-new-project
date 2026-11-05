import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartPoint } from '../types';

interface ComparisonGraphProps {
  data: ChartPoint[];
}

export const ComparisonGraph: React.FC<ComparisonGraphProps> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis 
            dataKey="metric" 
            tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
            unit="%"
          />
          <Tooltip 
            formatter={(value: any) => [`${value}%`]}
            contentStyle={{ 
              backgroundColor: '#151D2E', 
              borderColor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: '8px', 
              color: '#F8FAFC',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
          />
          <Bar 
            dataKey="Original" 
            fill="#8B5CF6" 
            radius={[5, 5, 0, 0]} 
            name="Original CT Prediction"
          />
          <Bar 
            dataKey="Counterfactual" 
            fill="#06B6D4" 
            radius={[5, 5, 0, 0]} 
            name="Counterfactual Re-Analysis"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
