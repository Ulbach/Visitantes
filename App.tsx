
import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, Users, History, LayoutDashboard, Settings,
  ShieldCheck, ChevronLeft, FileBarChart, Loader2
} from 'lucide-react';
import { Visitor, VisitorStatus, SyncStatus } from './types';
import VisitorForm from './components/VisitorForm';
import VisitorCard from './components/VisitorCard';
import StatsHeader from './components/StatsHeader';
import { formatDateTimeBR, cleanString } from './utils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'active' | 'history' | 'reports' | 'settings'>('dashboard');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string>(localStorage.getItem('sheet_webhook_url') || '');
  const [responsibleList, setResponsibleList] = useState<string[]>(JSON.parse(localStorage.getItem('cached_responsibles') || '[]'));
  const [isLoading, setIsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('access_control_visitors');
    if (saved) setVisitors(JSON.parse(saved));
    if (webhookUrl) syncDataFromCloud(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('access_control_visitors', JSON.stringify(visitors));
  }, [visitors]);

  const syncDataFromCloud = async (silent = true): Promise<void> => {
    if (!webhookUrl) return;
    if (!silent) setIsLoading(true);
    
    try {
      const response = await fetch(`${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
      if (!response.ok) throw new Error("Erro na rede");
      
      const cloudResponse = await response.json();
      
      if (cloudResponse.responsibles) {
        setResponsibleList(cloudResponse.responsibles);
        localStorage.setItem('cached_responsibles', JSON.stringify(cloudResponse.responsibles));
      }
      
      if (cloudResponse.visitors) {
        mapVisitorsFromRows(cloudResponse.visitors);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapVisitorsFromRows = (rows: any[][]) => {
    if (!rows || rows.length < 2) return;
    
    const mapped: Visitor[] = rows.slice(1).map((row, index) => {
      const statusRaw = String(row[4] || "").trim().toLowerCase();
      const isInside = statusRaw === 'dentro';
      
      return {
        id: row[2] ? cleanString(row[2]) + index : `idx-${index}`,
        entryTime: String(row[0] || ""),
        fullName: String(row[1] || "").toUpperCase(),
        cpf: String(row[2] || ""),
        phone: String(row[3] || ""),
        status: (isInside ? 'dentro' : 'saiu') as VisitorStatus,
        exitTime: row[5] ? String(row[5]) : undefined,
        responsible: String(row[6] || ""),
        syncStatus: 'synced' as SyncStatus
      };
    }).filter(v => v.cpf !== "");
    
    setVisitors(mapped);
  };

  const syncVisitorToCloud = async (visitor: Visitor) => {
    if (!webhookUrl) return;
    
    const now = formatDateTimeBR(new Date());
    const payload = {
      action: visitor.status === 'dentro' ? 'ENTRADA' : 'SAIDA',
      fullName: visitor.fullName,
      cpf: visitor.cpf,
      phone: visitor.phone,
      responsible: visitor.responsible,
      status: visitor.status === 'dentro' ? 'Dentro' : 'Saiu',
      timestamp: now,
      exitTime: visitor.status === 'saiu' ? now : ""
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      // Delay para dar tempo do Google processar antes de ler novamente
      setTimeout(() => syncDataFromCloud(true), 2000);
    } catch (error) {
      console.error("Erro na gravação:", error);
    }
  };

  const handleEntry = (data: any) => {
    const entry: Visitor = {
      ...data,
      id: crypto.randomUUID(),
      entryTime: formatDateTimeBR(new Date()),
      status: 'dentro',
      syncStatus: 'pending'
    };
    setVisitors(prev => [entry, ...prev]);
    setActiveTab('active');
    syncVisitorToCloud(entry);
  };

  const handleExit = (id: string) => {
    const updated = visitors.map(v => {
      if (v.id === id) {
        const up = { 
          ...v, 
          status: 'saiu' as VisitorStatus, 
          exitTime: formatDateTimeBR(new Date()),
          syncStatus: 'pending' as SyncStatus 
        };
        syncVisitorToCloud(up);
        return up;
      }
      return v;
    });
    setVisitors(updated);
  };

  const isEntryScreen = activeTab === 'entry';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative border-x border-slate-200 shadow-xl overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Sincronizando...</p>
          </div>
        </div>
      )}

      {!isEntryScreen && (
        <section className="relative h-52 overflow-hidden rounded-b-[2.5rem] shadow-xl z-20 shrink-0">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-slate-900/40"></div>
          <div className="relative z-10 flex flex-col h-full justify-between p-6 pt-10">
            <div className="flex justify-between items-center">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
              <button onClick={() => setActiveTab('settings')} className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">Portaria Inteligente</h2>
          </div>
        </section>
      )}

      <main className={`flex-1 overflow-y-auto px-6 ${isEntryScreen ? 'pt-8 pb-8' : 'py-6 pb-28'}`}>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <StatsHeader visitors={visitors} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { syncDataFromCloud(true); setActiveTab('entry'); }} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500"><UserPlus className="w-6 h-6" /></div>
                <span className="text-xs font-extrabold text-slate-700">Nova Entrada</span>
              </button>
              <button onClick={() => setActiveTab('active')} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-all">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-500"><Users className="w-6 h-6" /></div>
                <span className="text-xs font-extrabold text-slate-700">Presentes</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'entry' && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Nova Entrada</h2>
              <button onClick={() => setActiveTab('dashboard')} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">Voltar</button>
            </div>
            <VisitorForm 
              onSubmit={handleEntry} 
              onCancel={() => setActiveTab('dashboard')} 
              existingVisitors={visitors} 
              responsibleList={responsibleList} 
            />
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">No Local</h2>
            {visitors.filter(v => v.status === 'dentro').map(v => (
              <VisitorCard key={v.id} visitor={v} onExit={handleExit} />
            ))}
            {visitors.filter(v => v.status === 'dentro').length === 0 && (
              <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Ninguém presente</div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">Últimas Visitas</h2>
            {visitors.filter(v => v.status === 'saiu').reverse().slice(0, 15).map(v => (
              <VisitorCard key={v.id} visitor={v} />
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">Registros</h2>
            <input 
              type="text" 
              value={reportSearch} 
              onChange={(e) => setReportSearch(e.target.value)} 
              placeholder="Buscar..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
            />
            <div className="space-y-3">
              {visitors.filter(v => v.fullName.toLowerCase().includes(reportSearch.toLowerCase()) || v.cpf.includes(reportSearch)).map(v => (
                <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{v.fullName}</h4>
                    <p className="text-[10px] text-slate-400">{v.cpf}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${v.status === 'dentro' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-5">
            <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-5">
              <h3 className="font-bold text-slate-800">Sincronização</h3>
              <input 
                type="text" 
                value={webhookUrl} 
                onChange={(e) => setWebhookUrl(e.target.value)} 
                placeholder="URL do Script" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <button 
                onClick={() => { localStorage.setItem('sheet_webhook_url', webhookUrl); syncDataFromCloud(false); setActiveTab('dashboard'); }} 
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Salvar e Atualizar
              </button>
            </div>
          </div>
        )}
      </main>

      {!isEntryScreen && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center shadow-lg z-30">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Início" />
          <NavButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} icon={<Users />} label="Presentes" />
          <div className="relative -top-10">
            <button onClick={() => { syncDataFromCloud(true); setActiveTab('entry'); }} className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl ring-4 ring-white active:scale-90 transition-all">
              <UserPlus className="w-7 h-7 text-white" />
            </button>
          </div>
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="Histórico" />
          <NavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileBarChart />} label="Registros" />
        </nav>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => {
  if (!icon) return null;
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
      {/* Fix: casting to React.ReactElement<any> fixes the 'className' prop type error in cloneElement */}
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};

export default App;
