import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import { ActiveView, Invoice, InvoiceStatus } from './types';
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
import TrashIcon from './components/icons/TrashIcon';
import { SUPPORTED_CURRENCIES } from './constants';
import DownloadIcon from './components/icons/DownloadIcon';
import UploadIcon from './components/icons/UploadIcon';
import logo from './components/icons/logo.png';
import logoDark from './components/icons/logo_dark.png';

type InvoiceFilter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const NavGlyph: React.FC<{ view: ActiveView; className?: string }> = ({ view, className = 'h-4 w-4' }) => {
  const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 } as const;

  if (view === 'dashboard') return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z" /></svg>;
  if (view === 'invoices') return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l3 3v15H6V3Zm9 0v4h4M9 11h6M9 15h6" /></svg>;
  if (view === 'timer') return <svg {...common}><circle cx="12" cy="13" r="8" /><path strokeLinecap="round" d="M12 9v4l3 2M9 2h6" /></svg>;
  return <SettingsIcon className={className} />;
};

const AppContent: React.FC = () => {
  const {
    invoices,
    deleteInvoice,
    settings,
    updateSettings,
    timer,
    startTimer,
    stopTimer,
    resetTimer,
    activeView,
    setActiveView,
    addToast,
    resetAllData,
    exportAppData,
    importAppData,
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [localTimerDisplay, setLocalTimerDisplay] = useState('00:00:00');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (timer.isActive && timer.startTime) {
      const updateDisplay = () => {
        const currentElapsed = Math.floor((Date.now() - (timer.startTime ?? 0)) / 1000);
        setLocalTimerDisplay(formatTime(timer.elapsedSeconds + currentElapsed));
      };
      updateDisplay();
      intervalId = setInterval(updateDisplay, 1000);
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

  const invoiceAmount = (invoice: Invoice) => invoice.hours * invoice.rate;

  const isInvoiceOverdue = (invoice: Invoice) => {
    if (invoice.status !== 'sent' || !invoice.dueDate) return false;
    const due = new Date(invoice.dueDate + 'T00:00:00').getTime();
    return due < new Date().setHours(0, 0, 0, 0);
  };

  const visualStatus = (invoice: Invoice): InvoiceFilter => {
    if (isInvoiceOverdue(invoice)) return 'overdue';
    return (invoice.status || 'draft') as InvoiceFilter;
  };

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()),
    [invoices]
  );

  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0);
    const paid = invoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoiceAmount(invoice), 0);
    const outstanding = invoices
      .filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoiceAmount(invoice), 0);
    const overdue = invoices.filter(isInvoiceOverdue).reduce((sum, invoice) => sum + invoiceAmount(invoice), 0);
    const totalHours = invoices.reduce((sum, invoice) => sum + invoice.hours, 0);
    return { totalBilled, paid, outstanding, overdue, totalHours };
  }, [invoices]);

  const clientSummary = useMemo(() => {
    const clients = new Map<string, { name: string; total: number; invoices: number }>();
    invoices.forEach(invoice => {
      const name = invoice.clientName?.trim() || 'No client';
      const current = clients.get(name) || { name, total: 0, invoices: 0 };
      current.total += invoiceAmount(invoice);
      current.invoices += 1;
      clients.set(name, current);
    });
    return [...clients.values()].sort((a, b) => b.total - a.total).slice(0, 4);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return sortedInvoices.filter(invoice => {
      const matchesSearch = !query || [
        invoice.projectName,
        invoice.clientName || '',
        invoice.clientEmail || '',
        invoice.id,
      ].some(value => value.toLowerCase().includes(query));

      const matchesFilter = invoiceFilter === 'all' || visualStatus(invoice) === invoiceFilter;
      return matchesSearch && matchesFilter;
    });
  }, [sortedInvoices, searchTerm, invoiceFilter]);

  const handleExportPDF = (invoice: Invoice) => {
    const currentCurrency = settings.currency;
    const dueDate = invoice.dueDate
      ? new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString()
      : 'On receipt';

    const invoiceHTML = `
      <div style="font-family:Inter,Arial,sans-serif;padding:54px;color:#171717;max-width:820px;margin:auto;background:white">
        <div style="display:flex;justify-content:space-between;gap:32px;align-items:flex-start;margin-bottom:54px">
          <div>
            <div style="font-size:13px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#ef4444;margin-bottom:10px">INVOICR</div>
            <h1 style="margin:0;font-size:36px;letter-spacing:-.04em">Invoice</h1>
          </div>
          <div style="text-align:right;color:#737373;font-size:13px;line-height:1.7">
            <div>#${invoice.id.substring(0, 8)}</div>
            <div>Created ${new Date(invoice.dateCreated).toLocaleDateString()}</div>
            <div>Due ${dueDate}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:46px">
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#a3a3a3;margin-bottom:9px">From</div>
            <div style="font-weight:700">${settings.userName || 'Your business'}</div>
            ${settings.userBankAccount ? `<div style="white-space:pre-line;margin-top:8px;color:#737373;font-size:13px">${settings.userBankAccount}</div>` : ''}
          </div>
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#a3a3a3;margin-bottom:9px">Bill to</div>
            <div style="font-weight:700">${invoice.clientName || 'Client'}</div>
            ${invoice.clientEmail ? `<div style="margin-top:5px;color:#737373;font-size:13px">${invoice.clientEmail}</div>` : ''}
          </div>
        </div>

        <div style="border:1px solid #e5e5e5;border-radius:14px;overflow:hidden">
          <div style="display:grid;grid-template-columns:1fr 90px 130px 140px;background:#fafafa;padding:13px 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#737373">
            <span>Description</span><span style="text-align:right">Hours</span><span style="text-align:right">Rate</span><span style="text-align:right">Amount</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 90px 130px 140px;padding:20px 16px;border-top:1px solid #e5e5e5;align-items:center">
            <span style="font-weight:650">${invoice.projectName}</span>
            <span style="text-align:right">${invoice.hours.toFixed(2)}</span>
            <span style="text-align:right">${formatCurrency(invoice.rate, currentCurrency)}</span>
            <span style="text-align:right;font-weight:750">${formatCurrency(invoiceAmount(invoice), currentCurrency)}</span>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:28px">
          <div style="width:310px">
            <div style="display:flex;justify-content:space-between;align-items:end;border-top:2px solid #171717;padding-top:16px">
              <span style="font-size:13px;font-weight:700">Total due</span>
              <span style="font-size:26px;font-weight:850;letter-spacing:-.04em">${formatCurrency(invoiceAmount(invoice), currentCurrency)}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `<div style="margin-top:42px;border-left:3px solid #ef4444;padding-left:14px;color:#737373;font-size:13px;line-height:1.7"><strong style="color:#404040">Notes</strong><br/>${invoice.notes}</div>` : ''}
        <div style="margin-top:64px;color:#a3a3a3;font-size:11px">Thank you for your business.</div>
      </div>
    `;

    if (window.html2pdf) {
      window.html2pdf().from(invoiceHTML).set({
        margin: [8, 8, 8, 8],
        filename: `Invoice-${invoice.projectName.replace(/\s+/g, '_')}-${invoice.id.substring(0, 8)}.pdf`,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        html2canvas: { scale: 2, useCORS: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).save();
      addToast('Invoice PDF exported.', 'success');
    } else {
      addToast('PDF export library is unavailable.', 'error');
    }
  };

  const navItems: { view: ActiveView; label: string }[] = [
    { view: 'dashboard', label: 'Overview' },
    { view: 'invoices', label: 'Invoices' },
    { view: 'timer', label: 'Time tracker' },
    { view: 'settings', label: 'Settings' },
  ];

  const pageMeta: Record<ActiveView, { eyebrow: string; title: string; subtitle: string }> = {
    dashboard: {
      eyebrow: 'Workspace',
      title: settings.userName ? `Hey, ${settings.userName.split(' ')[0]}` : 'Your money, at a glance',
      subtitle: 'Track work, send invoices, and keep an eye on what needs attention.',
    },
    invoices: {
      eyebrow: 'Billing',
      title: 'Invoices',
      subtitle: 'Everything billed, searchable and actionable in one place.',
    },
    timer: {
      eyebrow: 'Time',
      title: 'Time tracker',
      subtitle: 'Stay focused, then turn tracked time into something billable.',
    },
    settings: {
      eyebrow: 'Preferences',
      title: 'Settings',
      subtitle: 'Your invoice defaults, payment details, and local data.',
    },
  };

  const TimerPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    const elapsedHours = timer.elapsedSeconds / 3600;
    const estimate = elapsedHours * settings.defaultRate;

    return (
      <div className={compact
        ? 'rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white dark:border-white/10'
        : 'relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] dark:border-white/10 sm:p-9'
      }>
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-red-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{timer.isActive ? 'Tracking now' : 'Ready when you are'}</p>
              {!compact && <p className="mt-1 text-sm text-white/55">One timer. Zero friction.</p>}
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${timer.isActive ? 'animate-pulse bg-emerald-400' : 'bg-white/20'}`} />
          </div>

          <div className={compact ? 'mt-5 font-mono text-4xl font-bold tracking-[-0.05em]' : 'mt-10 font-mono text-6xl font-bold tracking-[-0.06em] sm:text-7xl'}>
            {localTimerDisplay}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {!timer.isActive ? (
              <button onClick={startTimer} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-red-500 hover:text-white">
                <PlayIcon className="h-4 w-4" /> Start
              </button>
            ) : (
              <button onClick={stopTimer} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600">
                <PauseIcon className="h-4 w-4" /> Stop
              </button>
            )}
            <button
              onClick={resetTimer}
              disabled={timer.elapsedSeconds === 0 && !timer.isActive}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <TrashIcon className="h-4 w-4" /> Reset
            </button>
            {timer.elapsedSeconds > 0 && !timer.isActive && (
              <button onClick={openModalForNew} className="ml-auto rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
                Bill this time →
              </button>
            )}
          </div>

          {!compact && (
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
              <div>
                <p className="text-xs text-white/40">Tracked</p>
                <p className="mt-1 text-lg font-bold">{elapsedHours.toFixed(2)} h</p>
              </div>
              <div>
                <p className="text-xs text-white/40">At default rate</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(estimate, settings.currency)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const EmptyInvoices = () => (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-white/[0.02]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-xl dark:bg-white/10">↗</div>
      <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Your first invoice takes a minute</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Add a client, your hours, and a rate. Invoicr handles the total, due date, PDF, and status tracking.</p>
      <GradientButton onClick={openModalForNew} className="mx-auto mt-6">
        <PlusIcon className="h-4 w-4" /> Create invoice
      </GradientButton>
    </div>
  );

  const DashboardView = () => {
    const recentInvoices = sortedInvoices.slice(0, 3);

    const cards = [
      { label: 'Total billed', value: stats.totalBilled, note: `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}` },
      { label: 'Outstanding', value: stats.outstanding, note: stats.overdue > 0 ? `${formatCurrency(stats.overdue, settings.currency)} overdue` : 'Nothing overdue' },
      { label: 'Paid', value: stats.paid, note: 'Collected so far' },
    ];

    return (
      <div className="space-y-8">
        <section className="grid gap-3 md:grid-cols-3">
          {cards.map((card, index) => (
            <div key={card.label} className={`rounded-2xl border p-5 ${index === 1 && stats.overdue > 0 ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/[0.05]' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.025]'}`}>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white">{formatCurrency(card.value, settings.currency)}</p>
              <p className={`mt-2 text-xs ${index === 1 && stats.overdue > 0 ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{card.note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
          <TimerPanel compact />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Billing pulse</p>
                <p className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white">{stats.totalHours.toFixed(1)} hours invoiced</p>
              </div>
              <button onClick={() => setActiveView('invoices')} className="text-xs font-bold text-red-500 hover:text-red-600">View all →</button>
            </div>

            <div className="mt-6 space-y-4">
              {[
                { label: 'Paid', amount: stats.paid, total: stats.totalBilled, bar: 'bg-emerald-500' },
                { label: 'Outstanding', amount: stats.outstanding, total: stats.totalBilled, bar: 'bg-blue-500' },
                { label: 'Overdue', amount: stats.overdue, total: stats.totalBilled, bar: 'bg-red-500' },
              ].map(item => {
                const percentage = item.total > 0 ? Math.min(100, (item.amount / item.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(item.amount, settings.currency)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">Recent invoices</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your latest billing activity.</p>
              </div>
              <button onClick={() => setActiveView('invoices')} className="text-xs font-bold text-slate-500 transition hover:text-red-500">Open workspace</button>
            </div>

            {recentInvoices.length === 0 ? <EmptyInvoices /> : (
              <div className="space-y-3">
                {recentInvoices.map(invoice => (
                  <InvoiceCard key={invoice.id} invoice={invoice} onEdit={openModalForEdit} onDelete={deleteInvoice} onExport={handleExportPDF} />
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Top clients</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">By billed</span>
            </div>
            <div className="mt-5 space-y-1">
              {clientSummary.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Client insights appear after your first invoice.</p>
              ) : clientSummary.map((client, index) => (
                <div key={client.name} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600 dark:bg-white/10 dark:text-slate-300">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.invoices} invoice{client.invoices === 1 ? '' : 's'}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">{formatCurrency(client.total, settings.currency)}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    );
  };

  const InvoicesView = () => {
    const filters: { id: InvoiceFilter; label: string; count: number }[] = [
      { id: 'all', label: 'All', count: invoices.length },
      { id: 'draft', label: 'Draft', count: invoices.filter(invoice => visualStatus(invoice) === 'draft').length },
      { id: 'sent', label: 'Sent', count: invoices.filter(invoice => visualStatus(invoice) === 'sent').length },
      { id: 'overdue', label: 'Overdue', count: invoices.filter(invoice => visualStatus(invoice) === 'overdue').length },
      { id: 'paid', label: 'Paid', count: invoices.filter(invoice => visualStatus(invoice) === 'paid').length },
    ];

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-4-4" />
            </svg>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search project, client, email, invoice ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:border-red-500/50"
            />
          </div>

          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.03]">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setInvoiceFilter(filter.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${invoiceFilter === filter.id ? 'bg-slate-950 text-white dark:bg-white dark:text-black' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'}`}
              >
                {filter.label} <span className="ml-1 opacity-50">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-y border-slate-100 py-3 text-xs text-slate-400 dark:border-white/10">
          <span>{filteredInvoices.length} shown</span>
          <span>{formatCurrency(filteredInvoices.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0), settings.currency)} visible value</span>
        </div>

        {invoices.length === 0 ? <EmptyInvoices /> : filteredInvoices.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <p className="font-bold text-slate-800 dark:text-slate-100">Nothing matches that view.</p>
            <button onClick={() => { setSearchTerm(''); setInvoiceFilter('all'); }} className="mt-3 text-sm font-bold text-red-500">Clear filters</button>
          </div>
        ) : (
          <div className="grid gap-3 2xl:grid-cols-2">
            {filteredInvoices.map(invoice => (
              <InvoiceCard key={invoice.id} invoice={invoice} onEdit={openModalForEdit} onDelete={deleteInvoice} onExport={handleExportPDF} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const TimerView = () => (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <TimerPanel />
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.025]">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fast workflow</p>
          <div className="mt-4 space-y-3">
            {[
              ['1', 'Start the timer', 'Focus on the work, not admin.'],
              ['2', 'Stop when done', 'Your time stays saved locally.'],
              ['3', 'Create invoice', 'Use tracked time in one click.'],
            ].map(([number, title, text]) => (
              <div key={number} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-500 dark:bg-white/10">{number}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={openModalForNew} className="w-full rounded-2xl border border-red-200 bg-red-50 p-5 text-left transition hover:border-red-300 hover:bg-red-100/70 dark:border-red-500/20 dark:bg-red-500/[0.06] dark:hover:bg-red-500/[0.1]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-500">Quick action</p>
          <p className="mt-2 font-bold text-slate-950 dark:text-white">Create invoice from work →</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Open the invoice form and apply your stopped tracked time.</p>
        </button>
      </aside>
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

    const input = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white';
    const label = 'block text-[11px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400';

    const handleSaveSettings = () => {
      updateSettings({
        defaultRate: currentRate,
        currency: currentCurrency,
        userName: currentUserName,
        userBankAccount: currentUserBankAccount,
      });
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        if (content) importAppData(content);
      };
      reader.onerror = () => addToast('Could not read backup file.', 'error');
      reader.readAsText(file);
      event.target.value = '';
    };

    return (
      <div className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-white/[0.025]">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Invoice defaults</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Used whenever you create a fresh invoice.</p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="defaultRate">Default hourly rate</label>
              <input id="defaultRate" type="number" min="0" step="0.01" value={currentRate} onChange={e => setCurrentRate(parseFloat(e.target.value) || 0)} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="currency">Currency</label>
              <select id="currency" value={currentCurrency} onChange={e => setCurrentCurrency(e.target.value)} className={input}>
                {SUPPORTED_CURRENCIES.map(currency => <option key={currency.code} value={currency.code}>{currency.name} ({currency.symbol})</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="userName">Your / business name</label>
              <input id="userName" value={currentUserName} onChange={e => setCurrentUserName(e.target.value)} className={input} placeholder="Jessen Reinhart" />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="bankAccount">Payment details</label>
              <textarea id="bankAccount" value={currentUserBankAccount} onChange={e => setCurrentUserBankAccount(e.target.value)} rows={5} className={input} placeholder={'Bank name\nAccount number\nAccount holder'} />
              <p className="mt-2 text-xs text-slate-400">Printed on exported invoice PDFs.</p>
            </div>
          </div>

          <GradientButton onClick={handleSaveSettings} className="mt-6">Save preferences</GradientButton>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">Your data</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Invoicr is local-first. Export a JSON backup whenever you want.</p>
            <div className="mt-4 grid gap-2">
              <button onClick={exportAppData} className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]">
                <span className="inline-flex items-center gap-2"><DownloadIcon className="h-4 w-4" /> Export backup</span><span className="text-slate-300">→</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.04]">
                <span className="inline-flex items-center gap-2"><UploadIcon className="h-4 w-4" /> Import backup</span><span className="text-slate-300">→</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </div>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/[0.05]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Danger zone</p>
            <h2 className="mt-2 text-sm font-bold text-slate-950 dark:text-white">Reset local workspace</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Deletes invoices, timer data, and preferences from this browser.</p>
            <button
              onClick={() => {
                if (window.confirm('Delete all local Invoicr data? This cannot be undone.')) resetAllData();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4" /> Reset everything
            </button>
          </section>
        </div>
      </div>
    );
  };

  const renderView = () => {
    if (activeView === 'invoices') return <InvoicesView />;
    if (activeView === 'timer') return <TimerView />;
    if (activeView === 'settings') return <SettingsView />;
    return <DashboardView />;
  };

  const meta = pageMeta[activeView];

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-slate-950 transition-colors dark:bg-[#09090b] dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="sticky top-0 hidden h-screen w-[238px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-4 dark:border-white/10 dark:bg-[#0c0c0f] md:flex">
          <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-left">
            <img src={logo} alt="" className="h-8 w-auto dark:hidden" />
            <img src={logoDark} alt="" className="hidden h-8 w-auto dark:block" />
            <span className="text-lg font-extrabold tracking-[-0.04em]">Invoicr</span>
          </button>

          <button onClick={openModalForNew} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 dark:bg-white dark:text-black dark:hover:bg-red-500 dark:hover:text-white">
            <PlusIcon className="h-4 w-4" /> New invoice
          </button>

          <nav className="mt-6 space-y-1">
            {navItems.map(item => {
              const selected = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${selected ? 'bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'}`}
                >
                  <NavGlyph view={item.view} />
                  {item.label}
                  {item.view === 'invoices' && invoices.length > 0 && <span className="ml-auto text-[10px] font-bold text-slate-400">{invoices.length}</span>}
                  {item.view === 'timer' && timer.isActive && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            {stats.overdue > 0 && (
              <button onClick={() => { setActiveView('invoices'); setInvoiceFilter('overdue'); }} className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-left dark:border-red-500/20 dark:bg-red-500/[0.05]">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Needs attention</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(stats.overdue, settings.currency)} overdue</p>
              </button>
            )}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{settings.userName || 'Local workspace'}</p>
                <p className="text-[10px] text-slate-400">Saved in this browser</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f7f8]/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#09090b]/90 md:hidden">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2">
                <img src={logo} alt="" className="h-7 w-auto dark:hidden" />
                <img src={logoDark} alt="" className="hidden h-7 w-auto dark:block" />
                <span className="font-extrabold tracking-[-0.04em]">Invoicr</span>
              </button>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button onClick={openModalForNew} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-black" aria-label="New invoice">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto">
              {navItems.map(item => (
                <button key={item.view} onClick={() => setActiveView(item.view)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${activeView === item.view ? 'bg-slate-950 text-white dark:bg-white dark:text-black' : 'text-slate-500'}`}>
                  <NavGlyph view={item.view} className="h-3.5 w-3.5" /> {item.label}
                </button>
              ))}
            </nav>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-red-500">{meta.eyebrow}</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl">{meta.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{meta.subtitle}</p>
              </div>
              {activeView !== 'settings' && (
                <GradientButton onClick={openModalForNew} className="hidden sm:inline-flex">
                  <PlusIcon className="h-4 w-4" /> New invoice
                </GradientButton>
              )}
            </div>

            {renderView()}
          </div>

          <footer className="px-4 pb-8 pt-4 text-center text-[11px] text-slate-400">
            Local-first invoicing by <a href="https://jessenreinhart.github.io" target="_blank" rel="noopener noreferrer" className="font-semibold transition hover:text-red-500">Jessen</a>
          </footer>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? 'Edit invoice' : 'New invoice'}
        size="lg"
      >
        <InvoiceForm onClose={() => setIsModalOpen(false)} invoiceToEdit={editingInvoice} />
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
