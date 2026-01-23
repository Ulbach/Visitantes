
export type VisitorStatus = 'dentro' | 'saiu';
export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Visitor {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  responsible: string;
  entryTime: string;
  exitTime?: string;
  status: VisitorStatus;
  syncStatus?: SyncStatus;
}

export interface VisitStats {
  totalToday: number;
  activeNow: number;
}
