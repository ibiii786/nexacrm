/**
 * Smart Paste Parser — Blueprint Section 11
 * 
 * Parses raw WhatsApp/Facebook message text and maps it to order fields.
 * Runs server-side only (field metadata must not be exposed to unauthenticated clients).
 * 
 * Algorithm:
 * 1. Split input text by newlines
 * 2. For each line, split on `:` (first occurrence) or ` - ` delimiter
 * 3. Left side = candidate field name (trimmed, lowercased)
 * 4. Right side = candidate value (trimmed)
 * 5. Fuzzy match candidate against known field labels:
 *    exact match → contains match → Levenshtein distance ≤ 2
 * 6. Matched → { fieldId: value }
 * 7. Unmatched → { candidateName, candidateValue }
 * 8. Lines with no delimiter → append to Notes field
 */

import { parse, isValid } from 'date-fns';

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: string;
}

export interface ParseResult {
  mappedFields: Record<string, string>;
  unknownFields: Array<{ candidateName: string; candidateValue: string }>;
  notes: string;
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalize a phone number: strip non-digits, prepend +1 if 10 digits.
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Normalize a currency value: strip $, commas, spaces; parse as number.
 */
export function normalizeCurrency(value: string): string {
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? value : num.toString();
}

/**
 * Try to parse a date string using multiple common formats.
 * Returns ISO 8601 date string on success, original value on failure.
 */
export function normalizeDate(value: string): string {
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'MM/dd',
    'dd/MM/yyyy',
    'MMM d',
    'MMM dd',
    'MMMM d',
    'MMMM dd',
    'd MMM',
    'dd MMM',
    'd MMMM',
    'dd MMMM',
    'MMM d, yyyy',
    'MMMM d, yyyy',
  ];

  const trimmed = value.trim();
  const referenceDate = new Date();

  for (const fmt of formats) {
    try {
      const parsed = parse(trimmed, fmt, referenceDate);
      if (isValid(parsed)) {
        return parsed.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    } catch {
      // Continue to next format
    }
  }

  return value; // Return original if no format matched
}

/**
 * Normalize a value based on its matched field type.
 */
function normalizeValue(value: string, fieldType: string): string {
  switch (fieldType.toUpperCase()) {
    case 'PHONE':
      return normalizePhone(value);
    case 'NUMBER':
      return normalizeCurrency(value);
    case 'DATE':
      return normalizeDate(value);
    default:
      return value.trim();
  }
}

const SYNONYMS: Record<string, string[]> = {
  customerPhone: ['phone', 'mobile', 'cell', 'tel', 'contact', 'number'],
  customerName: ['name', 'customer', 'client', 'buyer', 'person'],
  deliveryDate: ['date', 'when', 'time', 'eta'],
  deliveryAddress: ['address', 'shipping', 'location', 'ship', 'dest'],
  productsOrdered: ['product', 'item', 'order', 'goods'],
  price: ['price', 'total', 'amount', 'cost', 'sum', 'pay'],
  notes: ['note', 'remark', 'comment', 'instruction', 'extra'],
  finalPaidAmount: ['final paid', 'actual paid', 'paid amount', 'amount paid', 'final price', 'actual price', 'settled']
};

/**
 * Try to match a candidate field name against known fields.
 * Priority: synonym match → exact match → contains match → Levenshtein ≤ 2.
 */
function matchField(candidateName: string, fields: FieldDefinition[]): FieldDefinition | null {
  const lower = candidateName.toLowerCase().trim();

  // 0. Robust Synonym/Keyword match
  // We check if the candidate name contains any of our known generic keywords.
  for (const [standardName, keywords] of Object.entries(SYNONYMS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      // Prioritize phone over name if 'contact' or 'number' is used along with 'customer'
      if (standardName === 'customerName' && (lower.includes('phone') || lower.includes('number') || lower.includes('contact'))) {
        continue; // Skip mapping to Name if it's clearly a Phone Number
      }
      
      const matchedField = fields.find(f => f.name === standardName);
      if (matchedField) return matchedField;
    }
  }

  // 1. Exact match (case-insensitive) on label or name
  for (const field of fields) {
    if (field.label.toLowerCase() === lower || field.name.toLowerCase() === lower) {
      return field;
    }
  }

  // 2. Contains match — field label contains candidate or vice versa
  let bestContains: FieldDefinition | null = null;
  let bestContainsDiff = Infinity;

  for (const field of fields) {
    const fieldLower = field.label.toLowerCase();
    if (fieldLower.includes(lower) || lower.includes(fieldLower)) {
      const diff = Math.abs(fieldLower.length - lower.length);
      if (diff < bestContainsDiff) {
        bestContainsDiff = diff;
        bestContains = field;
      }
    }
    
    // Also check name
    const nameLower = field.name.toLowerCase();
    if (nameLower.includes(lower) || lower.includes(nameLower)) {
      const diff = Math.abs(nameLower.length - lower.length);
      if (diff < bestContainsDiff) {
        bestContainsDiff = diff;
        bestContains = field;
      }
    }
  }

  if (bestContains) return bestContains;

  // 3. Levenshtein distance ≤ 2
  let bestMatch: FieldDefinition | null = null;
  let bestDistance = 3; // Threshold: must be ≤ 2

  for (const field of fields) {
    const dist = levenshtein(lower, field.label.toLowerCase());
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = field;
    }
    // Also check against name
    const distName = levenshtein(lower, field.name.toLowerCase());
    if (distName < bestDistance) {
      bestDistance = distName;
      bestMatch = field;
    }
  }

