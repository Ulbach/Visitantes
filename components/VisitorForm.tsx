
import React, { useState, useEffect } from 'react';
import { User, CreditCard, Phone, Scan, Sparkles, Loader2, UserCheck, Briefcase } from 'lucide-react';
import { formatCPF, formatPhone, blobToBase64, cleanString } from '../utils';
import { GoogleGenAI, Type } from "@google/genai";
import CameraCapture from './CameraCapture';
import { Visitor } from '../types';

interface VisitorFormProps {
  onSubmit: (data: { fullName: string; cpf: string; phone: string; responsible: string }) => void;
  onCancel: () => void;
  existingVisitors: Visitor[];
  responsibleList: string[];
}

const VisitorForm: React.FC<VisitorFormProps> = ({ onSubmit, onCancel, existingVisitors, responsibleList }) => {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [responsible, setResponsible] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const cleaned = cleanString(cpf);
    if (cleaned.length === 11) {
      const found = existingVisitors.find(v => cleanString(v.cpf) === cleaned);
      if (found) {
        setFullName(found.fullName);
        setPhone(formatPhone(found.phone));
        setIsReturning(true);
      } else {
        setIsReturning(false);
      }
    } else {
      setIsReturning(false);
    }
  }, [cpf, existingVisitors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: boolean } = {
      cpf: cleanString(cpf).length < 11,
      fullName: !fullName.trim(),
      phone: cleanString(phone).length < 10,
      responsible: !responsible
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(err => err)) return;
    onSubmit({ fullName, cpf, phone, responsible });
  };

  const handleDocumentCapture = async (blob: Blob) => {
    setIsScanning(false);
    setIsProcessing(true);
    try {
      const base64 = await blobToBase64(blob);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ inlineData: { data: base64, mimeType: 'image/jpeg' } }, { text: "Extraia o NOME COMPLETO e o CPF deste documento. Retorne apenas JSON." }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.OBJECT, properties: { fullName: { type: Type.STRING }, cpf: { type: Type.STRING } }, required: ['fullName', 'cpf'] }
        }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.fullName) setFullName(result.fullName.toUpperCase());
      if (result.cpf) setCpf(formatCPF(result.cpf));
    } catch (error) {
      console.error("Erro OCR:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {isScanning && <CameraCapture onCapture={handleDocumentCapture} onClose={() => setIsScanning(false)} />}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-black text-indigo-900 uppercase">Lendo Documento...</p>
          </div>
        )}

        <button type="button" onClick={() => setIsScanning(true)} className="w-full bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><Scan className="w-5 h-5" /></div>
            <div className="text-left">
              <span className="block text-sm font-bold text-indigo-900">Escanear Documento</span>
              <span className="text-[10px] font-medium text-indigo-400 uppercase">Leitura Inteligente</span>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-indigo-300" />
        </button>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
              CPF {isReturning && <span className="text-emerald-500 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Revisitante</span>}
            </label>
            <div className="relative">
              <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.cpf ? 'text-rose-500' : 'text-slate-400'}`} />
              <input type="tel" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" className={`w-full bg-slate-50 border rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none ${errors.cpf ? 'border-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome Completo</label>
            <div className="relative">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.fullName ? 'text-rose-500' : 'text-slate-400'}`} />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value.toUpperCase())} placeholder="Ex: JOÃO SILVA" className={`w-full bg-slate-50 border rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none ${errors.fullName ? 'border-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Telefone</label>
            <div className="relative">
              <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.phone ? 'text-rose-500' : 'text-slate-400'}`} />
              <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className={`w-full bg-slate-50 border rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none ${errors.phone ? 'border-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Responsável</label>
            <div className="relative">
              <Briefcase className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${errors.responsible ? 'text-rose-500' : 'text-slate-400'}`} />
              <select value={responsible} onChange={(e) => setResponsible(e.target.value)} className={`w-full bg-slate-50 border rounded-2xl py-3.5 pl-12 pr-10 text-sm outline-none appearance-none ${errors.responsible ? 'border-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}>
                <option value="">Selecione...</option>
                {responsibleList.map((res, idx) => <option key={idx} value={res}>{res}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm">Cancelar</button>
          <button type="submit" className="flex-1 bg-indigo-600 py-4 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all">Confirmar Acesso</button>
        </div>
      </form>
    </>
  );
};

export default VisitorForm;
