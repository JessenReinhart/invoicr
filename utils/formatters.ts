
export const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Determine locale based on currency for more accurate formatting if needed.
  // For simplicity, 'en-US' works for most common western currencies.
  // For IDR, 'id-ID' would be more specific but 'en-US' with currency 'IDR' still shows "Rp".
  let locale = 'en-US';
  if (currency === 'IDR') {
    locale = 'id-ID'; // Using specific locale for IDR for better formatting
  }
  // Add more locale mappings if necessary for other currencies

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch (e) {
    // Fallback for unsupported currency codes, though SUPPORTED_CURRENCIES should prevent this
    console.warn(`Currency formatting failed for ${currency}. Defaulting to USD format.`, e);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
};

export const secondsToHours = (seconds: number): number => {
  return seconds / 3600;
};

export const hoursToSeconds = (hours: number): number => {
  return hours * 3600;
};