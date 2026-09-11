import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { useAppContext } from '../store/AppContext';
import GradientButton from './GradientButton';
import { formatCurrency } from '../utils/formatters';

interface InvoiceFormProps {
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
}

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, invoiceToEdit }) => {
  const { addInvoice, updateInvoice, settings, applyTrackedTimeToInvoice, addToast } = useAppContext();
  const freshDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return toInputDate(date);
  };

  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [hours, setHours] = useState<number | string>('');
  const [rate, setRate] = useState<number | string>(settings.defaultRate);
  const [dueDate, setDueDate] = useState(freshDueDate());
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (invoiceToEdit) {
      setProjectName(invoiceToEdit.projectName);
      setClientName(invoiceToEdit.clientName || '');
      setClientEmail(invoiceToEdit.clientEmail || '');
      setHours(invoiceToEdit.hours);
      setRate(invoiceToEdit.rate);
      setDueDate(invoiceToEdit.dueDate || '');
      setStatus(invoiceToEdit.status || 'draft');
      setNotes(invoiceToEdit.notes || '');
    } else {
      setProjectName('');
      setClientName('');
      setClientEmail('');
      setHours('');
      setRate(settings.defaultRate);
      setDueDate(freshDueDate());
      setStatus('draft');
      setNotes('');
    }
  }, [invoiceToEdit, settings.defaultRate]);

  const numericHours = parseFloat(String(hours)) || 0;
  const numericRate = parseFloat(String(rate)) || 0;
  const total = numericHours * numericRate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      addToast('Project name is required.', 'error');
      return;
    }
    if (numericHours <= 0) {
      addToast('Hours must be greater than zero.', 'error');
      return;
    }
    if (numericRate < 0) {
      addToast('Rate cannot be negative.', 'error');
      return;
    }

    const invoiceData = {
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      hours: numericHours,
      rate: numericRate,
      dueDate,
      status,
      notes: notes.trim(),
    };

    if (invoiceToEdit) updateInvoice({ ...invoiceToEdit, ...invoiceData });
    else addInvoice(invoiceData);

    onClose();
  };

  const handleApplyTrackedTime = () => {
    const trackedHours = applyTrackedTimeToInvoice();
    if (trackedHours > 0) setHours(trackedHours.toFixed(2));
    else addToast('No stopped tracked time available yet.', 'info');
  };

  const input = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-red-500/60';
  const label = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-500">Invoice details</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The essentials first. Extra billing detail stays out of the way.</p>
        </div>

        <div>
          <label htmlFor="projectName" className={label}>Project / service</label>
          <input id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} className={input} placeholder="Website redesign" autoFocus required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clientName" className={label}>Client</label>
            <input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} className={input} placeholder="Acme Studio" />
          </div>
          <div>
            <label htmlFor="clientEmail" className={label}>Client email</label>
            <input id="clientEmail" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className={input} placeholder="billing@acme.co" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hours" className={label}>Hours</label>
            <input id="hours" type="number" min="0.01" step="0.01" value={hours} onChange={e => setHours(e.target.value)} className={input} placeholder="10.5" required />
          </div>
          <div>
            <label htmlFor="rate" className={label}>Hourly rate</label>
            <input id="rate" type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} className={input} required />
          </div>
        </div>

        <button type="button" onClick={handleApplyTrackedTime} className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-red-100 text-[10px] dark:bg-red-500/15">↗</span>
          Use tracked time
        </button>

        <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4 dark:border-white/10">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Invoice total</p>
            <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white">{formatCurrency(total, settings.currency)}</p>
          </div>
          <p className="text-xs text-slate-400">{numericHours.toFixed(2)}h × {formatCurrency(numericRate, settings.currency)}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dueDate" className={label}>Due date</label>
          <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="status" className={label}>Status</label>
          <select id="status" value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)} className={input}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </section>

      <div>
        <label htmlFor="notes" className={label}>Notes</label>
        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={input} placeholder="Scope, payment notes, or a quick thank-you." />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end dark:border-white/10">
        <GradientButton type="button" variant="secondary" onClick={onClose}>Cancel</GradientButton>
        <GradientButton type="submit">{invoiceToEdit ? 'Save invoice' : 'Create invoice'}</GradientButton>
      </div>
    </form>
  );
};

export default InvoiceForm;
