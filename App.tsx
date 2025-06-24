
import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import { Invoice } from './types';
import ThemeToggle from './components/ThemeToggle';
import GradientButton from './components/GradientButton';
import Modal from './components/Modal';
import InvoiceForm from './components/InvoiceForm';
import InvoiceCard from './components/InvoiceCard';
import ToastContainer from './components/ToastContainer';
import { formatTime, formatCurrency } from './utils/formatters';
import PlayIcon from './components/icons/PlayIcon';
import PauseIcon from './components/icons/PauseIcon';
import PlusIcon from './components/icons/PlusIcon';
import SettingsIcon from './components/icons/SettingsIcon';
import ChevronLeftIcon from './components/icons/ChevronLeftIcon';
import TrashIcon from './components/icons/TrashIcon';
import { SUPPORTED_CURRENCIES } from './constants';
import DownloadIcon from './components/icons/DownloadIcon'; // For export button
import UploadIcon from './components/icons/UploadIcon';
import logo from './components/icons/logo.png';
import logoDark from './components/icons/logo_dark.png';

const AppContent: React.FC = () => {
  const {
    invoices, deleteInvoice,
    settings, updateSettings,
    timer, startTimer, stopTimer, resetTimer,
    activeView, setActiveView,
    addToast, resetAllData,
    exportAppData, importAppData
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [localTimerDisplay, setLocalTimerDisplay] = useState('00:00:00');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (timer.isActive && timer.startTime) {
      intervalId = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - (timer.startTime ?? 0)) / 1000);
        setLocalTimerDisplay(formatTime(timer.elapsedSeconds + currentElapsed));
      }, 1000);
    } else {
      setLocalTimerDisplay(formatTime(timer.elapsedSeconds));
    }
    return () => clearInterval(intervalId);
  }, [timer.isActive, timer.startTime, timer.elapsedSeconds]);


  const openModalForNew = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleExportPDF = (invoice: Invoice) => {
    const currentCurrency = settings.currency;
    const { userName, userBankAccount } = settings;

    const userInfoHTML = (userName || userBankAccount) ? `
      <div style="text-align: left; margin-bottom: 20px; font-size: 0.9em; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        ${userName ? `<p style="margin:0 0 5px 0;"><strong>Payment To:</strong> ${userName}</p>` : ''}
        ${userBankAccount ? `<p style="margin:0;"><strong>Bank Details:</strong> ${userBankAccount.replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    ` : '';

    const invoiceHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; width: 100%; max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h1 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">INVOICE</h1>
        ${userInfoHTML}
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h2 style="margin: 0 0 10px 0;">${invoice.projectName}</h2>
            ${invoice.clientName ? `<p style="margin: 0;">Client: ${invoice.clientName}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p style="margin:0;">Invoice ID: ${invoice.id.substring(0, 8)}</p>
            <p style="margin:0;">Date: ${new Date(invoice.dateCreated).toLocaleDateString()}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Hours</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Rate</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">${invoice.projectName} Services</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${invoice.hours.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(invoice.rate, currentCurrency)}</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(invoice.hours * invoice.rate, currentCurrency)}</td>
            </tr>
          </tbody>
        </table>
        ${invoice.notes ? `<div style="margin-bottom: 30px; padding: 10px; border-left: 3px solid #8b5cf6; background-color: #f8f9fa;"><p style="margin:0;"><strong>Notes:</strong> ${invoice.notes}</p></div>` : ''}
        <div style="text-align: right; margin-top: 40px;">
          <h3 style="margin: 0;">Total Amount: ${formatCurrency(invoice.hours * invoice.rate, currentCurrency)}</h3>
        </div>
        <div style="margin-top: 50px; text-align: center; font-size: 0.8em; color: #777;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;

    if (window.html2pdf) {
      window.html2pdf().from(invoiceHTML).set({
        margin: [15, 10, 15, 10],
        filename: `Invoice-${invoice.projectName.replace(/\s+/g, '_')}-${invoice.id.substring(0, 8)}.pdf`,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        html2canvas: { scale: 2, useCORS: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }).save();
      addToast('Invoice PDF exported!', 'success');
    } else {
      addToast('Error exporting PDF: html2pdf library not found.', 'error');
      console.error('html2pdf library not found. Ensure it is loaded.');
    }
  };

  const DashboardView = () => (
    <div className="space-y-10">
      <div className="rainbow-border-card shadow-glow-pink-purple dark:shadow-dark-glow-pink-purple">
        <div className="rainbow-border-card-inner bg-slate-50 dark:bg-slate-900 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Time Tracker</h2>
          <div className="text-5xl font-mono font-bold text-center my-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500">
            {localTimerDisplay}
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            {!timer.isActive ? (
              <GradientButton onClick={startTimer} className="w-full sm:w-auto">
                <PlayIcon className="w-5 h-5 mr-1.5" /> Start Timer
              </GradientButton>
            ) : (
              <GradientButton onClick={stopTimer} className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-orange-500/30 hover:shadow-orange-600/40">
                <PauseIcon className="w-5 h-5 mr-1.5" /> Stop Timer
              </GradientButton>
            )}
            <GradientButton onClick={resetTimer} variant="secondary" disabled={timer.elapsedSeconds === 0 && !timer.isActive} className="w-full sm:w-auto">
              <TrashIcon className="w-4 h-4 mr-1.5" /> Reset
            </GradientButton>
          </div>
          {timer.elapsedSeconds > 0 && !timer.isActive && (
            <p className="text-center mt-4 text-xs text-slate-500 dark:text-slate-400">
              Total tracked: {formatTime(timer.elapsedSeconds)}. Use this time in a new invoice.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-50">Invoices</h2>
          <GradientButton onClick={openModalForNew} className="text-sm">
            <PlusIcon className="w-4 h-4 mr-1.5" /> Add New Invoice
          </GradientButton>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-100">No invoices yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by creating a new invoice.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {invoices.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()).map(invoice => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onEdit={openModalForEdit}
                onDelete={deleteInvoice}
                onExport={handleExportPDF}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const SettingsView = () => {
    const [currentRate, setCurrentRate] = useState(settings.defaultRate);
    const [currentCurrency, setCurrentCurrency] = useState(settings.currency);
    const [currentUserName, setCurrentUserName] = useState(settings.userName || '');
    const [currentUserBankAccount, setCurrentUserBankAccount] = useState(settings.userBankAccount || '');


    useEffect(() => {
      setCurrentRate(settings.defaultRate);
      setCurrentCurrency(settings.currency);
      setCurrentUserName(settings.userName || '');
      setCurrentUserBankAccount(settings.userBankAccount || '');
    }, [settings]);


    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentRate(parseFloat(e.target.value) || 0);
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCurrentCurrency(e.target.value);
    const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentUserName(e.target.value);
    const handleUserBankAccountChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentUserBankAccount(e.target.value);


    const handleSaveSettings = () => {
      updateSettings({
        defaultRate: currentRate,
        currency: currentCurrency,
        userName: currentUserName,
        userBankAccount: currentUserBankAccount
      });
    };

    const handleResetData = () => {
      if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        resetAllData();
      }
    }

    const handleExportData = () => {
      exportAppData();
    }

    const triggerImportInput = () => {
      fileInputRef.current?.click();
    }

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            importAppData(content);
          } else {
            addToast('Could not read file content.', 'error');
          }
        };
        reader.onerror = () => {
          addToast('Error reading file.', 'error');
        }
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
      }
    }

    const commonInputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";
    const currencySymbol = formatCurrency(0, currentCurrency).replace(/[\d\.,\s]/g, '');

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1.5 mr-2 rounded-md text-purple-600 dark:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
            aria-label="Back to dashboard"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-50">Settings</h2>
        </div>

        <div className="rainbow-border-card shadow-glow-blue-purple dark:shadow-dark-glow-blue-purple">
          <div className="rainbow-border-card-inner bg-slate-50 dark:bg-slate-900 p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100 mb-1">General Settings</h3>
            <div>
              <label htmlFor="defaultRate" className={labelClasses}>Default Hourly Rate ({currencySymbol})</label>
              <input
                type="number"
                id="defaultRate"
                value={currentRate}
                onChange={handleRateChange}
                min="0"
                step="0.01"
                className={commonInputClasses}
              />
            </div>
            <div>
              <label htmlFor="currency" className={labelClasses}>Currency</label>
              <select
                id="currency"
                value={currentCurrency}
                onChange={handleCurrencyChange}
                className={commonInputClasses}
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="userName" className={labelClasses}>Your Name (for Invoices)</label>
              <input
                type="text"
                id="userName"
                value={currentUserName}
                onChange={handleUserNameChange}
                className={commonInputClasses}
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <label htmlFor="userBankAccount" className={labelClasses}>Your Bank Account Details (for Invoices)</label>
              <textarea
                id="userBankAccount"
                value={currentUserBankAccount}
                onChange={handleUserBankAccountChange}
                rows={3}
                className={commonInputClasses}
                placeholder="e.g., Bank Name, Account Number, SWIFT/BIC"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This information will be displayed on your PDF invoices.</p>
            </div>
            <GradientButton onClick={handleSaveSettings} className="w-full sm:w-auto text-sm">Save General Settings</GradientButton>
          </div>
        </div>

        <div className="rainbow-border-card">
          <div className="rainbow-border-card-inner bg-slate-50 dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Data Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Backup your data or import from a previous backup. Importing data will overwrite existing invoices and settings.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <GradientButton onClick={handleExportData} variant="secondary" className="w-full sm:w-auto text-sm">
                <DownloadIcon className="w-4 h-4 mr-1.5" /> Export All Data
              </GradientButton>
              <GradientButton onClick={triggerImportInput} variant="secondary" className="w-full sm:w-auto text-sm">
                <UploadIcon className="w-4 h-4 mr-1.5" /> Import Data from JSON
              </GradientButton>
              <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="rainbow-border-card">
          <div className="rainbow-border-card-inner bg-slate-50 dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Resetting data will permanently delete all your invoices and settings. This action cannot be undone.</p>
            <GradientButton
              onClick={handleResetData}
              className="w-full sm:w-auto text-sm bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-red-500/30 hover:shadow-red-600/40">
              <TrashIcon className="w-4 h-4 mr-1.5" /> Reset All Data
            </GradientButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={logo} alt="Invoicr Logo" className="h-8 sm:h-9 w-auto mr-2 sm:mr-3 block dark:hidden" />
              <img src={logoDark} alt="Invoicr Logo" className="h-8 sm:h-9 w-auto mr-2 sm:mr-3 hidden dark:block" />
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500">
                  Invoicr
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setActiveView('settings')}
                className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black transition-colors duration-150"
                aria-label="Open settings"
                title="Settings"
                disabled={activeView === 'settings'}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        &copy; {new Date().getFullYear()} Invoicr. Track time, get paid. | Made by <a href='https://jessenreinhart.github.io' target='_blank' rel='noopener noreferrer' className='underline hover:text-purple-500 dark:hover:text-purple-400 transition-colors'>Jessen</a>
      </footer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        size="lg"
      >
        <InvoiceForm
          onClose={() => setIsModalOpen(false)}
          invoiceToEdit={editingInvoice}
        />
      </Modal>
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;