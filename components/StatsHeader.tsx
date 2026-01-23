
import React from 'react';
import { Visitor } from '../types';
import { Clock } from 'lucide-react';

interface StatsHeaderProps {
  visitors: Visitor[];
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ visitors }) => {
  const activeCount = visitors.filter(v => v.status === 'dentro').length;

  return (
    <div className="w-full">
      <div className="bg-white p-7 rounded-[2.5rem] flex flex-col items-center gap-3 border border-slate-100 shadow-sm transition-all active:scale-[0.98]">
        <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-500">
          <Clock className="w-6 h-6" />
        </div>
        <div className="text-center">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Terceiros no Local</span>
          <span className="text-5xl font-black text-slate-800 tracking-tighter">{activeCount}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsHeader;
