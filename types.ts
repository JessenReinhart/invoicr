
export type Theme = 'light' | 'dark';

export interface Invoice {
  id: string;
  projectName: string;
  clientName?: string;
  hours: number;
  rate: number;
  dateCreated: string;
  notes?: string;
}

export interface AppSettings {
  defaultRate: number;
  currency: string;
  userName?: string; // Added for user's name
  userBankAccount?: string; // Added for user's bank account details
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

export type ActiveView = 'dashboard' | 'settings';

// Structure for exporting/importing all app data
export interface AppDataDump {
  invoices: Invoice[];
  settings: AppSettings;
}

// html2pdf.js is loaded via CDN, declare its type for TypeScript
declare global {
  interface Window {
    html2pdf: any; // Simplified type for html2pdf
  }
}