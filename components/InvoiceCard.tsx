import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/formatters';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import { useAppContext } from '../store/AppContext';

interface InvoiceCardProps {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onExport: (invoice: Invoice) => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onEdit, onDelete, onExport }) => {
  const { settings, duplicateInvoice, setInvoiceStatus } = useAppContext();
  const totalAmount = invoice.hours * invoice.rate;
  const due = invoice.dueDate ? new Date(invoice.dueDate + 'T00:00:00') : null;
  const isOverdue = invoice.status === 'sent' && due && due.getTime() < new Date().setHours(0, 0, 0, 0);
  const visualStatus = isOverdue ? 'overdue' : (invoice.status || 'draft');

  const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    sent: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    overdue: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">#{invoice.id.slice(0, 8)}</p>
            <h3 className="mt-1 truncate text-base font-bold tracking-tight text-slate-950 dark:text-white">{invoice.projectName}</h3>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{invoice.clientName || 'No client'}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusStyles[visualStatus]}`}>
            {visualStatus}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white">{formatCurrency(totalAmount, settings.currency)}</p>
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p>{invoice.hours.toFixed(2)}h × {formatCurrency(invoice.rate, settings.currency)}</p>
            <p className="mt-1">{due ? `Due ${due.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}` : 'No due date'}</p>
          </div>
        </div>

        {invoice.clientEmail && <p className="mt-4 truncate text-xs text-slate-400">{invoice.clientEmail}</p>}
      </div>

      <div className="flex items-center gap-1 border-t border-slate-100 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-white/[0.02]">
        <button onClick={() => onEdit(invoice)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">Edit</button>
        <button onClick={() => onExport(invoice)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
          <DownloadIcon className="h-3.5 w-3.5" /> PDF
        </button>
        <button onClick={() => duplicateInvoice(invoice.id)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">Duplicate</button>

        <div className="ml-auto flex items-center gap-1">
          {visualStatus === 'draft' && (
            <button onClick={() => setInvoiceStatus(invoice.id, 'sent')} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 dark:bg-white dark:text-black dark:hover:bg-red-500 dark:hover:text-white">Mark sent</button>
          )}
          {(visualStatus === 'sent' || visualStatus === 'overdue') && (
            <button onClick={() => setInvoiceStatus(invoice.id, 'paid')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700">Mark paid</button>
          )}
          {visualStatus === 'paid' && (
            <button onClick={() => setInvoiceStatus(invoice.id, 'sent')} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white dark:hover:bg-white/10">Reopen</button>
          )}
          <button onClick={() => onDelete(invoice.id)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" aria-label="Delete invoice">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default InvoiceCard;
