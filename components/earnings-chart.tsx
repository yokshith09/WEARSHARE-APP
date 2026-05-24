"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EarningsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value: number) => `₹${value}`} dx={-10} />
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          formatter={(value: number) => [`₹${value}`, 'Earnings']}
        />
        <Area type="monotone" dataKey="earnings" stroke="#9333EA" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
