
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

  return (
    <div className="rainbow-border-card shadow-md shadow-purple-500/10 dark:shadow-purple-400/5">
      <div className="rainbow-border-card-inner bg-white dark:bg-slate-800/70 p-4 sm:p-5 h-full flex flex-col justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 mb-1.5">{invoice.projectName}</h3>
          {invoice.clientName && <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Client: {invoice.clientName}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">Date: {new Date(invoice.dateCreated).toLocaleDateString()}</p>

          <div className="my-3 space-y-0.5">
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Hours:</span> <span className="text-slate-800 dark:text-slate-100">{invoice.hours.toFixed(2)}</span></p>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Rate:</span> <span className="text-slate-800 dark:text-slate-100">{formatCurrency(invoice.rate, settings.currency)}</span></p>
            <p className="text-md font-semibold"><span className="font-medium text-slate-700 dark:text-slate-200">Total:</span> <span className="text-slate-900 dark:text-slate-50">{formatCurrency(totalAmount, settings.currency)}</span></p>
          </div>

          {invoice.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">Notes: {invoice.notes}</p>}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-2 justify-end">
          <GradientButton variant="secondary" onClick={() => onEdit(invoice)} className="text-xs px-3 py-1.5">
            <PlusIcon className="w-3.5 h-3.5 mr-1" /> Edit
          </GradientButton>
          <GradientButton variant="secondary" onClick={() => onExport(invoice)} className="text-xs px-3 py-1.5">
            <DownloadIcon className="w-3.5 h-3.5 mr-1" /> PDF
          </GradientButton>
          <button
            onClick={() => onDelete(invoice.id)}
            className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-500/80 dark:hover:text-red-400 rounded-md hover:bg-red-100/60 dark:hover:bg-red-500/20 transition-colors"
            aria-label="Delete invoice"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;