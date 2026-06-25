export function formatCustomField(key: string, value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  const strVal = String(value);
  
  const lowerKey = key.toLowerCase();
  const isMonetary = ['payment', 'price', 'amount', 'fee', 'balance', 'total', 'cost'].some(k => lowerKey.includes(k));
  
  if (isMonetary) {
    // Extract the number
    const cleaned = strVal.replace(/[^0-9.-]/g, '');
    if (cleaned && !isNaN(parseFloat(cleaned))) {
      const num = parseFloat(cleaned);
      // Remove misleading negative prefixes
      return `$${Math.abs(num).toFixed(2)}`;
    }
  }
  
  return strVal;
}

export function getFieldValue(order: any, fieldName: string): any {
  if (!order) return undefined;
  
  if (fieldName === 'orderStatus') return order.status?.name;
  if (fieldName === 'deliveryDate') return order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : undefined;
  if (fieldName === 'notes') return order.notes;
  if (fieldName === 'orderNumber') return order.orderNumber;
  if (fieldName === 'orderDate') return new Date(order.createdAt).toLocaleDateString();
  if (fieldName === 'createdBy') return order.creator?.name;
  if (fieldName === 'finalPaidAmount') return order.finalPaidAmount;
  if (fieldName === 'finalPaidNote') return order.finalPaidNote;

  return order.customFields?.[fieldName];
}
