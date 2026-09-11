
import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { useAppContext } from '../store/AppContext';
import GradientButton from './GradientButton';
import { formatCurrency as utilFormatCurrency } from '../utils/formatters';

interface InvoiceFormProps {
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, invoiceToEdit }) => {
  const { addInvoice, updateInvoice, settings, applyTrackedTimeToInvoice, addToast } = useAppContext();
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [hours, setHours] = useState<number | string>('');
  const [rate, setRate] = useState<number | string>(settings.defaultRate);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (invoiceToEdit) {
      setProjectName(invoiceToEdit.projectName);
      setClientName(invoiceToEdit.clientName || '');
      setHours(invoiceToEdit.hours);
      setRate(invoiceToEdit.rate);
      setNotes(invoiceToEdit.notes || '');
    } else {
      setProjectName('');
      setClientName('');
      setHours('');
      setRate(settings.defaultRate);
      setNotes('');
    }
  }, [invoiceToEdit, settings.defaultRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericHours = parseFloat(hours as string);
    const numericRate = parseFloat(rate as string);

    if (!projectName.trim()) {
      addToast('Project name is required.', 'error');
      return;
    }
    if (isNaN(numericHours) || numericHours <= 0) {
      addToast('Please enter valid positive hours.', 'error');
      return;
    }
    if (isNaN(numericRate) || numericRate < 0) {
      addToast('Please enter a valid rate (0 or positive).', 'error');
      return;
    }

    const invoiceData = { projectName, clientName, hours: numericHours, rate: numericRate, notes };

    if (invoiceToEdit) updateInvoice({ ...invoiceToEdit, ...invoiceData });
    else addInvoice(invoiceData);

    onClose();
  };

  const handleApplyTrackedTime = () => {
    const trackedHours = applyTrackedTimeToInvoice();
    if (trackedHours > 0) setHours(trackedHours.toFixed(2));
    else addToast('No tracked time to apply or timer is still active.', 'info');
  };

  const commonInputClasses = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-950 shadow-inner shadow-slate-950/[0.02] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:placeholder:text-slate-600 dark:hover:border-white/20 dark:focus:border-red-500/60 dark:focus:bg-white/[0.05]";
  const labelClasses = "block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";
  const currencySymbol = utilFormatCurrency(0, settings.currency).replace(/[\d\.,\s]/g, '');

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="projectName" className={labelClasses}>Project</label>
          <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} required className={commonInputClasses} placeholder="Website redesign" autoFocus />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="clientName" className={labelClasses}>Client</label>
          <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className={commonInputClasses} placeholder="Acme Corp" />
        </div>
        <div>
          <label htmlFor="hours" className={labelClasses}>Hours worked</label>
          <input type="number" id="hours" value={hours} onChange={(e) => setHours(e.target.value)} required min="0.01" step="0.01" className={commonInputClasses} placeholder="10.5" />
        </div>
        <div>
          <label htmlFor="rate" className={labelClasses}>Rate ({currencySymbol})</label>
          <input type="number" id="rate" value={rate} onChange={(e) => setRate(e.target.value)} required min="0" step="0.01" className={commonInputClasses} placeholder={`${settings.defaultRate}`} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleApplyTrackedTime}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition hover:border-red-300 hover:bg-red-50/60 dark:border-white/15 dark:bg-white/[0.025] dark:hover:border-red-500/30 dark:hover:bg-red-500/[0.06]"
      >
        <span>
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Use tracked time</span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-500">Apply the current timer total and reset it</span>
        </span>
        <span className="text-lg text-slate-400">→</span>
      </button>

      <div>
        <label htmlFor="notes" className={labelClasses}>Notes</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={commonInputClasses} placeholder="Scope, deliverables, payment notes..." />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
        <GradientButton type="button" variant="secondary" onClick={onClose}>Cancel</GradientButton>
        <GradientButton type="submit">{invoiceToEdit ? 'Save changes' : 'Create invoice'}</GradientButton>
      </div>
    </form>
  );
};

export default InvoiceForm;