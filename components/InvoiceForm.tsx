
import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { useAppContext } from '../store/AppContext';
import GradientButton from './GradientButton';
import { formatCurrency as utilFormatCurrency } from '../utils/formatters'; // Renamed to avoid conflict

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
    if (isNaN(numericRate) || numericRate < 0) { // Allow 0 rate, but not negative
      addToast('Please enter a valid rate (0 or positive).', 'error');
      return;
    }

    const invoiceData = {
      projectName,
      clientName,
      hours: numericHours,
      rate: numericRate,
      notes,
    };

    if (invoiceToEdit) {
      updateInvoice({ ...invoiceToEdit, ...invoiceData });
    } else {
      addInvoice(invoiceData);
    }
    onClose();
  };
  
  const handleApplyTrackedTime = () => {
    const trackedHours = applyTrackedTimeToInvoice();
    if (trackedHours > 0) {
        setHours(trackedHours.toFixed(2));
    } else {
        addToast('No tracked time to apply or timer is still active.', 'info');
    }
  };

  const commonInputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100";
  const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  
  const currencySymbol = utilFormatCurrency(0, settings.currency).replace(/[\d\.,\s]/g, '');


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="projectName" className={labelClasses}>Project Name</label>
        <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} required className={commonInputClasses} placeholder="e.g., Website Redesign" />
      </div>
      <div>
        <label htmlFor="clientName" className={labelClasses}>Client Name (Optional)</label>
        <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className={commonInputClasses} placeholder="e.g., Acme Corp" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hours" className={labelClasses}>Hours Worked</label>
          <input type="number" id="hours" value={hours} onChange={(e) => setHours(e.target.value)} required min="0.01" step="0.01" className={commonInputClasses} placeholder="e.g., 10.5" />
        </div>
        <div>
          <label htmlFor="rate" className={labelClasses}>Hourly Rate ({currencySymbol})</label>
          <input type="number" id="rate" value={rate} onChange={(e) => setRate(e.target.value)} required min="0" step="0.01" className={commonInputClasses} placeholder={`e.g., ${settings.defaultRate}`} />
        </div>
      </div>
       <GradientButton type="button" variant="secondary" onClick={handleApplyTrackedTime} className="w-full text-sm py-2">
        Use Tracked Time & Reset Timer
      </GradientButton>
      <div>
        <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={commonInputClasses} placeholder="e.g., Included initial consultation and wireframes." />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <GradientButton type="button" variant="secondary" onClick={onClose} className="px-4 py-2 text-sm">
          Cancel
        </GradientButton>
        <GradientButton type="submit" className="px-4 py-2 text-sm">
          {invoiceToEdit ? 'Save Changes' : 'Create Invoice'}
        </GradientButton>
      </div>
    </form>
  );
};

export default InvoiceForm;