  return bestMatch;
}

/**
 * Split a line into key-value pair using `:` or `=` or ` - ` as delimiter.
 * Returns null if no delimiter found.
 */
function splitLine(line: string): { key: string; value: string } | null {
  const match = line.match(/^([^:=-]+)[:=-](.+)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (key && value) return { key, value };
  }

  // Fallback for ` - ` if not matched
  const dashIdx = line.indexOf(' - ');
  if (dashIdx > 0) {
    const key = line.substring(0, dashIdx).trim();
    const value = line.substring(dashIdx + 3).trim();
    if (key && value) return { key, value };
  }

  return null;
}

/**
 * Parse raw paste text against a list of known field definitions.
 * Returns mapped fields, unknown fields, and freeform notes.
 */
export function parsePasteText(rawText: string, fields: FieldDefinition[]): ParseResult {
  const mappedFields: Record<string, string[]> = {}; // Now stores arrays
  const unknownFields: Array<{ candidateName: string; candidateValue: string }> = [];
  const noteLines: string[] = [];

  const lines = rawText.split(/\r?\n/);
  let lastMatchedFieldId: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      lastMatchedFieldId = null; // Blank line resets continuation
      continue;
    }

    const parsed = splitLine(trimmedLine);

    if (!parsed) {
      noteLines.push(trimmedLine);
      continue;
    }

    if (!parsed.value) continue;

    const matchedField = matchField(parsed.key, fields);

    if (matchedField) {
      // WhatsApp auto-detection logic
      if (matchedField.type === 'PHONE' || matchedField.name === 'customerPhone') {
        const rawValue = parsed.value;
        const parts = rawValue.split(/[|,\/]/).map(p => p.trim());

        for (const part of parts) {
          const isWhatsApp = /whatsapp/i.test(part);
          const number = part.replace(/whatsapp/i, '').trim();

          if (isWhatsApp) {
            const whatsappField = fields.find(f =>
              f.name.toLowerCase().includes('whatsapp') ||
              f.label.toLowerCase().includes('whatsapp')
            );
            if (whatsappField) {
              mappedFields[whatsappField.id] = mappedFields[whatsappField.id] || [];
              mappedFields[whatsappField.id].push(normalizeValue(number, whatsappField.type));
              continue;
            }
          }

          // Regular phone number — add to the matched field
          mappedFields[matchedField.id] = mappedFields[matchedField.id] || [];
          mappedFields[matchedField.id].push(normalizeValue(part, matchedField.type));
        }
        lastMatchedFieldId = matchedField.id;
        continue; // Skip the default push below
      }

      mappedFields[matchedField.id] = mappedFields[matchedField.id] || [];
      mappedFields[matchedField.id].push(normalizeValue(parsed.value, matchedField.type));
      lastMatchedFieldId = matchedField.id;
    } else {
      unknownFields.push({
        candidateName: parsed.key,
        candidateValue: parsed.value,
      });
      lastMatchedFieldId = null;
    }
  }

  // Convert arrays to strings: join multiple values with ' | '
  const finalMappedFields: Record<string, string> = {};
  for (const [fieldId, values] of Object.entries(mappedFields)) {
    finalMappedFields[fieldId] = values.join(' | ');
  }

  return {
    mappedFields: finalMappedFields,
    unknownFields,
    notes: noteLines.join('\n'),
  };
}
