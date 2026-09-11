
import React from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/formatters';
import GradientButton from './GradientButton';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import { useAppContext } from '../store/AppContext';

interface InvoiceCardProps {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onExport: (invoice: Invoice) => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onEdit, onDelete, onExport }) => {
  const { settings } = useAppContext();
  const totalAmount = invoice.hours * invoice.rate;
  const date = new Date(invoice.dateCreated);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-white/20 dark:hover:bg-white/[0.05]">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 opacity-80" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Invoice #{invoice.id.substring(0, 8)}
          </p>
          <h3 className="truncate text-lg font-bold tracking-tight text-slate-950 dark:text-white">
            {invoice.projectName}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {invoice.clientName || 'No client specified'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
          Saved locally
        </span>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Amount</p>
        <p className="mt-0.5 text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
          {formatCurrency(totalAmount, settings.currency)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hours</p>
          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{invoice.hours.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rate</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(invoice.rate, settings.currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Created</p>
          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</p>
        </div>
      </div>

      {invoice.notes && (
        <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {invoice.notes}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
        <GradientButton variant="secondary" onClick={() => onEdit(invoice)} className="flex-1 px-3 py-2 text-xs">
          <PlusIcon className="h-3.5 w-3.5" /> Edit
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => onExport(invoice)} className="flex-1 px-3 py-2 text-xs">
          <DownloadIcon className="h-3.5 w-3.5" /> PDF
        </GradientButton>
        <button
          onClick={() => onDelete(invoice.id)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          aria-label="Delete invoice"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

export default InvoiceCard;