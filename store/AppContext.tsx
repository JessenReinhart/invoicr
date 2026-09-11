import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme, Invoice, InvoiceStatus, AppSettings, TimerState, ToastMessage, ActiveView, AppDataDump } from '../types';
import { LOCAL_STORAGE_KEYS, DEFAULT_HOURLY_RATE, DEFAULT_CURRENCY } from '../constants';
import { secondsToHours } from '../utils/formatters';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'dateCreated'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  duplicateInvoice: (invoiceId: string) => void;
  setInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  timer: TimerState;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  applyTrackedTimeToInvoice: () => number;
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  resetAllData: () => void;
  exportAppData: () => void;
  importAppData: (jsonData: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeInvoice = (invoice: Invoice): Invoice => ({
  ...invoice,
  status: invoice.status || 'draft',
  clientEmail: invoice.clientEmail || '',
  dueDate: invoice.dueDate || '',
});

const normalizeInvoices = (items: Invoice[]) => items.map(normalizeInvoice);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultRate: DEFAULT_HOURLY_RATE,
    currency: DEFAULT_CURRENCY,
    userName: '',
    userBankAccount: '',
  });
  const [timer, setTimer] = useState<TimerState>({ startTime: null, elapsedSeconds: 0, isActive: false });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      const initialTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, initialTheme);
    }

    const storedInvoices = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
    if (storedInvoices) {
      try {
        setInvoices(normalizeInvoices(JSON.parse(storedInvoices)));
      } catch {
        setInvoices([]);
      }
    }

    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSettings({
        defaultRate: parsedSettings.defaultRate || DEFAULT_HOURLY_RATE,
        currency: parsedSettings.currency || DEFAULT_CURRENCY,
        userName: parsedSettings.userName || '',
        userBankAccount: parsedSettings.userBankAccount || '',
      });
    }

    const storedElapsedSeconds = localStorage.getItem(LOCAL_STORAGE_KEYS.TIMER);
    if (storedElapsedSeconds) {
      setTimer(prev => ({ ...prev, elapsedSeconds: JSON.parse(storedElapsedSeconds) }));
    }
  }, []);

  const saveData = useCallback(<T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.THEME, theme); }, [theme, saveData]);
  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.INVOICES, invoices); }, [invoices, saveData]);
  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.SETTINGS, settings); }, [settings, saveData]);
  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.TIMER, timer.elapsedSeconds); }, [timer.elapsedSeconds, saveData]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const nextTheme: Theme = prevTheme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      return nextTheme;
    });
  }, []);

  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(curr => curr.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'dateCreated'>) => {
    const newInvoice: Invoice = normalizeInvoice({
      ...invoiceData,
      status: invoiceData.status || 'draft',
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
    });
    setInvoices(prev => [newInvoice, ...prev]);
    addToast('Invoice created.', 'success');
  }, [addToast]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? normalizeInvoice(updatedInvoice) : inv));
    addToast('Invoice updated.', 'success');
  }, [addToast]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    addToast('Invoice deleted.', 'info');
  }, [addToast]);

  const duplicateInvoice = useCallback((invoiceId: string) => {
    const source = invoices.find(inv => inv.id === invoiceId);
    if (!source) return;
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 14);
    const duplicate: Invoice = {
      ...source,
      id: crypto.randomUUID(),
      projectName: `${source.projectName} Copy`,
      dateCreated: new Date().toISOString(),
      dueDate: nextDueDate.toISOString().slice(0, 10),
      status: 'draft',
    };
    setInvoices(prev => [duplicate, ...prev]);
    addToast('Invoice duplicated as a draft.', 'success');
  }, [invoices, addToast]);

  const setInvoiceStatus = useCallback((invoiceId: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status } : inv));
    addToast(
      status === 'paid' ? 'Invoice marked as paid.' : status === 'sent' ? 'Invoice marked as sent.' : 'Invoice moved to draft.',
      'success'
    );
  }, [addToast]);

  const getInvoiceById = useCallback((invoiceId: string) => invoices.find(inv => inv.id === invoiceId), [invoices]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addToast('Settings updated.', 'success');
  }, [addToast]);

  const startTimer = useCallback(() => {
    setTimer(prev => prev.isActive ? prev : { ...prev, startTime: Date.now(), isActive: true });
  }, []);

  const stopTimer = useCallback(() => {
    setTimer(prev => {
      if (!prev.startTime) return prev;
      const sessionDuration = Math.floor((Date.now() - prev.startTime) / 1000);
      return {
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + sessionDuration,
        startTime: null,
        isActive: false,
      };
    });
  }, []);

  const resetTimer = useCallback(() => {
    setTimer({ startTime: null, elapsedSeconds: 0, isActive: false });
    addToast('Timer reset.', 'info');
  }, [addToast]);

  const applyTrackedTimeToInvoice = useCallback((): number => {
    const hours = secondsToHours(timer.elapsedSeconds);
    setTimer(prev => ({ ...prev, elapsedSeconds: 0 }));
    if (hours > 0) addToast(`Added ${hours.toFixed(2)} tracked hours.`, 'success');
    return hours;
  }, [timer.elapsedSeconds, addToast]);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.INVOICES);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER);
    setInvoices([]);
    setSettings({
      defaultRate: DEFAULT_HOURLY_RATE,
      currency: DEFAULT_CURRENCY,
      userName: '',
      userBankAccount: '',
    });
    setTimer({ startTime: null, elapsedSeconds: 0, isActive: false });
    setActiveView('dashboard');
    addToast('All local app data has been reset.', 'warning');
  }, [addToast]);

  const exportAppData = useCallback(() => {
    const appData: AppDataDump = { invoices, settings };
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoicr_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Backup exported.', 'success');
  }, [invoices, settings, addToast]);

  const importAppData = useCallback((jsonData: string) => {
    if (!window.confirm('Import this backup? Current invoices and settings will be replaced.')) return;
    try {
      const parsedData = JSON.parse(jsonData) as AppDataDump;
      if (
        !parsedData ||
        !Array.isArray(parsedData.invoices) ||
        !parsedData.settings ||
        typeof parsedData.settings.defaultRate !== 'number' ||
        typeof parsedData.settings.currency !== 'string'
      ) {
        throw new Error('Invalid Invoicr backup.');
      }

      const nextInvoices = normalizeInvoices(parsedData.invoices);
      const nextSettings: AppSettings = {
        defaultRate: parsedData.settings.defaultRate || DEFAULT_HOURLY_RATE,
        currency: parsedData.settings.currency || DEFAULT_CURRENCY,
        userName: parsedData.settings.userName || '',
        userBankAccount: parsedData.settings.userBankAccount || '',
      };

      setInvoices(nextInvoices);
      setSettings(nextSettings);
      saveData(LOCAL_STORAGE_KEYS.INVOICES, nextInvoices);
      saveData(LOCAL_STORAGE_KEYS.SETTINGS, nextSettings);
      setActiveView('dashboard');
      addToast('Backup imported.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Could not import backup.', 'error');
    }
  }, [addToast, saveData]);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      invoices, addInvoice, updateInvoice, deleteInvoice, duplicateInvoice, setInvoiceStatus, getInvoiceById,
      settings, updateSettings,
      timer, startTimer, stopTimer, resetTimer, applyTrackedTimeToInvoice,
      toasts, addToast,
      activeView, setActiveView,
      resetAllData, exportAppData, importAppData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
