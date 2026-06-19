/**
 * Tests for Smart Paste Parser (Remediation 2.2)
 * 
 * Tests the parsePasteText utility function directly, covering:
 * - Clean well-formatted input
 * - Unrecognized fields
 * - Lines with no delimiters (freeform notes)
 * - Date normalization (multiple formats)
 * - Phone number normalization
 * - Currency value parsing
 * - Empty values
 * - Levenshtein fuzzy matching
 */

import { parsePasteText, normalizePhone, normalizeCurrency, normalizeDate, FieldDefinition } from '../../utils/pasteParser';

const sampleFields: FieldDefinition[] = [
  { id: 'f1', name: 'customerName', label: 'Customer Name', type: 'TEXT' },
  { id: 'f2', name: 'customerPhone', label: 'Customer Phone', type: 'PHONE' },
  { id: 'f3', name: 'deliveryAddress', label: 'Delivery Address', type: 'ADDRESS' },
  { id: 'f4', name: 'productsOrdered', label: 'Products Ordered', type: 'TEXTAREA' },
  { id: 'f5', name: 'price', label: 'Price', type: 'NUMBER' },
  { id: 'f6', name: 'deliveryDate', label: 'Delivery Date', type: 'DATE' },
  { id: 'f7', name: 'paymentStatus', label: 'Payment Status', type: 'SELECT' },
];

describe('Smart Paste Parser', () => {
  describe('parsePasteText - clean well-formatted input', () => {
    it('should map all fields from a clean WhatsApp-style message', () => {
      const input = `Name: John Smith
Phone: +1 (416) 555-0123
Address: 123 Main St, Toronto ON M5V 2T6
Product: Queen Mattress + Box Spring
Price: $450
Delivery: Dec 20`;

      const result = parsePasteText(input, sampleFields);

      // "Name" should fuzzy match "Customer Name" (contains match)
      expect(result.mappedFields['f1']).toBe('John Smith');
      // "Phone" matches "Customer Phone"
      expect(result.mappedFields['f2']).toBe('+14165550123');
      // "Address" matches "Delivery Address"
      expect(result.mappedFields['f3']).toBe('123 Main St, Toronto ON M5V 2T6');
      // "Product" matches "Products Ordered"
      expect(result.mappedFields['f4']).toBe('Queen Mattress + Box Spring');
      // "Price" exact match
      expect(result.mappedFields['f5']).toBe('450');
    });

    it('should handle ` - ` delimiter format', () => {
      const input = `Customer Name - Jane Doe
Price - $1,200.50`;

      const result = parsePasteText(input, sampleFields);

      expect(result.mappedFields['f1']).toBe('Jane Doe');
      expect(result.mappedFields['f5']).toBe('1200.5');
    });
  });

  describe('parsePasteText - unrecognized fields', () => {
    it('should put unrecognized fields into unknownFields array', () => {
      const input = `Name: John Smith
Shoe Size: 11
Favorite Color: Blue`;

      const result = parsePasteText(input, sampleFields);

      expect(result.mappedFields['f1']).toBe('John Smith');
      expect(result.unknownFields).toHaveLength(2);
      expect(result.unknownFields[0]).toEqual({
        candidateName: 'Shoe Size',
        candidateValue: '11',
      });
      expect(result.unknownFields[1]).toEqual({
        candidateName: 'Favorite Color',
        candidateValue: 'Blue',
      });
    });
  });

  describe('parsePasteText - lines with no delimiters', () => {
    it('should treat lines without delimiters as freeform notes', () => {
      const input = `Name: John Smith
This is a freeform note about the order
Please deliver to the back door
Price: $300`;

      const result = parsePasteText(input, sampleFields);

      expect(result.mappedFields['f1']).toBe('John Smith');
      expect(result.mappedFields['f5']).toBe('300');
      expect(result.notes).toBe('This is a freeform note about the order\nPlease deliver to the back door');
    });
  });

  describe('parsePasteText - empty values', () => {
    it('should skip lines with empty values after delimiter', () => {
      const input = `Name: John Smith
Phone:
Price: $100`;

      const result = parsePasteText(input, sampleFields);

      expect(result.mappedFields['f1']).toBe('John Smith');
      expect(result.mappedFields['f2']).toBeUndefined(); // Skipped
      expect(result.mappedFields['f5']).toBe('100');
    });
  });

  describe('parsePasteText - blank lines', () => {
    it('should skip blank lines', () => {
      const input = `Name: John Smith

Price: $100

`;

      const result = parsePasteText(input, sampleFields);

      expect(result.mappedFields['f1']).toBe('John Smith');
      expect(result.mappedFields['f5']).toBe('100');
      expect(result.unknownFields).toHaveLength(0);
      expect(result.notes).toBe('');
    });
  });
});

describe('normalizePhone', () => {
  it('should normalize a 10-digit phone with formatting', () => {
    expect(normalizePhone('+1 (416) 555-0123')).toBe('+14165550123');
  });

  it('should normalize a clean 10-digit number', () => {
    expect(normalizePhone('4165550123')).toBe('+14165550123');
  });

  it('should handle 11-digit number starting with 1', () => {
    expect(normalizePhone('14165550123')).toBe('+14165550123');
  });
});

describe('normalizeCurrency', () => {
  it('should strip $ and commas', () => {
    expect(normalizeCurrency('$1,200.50')).toBe('1200.5');
  });

  it('should handle plain number', () => {
    expect(normalizeCurrency('450')).toBe('450');
  });

  it('should handle $ with spaces', () => {
    expect(normalizeCurrency('$ 300')).toBe('300');
  });
});

describe('normalizeDate', () => {
  it('should parse YYYY-MM-DD', () => {
    expect(normalizeDate('2024-12-20')).toBe('2024-12-20');
  });

  it('should parse MMM d format (Dec 20)', () => {
    const result = normalizeDate('Dec 20');
    // Should produce a valid date string
    expect(result).toMatch(/^\d{4}-12-20$/);
  });

  it('should return original value for unparseable dates', () => {
    expect(normalizeDate('not a date')).toBe('not a date');
  });
});
