export type Theme = 'light' | 'dark';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface Invoice {
  id: string;
  projectName: string;
  clientName?: string;
  clientEmail?: string;
  hours: number;
  rate: number;
  dateCreated: string;
  dueDate?: string;
  status?: InvoiceStatus;
  notes?: string;
}

export interface AppSettings {
  defaultRate: number;
  currency: string;
  userName?: string;
  userBankAccount?: string;
}

export interface TimerState {
  startTime: number | null;
  elapsedSeconds: number;
  isActive: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export type ActiveView = 'dashboard' | 'invoices' | 'timer' | 'settings';

export interface AppDataDump {
  invoices: Invoice[];
  settings: AppSettings;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}
