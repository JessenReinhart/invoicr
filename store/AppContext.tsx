
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme, Invoice, AppSettings, TimerState, ToastMessage, ActiveView, AppDataDump } from '../types';
import { LOCAL_STORAGE_KEYS, DEFAULT_HOURLY_RATE, DEFAULT_CURRENCY } from '../constants';
import { secondsToHours } from '../utils/formatters';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'dateCreated'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  timer: TimerState;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  applyTrackedTimeToInvoice: () => number; // Returns hours
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  resetAllData: () => void;
  exportAppData: () => void;
  importAppData: (jsonData: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  // Load initial state from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, initialTheme);
    }

    const storedInvoices = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
    if (storedInvoices) setInvoices(JSON.parse(storedInvoices));

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state to localStorage
  const saveData = useCallback(<T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.THEME, theme); }, [theme, saveData]);
  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.INVOICES, invoices); }, [invoices, saveData]);
  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.SETTINGS, settings); }, [settings, saveData]);
  useEffect(() => { saveData(LOCAL_STORAGE_KEYS.TIMER, timer.elapsedSeconds); }, [timer.elapsedSeconds, saveData]);


  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(currToasts => currToasts.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'dateCreated'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
    };
    setInvoices(prev => [...prev, newInvoice]);
    addToast('Invoice created successfully!', 'success');
  }, [addToast]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    addToast('Invoice updated successfully!', 'success');
  }, [addToast]);
  
  const getInvoiceById = useCallback((invoiceId: string) => {
    return invoices.find(inv => inv.id === invoiceId);
  }, [invoices]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    addToast('Invoice deleted.', 'info');
  }, [addToast]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addToast('Settings updated.', 'success');
  }, [addToast]);

  const startTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, startTime: Date.now(), isActive: true }));
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
    addToast(`Applied ${hours.toFixed(2)} hours from timer. Timer reset.`, 'success');
    return hours;
  }, [timer.elapsedSeconds, addToast]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (timer.isActive && timer.startTime) {
      // Interval not strictly needed for elapsedSeconds calculation for persistence
      // but good for live display updates if AppContext directly managed it.
      // Current live display is handled in AppContent.
    }
    return () => clearInterval(intervalId);
  }, [timer.isActive, timer.startTime]);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.INVOICES);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER);
    setInvoices([]);
    setSettings({ 
        defaultRate: DEFAULT_HOURLY_RATE, 
        currency: DEFAULT_CURRENCY,
        userName: '',
        userBankAccount: '' 
    });
    setTimer({ startTime: null, elapsedSeconds: 0, isActive: false });
    addToast('All application data has been reset.', 'warning');
    setActiveView('dashboard');
  }, [addToast]);

  const exportAppData = useCallback(() => {
    const appData: AppDataDump = {
      invoices,
      settings,
    };
    const jsonString = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoicr_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Application data exported successfully!', 'success');
  }, [invoices, settings, addToast]);

  const importAppData = useCallback((jsonData: string) => {
    if (!window.confirm("Are you sure you want to import data? This will overwrite all current invoices and settings.")) {
      return;
    }
    try {
      const parsedData = JSON.parse(jsonData) as AppDataDump;
      // Basic validation
      if (typeof parsedData === 'object' && parsedData !== null &&
          Array.isArray(parsedData.invoices) &&
          typeof parsedData.settings === 'object' && parsedData.settings !== null &&
          typeof parsedData.settings.defaultRate === 'number' &&
          typeof parsedData.settings.currency === 'string') {
        
        setInvoices(parsedData.invoices);
        // Ensure all settings fields are present, defaulting if necessary
        setSettings({
            defaultRate: parsedData.settings.defaultRate || DEFAULT_HOURLY_RATE,
            currency: parsedData.settings.currency || DEFAULT_CURRENCY,
            userName: parsedData.settings.userName || '',
            userBankAccount: parsedData.settings.userBankAccount || '',
        });
        // Persist immediately (useEffect might be batched)
        saveData(LOCAL_STORAGE_KEYS.INVOICES, parsedData.invoices);
        saveData(LOCAL_STORAGE_KEYS.SETTINGS, {
            defaultRate: parsedData.settings.defaultRate || DEFAULT_HOURLY_RATE,
            currency: parsedData.settings.currency || DEFAULT_CURRENCY,
            userName: parsedData.settings.userName || '',
            userBankAccount: parsedData.settings.userBankAccount || '',
        });

        addToast('Application data imported successfully!', 'success');
        setActiveView('dashboard'); // Navigate to dashboard to see changes
      } else {
        throw new Error('Invalid data structure.');
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      addToast(`Error importing data: ${error instanceof Error ? error.message : 'Invalid JSON file.'}`, 'error');
    }
  }, [addToast, saveData]);


  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      invoices, addInvoice, updateInvoice, deleteInvoice, getInvoiceById,
      settings, updateSettings,
      timer, startTimer, stopTimer, resetTimer, applyTrackedTimeToInvoice,
      toasts, addToast,
      activeView, setActiveView,
      resetAllData,
      exportAppData, importAppData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};