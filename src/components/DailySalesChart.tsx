import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DailySalesChartProps {
  dailyArray?: { date: string; sales: number }[];
  average?: number;
}

const DailySalesChart: React.FC<DailySalesChartProps> = ({ dailyArray = [], average = 0 }) => (
  <div className="w-full h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dailyArray} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => {
            try {
              return format(parseISO(d), 'dd MMM');
            } catch {
              return d;
            }
          }}
        />
        <YAxis />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} name="Daily Sales" />
        {dailyArray.length > 0 && (
          <ReferenceLine
            y={average}
            label={{ value: 'Avg', position: 'top', fill: 'red' }}
            stroke="red"
            strokeDasharray="5 5"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default DailySalesChart;