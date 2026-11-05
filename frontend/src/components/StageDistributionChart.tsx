import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { StageProbabilities } from '../types';

interface StageDistributionChartProps {
  probabilities: StageProbabilities;
  predictedStage: string;
}

export const StageDistributionChart: React.FC<StageDistributionChartProps> = ({
  probabilities,
  predictedStage,
}) => {
  const data = [
    { stage: 'Stage I', prob: Math.round((probabilities['Stage I'] || 0) * 100) },
    { stage: 'Stage II', prob: Math.round((probabilities['Stage II'] || 0) * 100) },
    { stage: 'Stage III', prob: Math.round((probabilities['Stage III'] || 0) * 100) },
    { stage: 'Stage IV', prob: Math.round((probabilities['Stage IV'] || 0) * 100) },
  ];

  // Distinct colors: High: Red (#EF4444), Moderate: Orange (#F59E0B), Low: Green (#22C55E)
  const getBarColor = (probVal: number, isHighest: boolean) => {
    if (isHighest) {
      if (probVal >= 50) return '#EF4444'; // RED
      if (probVal >= 25) return '#F59E0B'; // ORANGE
      return '#22C55E'; // GREEN
    }
    if (probVal >= 60) return '#EF4444';
    if (probVal >= 30) return '#F59E0B';
    return '#3B82F6'; // Default secondary blue
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis 
            dataKey="stage" 
            tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 600 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
            unit="%"
          />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Estimated Likelihood']}
            contentStyle={{ 
              backgroundColor: '#151D2E', 
              borderColor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: '8px', 
              color: '#F8FAFC',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
            }}
          />
          <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
            {data.map((entry) => {
              const isPredicted = entry.stage === predictedStage;
              const fill = getBarColor(entry.prob, isPredicted);
              return (
                <Cell 
                  key={entry.stage} 
                  fill={fill} 
                  stroke={isPredicted ? '#FFFFFF' : 'none'}
                  strokeWidth={isPredicted ? 1.5 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
