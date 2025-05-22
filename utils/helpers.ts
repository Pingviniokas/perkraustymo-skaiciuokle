
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('lt-LT');
  } catch (e) {
    return dateString; // return original if invalid
  }
};

export const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return 'N/A';
  try {
    return new Date(dateTimeString).toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short' });
  } catch(e) {
    return dateTimeString;
  }
};

export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || isNaN(amount)) return '0.00 €';
  return amount.toLocaleString('lt-LT', { style: 'currency', currency: 'EUR' });
};

export const getMonthYear = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const calculateDurationHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  return (end - start) / (1000 * 60 * 60);
};

// Get current date as YYYY-MM-DD
export const getCurrentDateISO = (): string => {
    return new Date().toISOString().split('T')[0];
};

// Get current datetime-local string
export const getCurrentDateTimeLocal = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for local timezone
    return now.toISOString().slice(0, 16);
};

export const isWeekend = (dateString: string): boolean => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 for Sunday, 6 for Saturday
    return day === 0 || day === 6;
  } catch (e) {
    return false;
  }
};