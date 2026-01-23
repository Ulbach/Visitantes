
import React from 'react';
import { LogOut, User, Phone, Calendar, CloudCheck, CloudOff, RefreshCw, Briefcase } from 'lucide-react';
import { Visitor } from '../types';
import { formatDate } from '../utils';

interface VisitorCardProps {
  visitor: Visitor;
  onExit?: (id: string) => void;
}

const VisitorCard: React.FC<VisitorCardProps> = ({ visitor, onExit }) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${visitor.status === 'dentro' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${visitor.status === 'dentro' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 line-clamp-1">{visitor.fullName}</h4>
              {visitor.syncStatus === 'synced' ? (
                <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : visitor.syncStatus === 'pending' ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-tight">CPF: {visitor.cpf}</p>
          </div>
        </div>
        
        {visitor.status === 'dentro' && (
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">No Local</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-3 mb-5 border-y border-slate-50 py-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">{visitor.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Briefcase className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium truncate">Resp: {visitor.responsible}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Entrada: {formatDate(visitor.entryTime)}</span>
        </div>
        {visitor.exitTime && (
          <div className="flex items-center gap-2 text-slate-400 col-span-2">
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium italic">Saída: {formatDate(visitor.exitTime)}</span>
          </div>
        )}
      </div>

      {onExit && (
        <button
          onClick={() => onExit(visitor.id)}
          className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:bg-black transition-all shadow-lg shadow-slate-200"
        >
          <LogOut className="w-3.5 h-3.5" /> Registrar Saída
        </button>
      )}
    </div>
  );
};

export default VisitorCard;
