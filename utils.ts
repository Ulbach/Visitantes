
export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const cleanString = (value: any): string => {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  if (str.toLowerCase().includes('e+') || str.toLowerCase().includes('e-')) {
    const num = Number(value);
    if (!isNaN(num)) str = num.toLocaleString('fullwide', { useGrouping: false });
  }
  return str.replace(/\D/g, '');
};

export const parseBRDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  try {
    if (dateStr.includes('-') && !dateStr.includes('/')) return new Date(dateStr);
    const normalized = dateStr.replace(',', '').trim();
    const parts = normalized.split(/\s+/);
    const dateParts = parts[0].split('/');
    const timeParts = (parts[1] || '00:00:00').split(':');
    return new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[0]),
      parseInt(timeParts[0] || '0'),
      parseInt(timeParts[1] || '0'),
      parseInt(timeParts[2] || '0')
    );
  } catch (e) {
    return new Date();
  }
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '--';
  const date = dateString.includes('/') ? parseBRDate(dateString) : new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateTimeBR = (date: Date) => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
