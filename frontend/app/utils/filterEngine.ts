export type FilterOperator = "AND" | "OR" | "NOT";

export interface FilterToken {
  type: "text" | "field";
  value: string;
  field?: string;
  operator: FilterOperator;
}

export interface RangeFilter {
  field: string;
  min?: number | string; // number for amounts, string (ISO) for dates
  max?: number | string;
}

export interface FilterOptions {
  fuzzy?: boolean;
  caseSensitive?: boolean;
  includeFields?: string[];
}

/**
 * Parses a search query string into a list of tokens with operators.
 * Example: "deposit AND asset:usdc NOT 0xabc"
 */
export function parseQuery(query: string): FilterToken[] {
  const tokens: FilterToken[] = [];
  const parts = query.split(/\s+/);
  let currentOperator: FilterOperator = "AND";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    const upperPart = part.toUpperCase();
    if (upperPart === "AND") {
      currentOperator = "AND";
      continue;
    }
    if (upperPart === "OR") {
      currentOperator = "OR";
      continue;
    }
    if (upperPart === "NOT") {
      currentOperator = "NOT";
      continue;
    }

    if (part.includes(":")) {
      const [field, value] = part.split(":");
      tokens.push({
        type: "field",
        field: field.toLowerCase(),
        value: value.toLowerCase(),
        operator: currentOperator,
      });
    } else {
      tokens.push({
        type: "text",
        value: part.toLowerCase(),
        operator: currentOperator,
      });
    }

    // Reset operator to AND by default for the next token unless specified
    currentOperator = "AND";
  }

  return tokens;
}

/**
 * Checks if an item matches a specific token.
 */
function matchesToken(item: any, token: FilterToken, options: FilterOptions): boolean {
  const { includeFields = [] } = options;

  if (token.type === "field") {
    const itemValue = item[token.field!];
    if (itemValue === undefined) return false;
    return String(itemValue).toLowerCase().includes(token.value);
  }

  // Text search across all included fields or all string fields
  const fieldsToSearch = includeFields.length > 0 
    ? includeFields 
    : Object.keys(item).filter(k => typeof item[k] === 'string' || typeof item[k] === 'number');

  return fieldsToSearch.some(field => {
    const val = item[field];
    return val !== undefined && String(val).toLowerCase().includes(token.value);
  });
}

/**
 * Checks if an item matches range filters (dates, amounts).
 */
function matchesRanges(item: any, ranges: RangeFilter[]): boolean {
  for (const range of ranges) {
    const val = item[range.field];
    if (val === undefined) continue;

    // Handle numbers (amounts)
    if (typeof val === 'number') {
      if (range.min !== undefined && val < (range.min as number)) return false;
      if (range.max !== undefined && val > (range.max as number)) return false;
    } 
    // Handle dates (assuming ISO strings or Date objects)
    else if (val instanceof Date || !isNaN(Date.parse(val))) {
      const dateVal = val instanceof Date ? val : new Date(val);
      if (range.min !== undefined && dateVal < new Date(range.min)) return false;
      if (range.max !== undefined && dateVal > new Date(range.max)) return false;
    }
  }
  return true;
}

/**
 * Main filter function.
 */
export function filterItems<T>(
  items: T[],
  query: string,
  ranges: RangeFilter[] = [],
  options: FilterOptions = {}
): T[] {
  if (!query.trim() && ranges.length === 0) return items;

  const tokens = parseQuery(query);
  
  return items.filter(item => {
    // 1. Check Range Filters first (usually faster/more restrictive)
    if (!matchesRanges(item, ranges)) return false;

    if (tokens.length === 0) return true;

    // 2. Evaluate Query Tokens with Operators
    let matches = false;
    let firstToken = true;

    for (const token of tokens) {
      const tokenMatch = matchesToken(item, token, options);

      if (firstToken) {
        matches = token.operator === "NOT" ? !tokenMatch : tokenMatch;
        firstToken = false;
        continue;
      }

      if (token.operator === "AND") {
        matches = matches && tokenMatch;
      } else if (token.operator === "OR") {
        matches = matches || tokenMatch;
      } else if (token.operator === "NOT") {
        matches = matches && !tokenMatch;
      }
    }

    return matches;
  });
}

/**
 * Simple scoring for fuzzy-like search results.
 */
export function scoreItem(item: any, query: string, fields: string[]): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  for (const field of fields) {
    const val = String(item[field] || "").toLowerCase();
    if (val === q) score += 100;
    else if (val.startsWith(q)) score += 50;
    else if (val.includes(q)) score += 20;
  }
  return score;
}
