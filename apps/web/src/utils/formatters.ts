export function formatCustomField(key: string, value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  const strVal = String(value);
  
  const lowerKey = key.toLowerCase();
  const isMonetary = ['payment', 'price', 'amount', 'fee', 'balance', 'total', 'cost'].some(k => lowerKey.includes(k));
  
  if (isMonetary) {
    // Extract the number, keeping negative signs and decimals
    const cleaned = strVal.replace(/[^0-9.-]/g, '');
    if (cleaned && !isNaN(parseFloat(cleaned))) {
      const num = parseFloat(cleaned);
      return `$${Math.abs(num).toFixed(2)}`;
    }
  }
  
  return strVal;
}
