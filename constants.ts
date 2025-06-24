
export const LOCAL_STORAGE_KEYS = {
  THEME: 'invoicr_theme',
  INVOICES: 'invoicr_invoices',
  SETTINGS: 'invoicr_settings',
  TIMER: 'invoicr_timer_elapsedSeconds' // Persist elapsed time if needed
};

export const DEFAULT_HOURLY_RATE = 50;
export const DEFAULT_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  // Add more currencies here if needed
];
