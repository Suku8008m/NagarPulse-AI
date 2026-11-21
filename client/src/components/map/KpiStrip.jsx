import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, TrendingUp, Layers } from 'lucide-react';

export const KpiStrip = ({ stats, isLoading }) => {
  const cards = [
    {
      title: 'Total Civic Reports',
      value: stats?.total ?? 8,
      subtext: 'Nellore Municipal Jurisdiction',
      icon: Layers,
      color: 'text-slate-900',
      bg: 'bg-white',
      border: 'border-slate-200'
    },
    {
      title: 'Pending Triage',
      value: stats?.pending ?? 3,
      subtext: 'Awaiting crew dispatch',
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-white',
      border: 'border-slate-200'
    },
    {
      title: 'Active In-Field',
      value: stats?.inProgress ?? 2,
      subtext: 'Field teams deployed',
      icon: AlertTriangle,
      color: 'text-blue-700',
      bg: 'bg-white',
      border: 'border-slate-200'
    },
    {
      title: 'Verified Resolved',
      value: stats?.resolved ?? 3,
      subtext: `${stats?.resolutionRate ?? 38}% AI Vision audited`,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-white',
      border: 'border-slate-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-white shadow-xs flex items-center justify-between ${card.border}`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{card.title}</p>
              <h3 className={`text-2xl font-bold font-mono tracking-tight mt-0.5 ${card.color}`}>
                {isLoading ? '...' : card.value}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.subtext}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiStrip;
