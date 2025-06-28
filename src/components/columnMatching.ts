// ---- Candidate lists ----
export const productCandidates = [
  // Most descriptive/product-specific first
  'pizza_name', 'pizza name', 'product_detail', 'product details', 'item_detail', 'item details',
  'item_name', 'item name', 'product_name', 'product name', 'description',
  'sku', 'coffee_name', 'coffee name', 'blend', 'variety', 'menu_item', 'menu item',
  'name', 'product', 'item', 'menu', 'food'
];
const categoryCandidates = [
  'product_category', 'product category', 'category', 'menu_category', 'menu category',
  'department', 'segment', 'division'
];
const typeCandidates = [
  'product_type', 'product type', 'type', 'group', 'item_group', 'item group', 'style',
  'pizza_style', 'pizza style', 'variety', 'crust', 'crust_type', 'blend'
];
const sizeCandidates = [
  'size', 'pizza_size', 'pizza size', 'drink_size', 'drink size', 'portion', 'portion size'
];
const storeLocationCandidates = [
  'store_location', 'store location', 'location', 'branch', 'shop', 'store', 'region', 'area'
];
const paymentTypeCandidates = [
  'cash_type', 'cashtype', 'payment_type', 'paymenttype', 'pay_type', 'paytype', 'tender_type', 'tendertype'
];

// ---- Normalization helper ----
function normalize(str: string): string {
  return (str || '').replace(/[\s_]/g, '').toLowerCase();
}

// ---- Exclusion helpers ----

const forbiddenBreakdownPatterns = [
  // Existing forbidden patterns
  'quantity', 'qty', 'date', 'time', 'timestamp', 'firstname', 'first name', 'lastname', 'last name',
  'email', 'phone', 'address', 'transaction', 'order', 'dob', 'birth', 'customername', 'customer name',
  'price', 'unit_price', 'unit price', 'amount', 'cost', 'total', 'revenue',
  // Block ingredient-like columns:
  'ingredient', 'ingredients', 'topping', 'toppings', 'component', 'components', 'add-on', 'addon', 'modification', 'modifications'
];

function isIdColumn(col: string): boolean {
  const n = normalize(col);
  return (
    n === 'id' ||
    n.endsWith('id') ||
    n.startsWith('id') ||
    /(^|[^a-z])id([^a-z]|$)/.test(n)
  );
}

const forbiddenProductCols = [
  ...categoryCandidates,
  ...typeCandidates,
  ...sizeCandidates,
  ...storeLocationCandidates,
  ...paymentTypeCandidates,
  'customer', 'order', 'segment', 'division'
];

// --- PRODUCT COL LOGIC: allow only candidates, don't exclude candidates from product search ---
// For product, only forbid breakdowns, id columns, and forbidden patterns (not product candidates themselves!)
function isForbiddenProductCol(col: string): boolean {
  return (
    forbiddenProductCols.some(c => normalize(col).includes(normalize(c))) ||
    isIdColumn(col) ||
    forbiddenBreakdownPatterns.some(p => normalize(col).includes(normalize(p)))
  );
}

// For breakdowns: DO block product candidates!
function isBadBreakdownCol(col: string): boolean {
  const n = normalize(col);
  // Block product candidates as breakdown
  const isProductCandidate = productCandidates.some(c => n === normalize(c));
  if (isProductCandidate) return true;
  if (isIdColumn(col)) return true;
  if (forbiddenBreakdownPatterns.some(p => n.includes(normalize(p)))) return true;
  if (/quantity|order|sku|price|amount|cost|total|revenue/.test(n)) return true;
  return false;
}

// Exclude date-like columns by value
function looksLikeDateCol(col: string, data: any[]): boolean {
  if (!data.length) return false;
  const values = data.map(row => row[col]).filter(Boolean);
  if (!values.length) return false;
  const dateLike = values.filter(
    v =>
      typeof v === "string" &&
      /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(v)
  ).length;
  return dateLike / values.length > 0.6;
}

// ---- Store Location Validator ----
function plausibleLocationCol(col: string, data: any[]): boolean {
  if (!data.length) return false;
  const values = data.map(row => row[col]).filter(Boolean);
  if (!values.length) return false;
  const unique = new Set(values);
  if (unique.size / data.length > 0.5) return false;
  const mostlyNumbers = values.filter(v => /^\d+$/.test(String(v))).length / values.length > 0.5;
  if (mostlyNumbers) return false;
  return true;
}

// ---- Generic column finder ----
function findColumn(
  mappedColumns: Record<string, string>,
  data: any[] | undefined,
  candidates: string[],
  alreadyTaken: string[] = [],
  extraValidator?: (col: string, data: any[]) => boolean,
  allowStringFallback: boolean = true,
  excludeCols?: (col: string) => boolean
): string | null {
  // 1. Prefer explicit mapping (exact match)
  for (const key in mappedColumns) {
    const col = mappedColumns[key];
    if (!col || alreadyTaken.includes(col)) continue;
    if (candidates.some(c => normalize(col) === normalize(c))) {
      if ((!extraValidator || extraValidator(col, data ?? [])) && (!excludeCols || !excludeCols(col))) return col;
    }
  }
  // 2. Explicit mapping (substring match)
  for (const key in mappedColumns) {
    const col = mappedColumns[key];
    if (!col || alreadyTaken.includes(col)) continue;
    if (candidates.some(c => normalize(col).includes(normalize(c)))) {
      if ((!extraValidator || extraValidator(col, data ?? [])) && (!excludeCols || !excludeCols(col))) return col;
    }
  }
  // 3. Fallback: scan data headers (if provided)
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    // Exact match
    for (const c of candidates) {
      for (const col of columns) {
        if (alreadyTaken.includes(col)) continue;
        if (normalize(col) === normalize(c)) {
          if ((!extraValidator || extraValidator(col, data)) && (!excludeCols || !excludeCols(col))) return col;
        }
      }
    }
    // Substring match
    for (const c of candidates) {
      for (const col of columns) {
        if (alreadyTaken.includes(col)) continue;
        if (normalize(col).includes(normalize(c))) {
          if ((!extraValidator || extraValidator(col, data)) && (!excludeCols || !excludeCols(col))) return col;
        }
      }
    }
    // Fallback: any string column w/ values, not forbidden
    if (allowStringFallback) {
      for (const col of columns) {
        if (
          typeof data[0][col] === "string" &&
          data[0][col].length > 0 &&
          (!excludeCols || !excludeCols(col)) &&
          !looksLikeDateCol(col, data) &&
          !alreadyTaken.includes(col)
        ) {
          if (!extraValidator || extraValidator(col, data)) return col;
        }
      }
    }
  }
  return null;
}

// ---- Exported API ----

/**
 * Returns the best-matching product column for your data.
 * Excludes category/type/size/location/payment/id columns from fallback!
 * Flexible for any file, even with bad mapping.
 * (Allows productCandidates as product, but blocks them as breakdowns.)
 */
export function getProductCol(
  mappedColumns: Record<string, string>,
  data: any[]
): string | null {
  return findColumn(
    mappedColumns,
    data,
    productCandidates,
    [],
    undefined,
    true,
    isForbiddenProductCol // <--- blocks breakdown/ID/forbidden, but NOT product candidates!
  );
}

/**
 * Returns the best-matching category column for your data.
 * Excludes id columns, forbidden patterns, and product candidates from fallback.
 */
export function getCategoryCol(
  mappedColumns: Record<string, string>,
  data: any[]
): string | null {
  return findColumn(
    mappedColumns,
    data,
    categoryCandidates,
    [],
    undefined,
    true,
    col => isIdColumn(col) || isBadBreakdownCol(col)
  );
}

/**
 * Returns the best-matching type column for your data.
 * Excludes id columns, forbidden patterns, and product candidates from fallback.
 */
export function getTypeCol(
  mappedColumns: Record<string, string>,
  data: any[]
): string | null {
  return findColumn(
    mappedColumns,
    data,
    typeCandidates,
    [],
    undefined,
    true,
    col => isIdColumn(col) || isBadBreakdownCol(col)
  );
}

/**
 * Returns the best-matching size column for your data.
 * Excludes id columns, forbidden patterns, and product candidates from fallback.
 */
export function getSizeCol(
  mappedColumns: Record<string, string>,
  data: any[]
): string | null {
  return findColumn(
    mappedColumns,
    data,
    sizeCandidates,
    [],
    undefined,
    true,
    col => isIdColumn(col) || isBadBreakdownCol(col)
  );
}

/**
 * Returns the best-matching store location column for your data.
 * Only accepts columns that match candidates and pass validation. Excludes id columns, forbidden patterns, and product candidates.
 */
export function getStoreLocationCol(
  mappedColumns: Record<string, string>,
  data: any[]
): string | null {
  return findColumn(
    mappedColumns,
    data,
    storeLocationCandidates,
    [],
    plausibleLocationCol,
    false,
    col => isIdColumn(col) || isBadBreakdownCol(col)
  );
}

/**
 * Returns all breakdown columns (category, type, size, storeLocation) for multi-chart dashboards.
 * Ensures each column is used at most once and skips product name/sku/description as breakdowns.
 * - Always prefers mappedColumns.size for sizeCol (if present)
 * - Never allows sizeCol to be used as typeCol or categoryCol
 * - Only uses valid, non-product columns for breakdowns
 */
export function getBreakdownCols(
  mappedColumns: Record<string, string>,
  data: any[]
): { categoryCol: string | null, typeCol: string | null, sizeCol: string | null, storeLocationCol: string | null } {
  const alreadyTaken: string[] = [];

  // Always prefer mappedColumns.size for sizeCol
  const sizeCol = mappedColumns.size ?? null;
  if (sizeCol) alreadyTaken.push(sizeCol);

  // Helper to block product candidates for breakdowns
  const notProductCol = (col: string) => !productCandidates.some(c => normalize(col) === normalize(c));

  // Category: mapped (not sizeCol), not product col, not already taken
  const categoryCol = (
    mappedColumns.category &&
    notProductCol(mappedColumns.category) &&
    mappedColumns.category !== sizeCol
  ) ? mappedColumns.category : findColumn(
    mappedColumns,
    data,
    categoryCandidates,
    alreadyTaken,
    undefined,
    true,
    col => isIdColumn(col) || isBadBreakdownCol(col) || !notProductCol(col) || col === sizeCol
  );
  if (categoryCol && notProductCol(categoryCol) && categoryCol !== sizeCol) alreadyTaken.push(categoryCol);

  // Type: mapped (not sizeCol), not product col, not already taken
  const typeCol = (
    mappedColumns.type &&
    notProductCol(mappedColumns.type) &&
    mappedColumns.type !== sizeCol &&
    mappedColumns.type !== categoryCol
  ) ? mappedColumns.type : findColumn(
    mappedColumns,
    data,
    typeCandidates,
    alreadyTaken,
    undefined,
    true,
    col => isIdColumn(col) || isBadBreakdownCol(col) || !notProductCol(col) || col === sizeCol || col === categoryCol
  );
  if (typeCol && notProductCol(typeCol) && typeCol !== sizeCol && typeCol !== categoryCol) alreadyTaken.push(typeCol);

  // Store Location: mapped (not already taken), else fallback
  const storeLocationCol = (
    mappedColumns.storeLocation &&
    notProductCol(mappedColumns.storeLocation) &&
    mappedColumns.storeLocation !== sizeCol &&
    mappedColumns.storeLocation !== categoryCol &&
    mappedColumns.storeLocation !== typeCol
  ) ? mappedColumns.storeLocation : findColumn(
    mappedColumns,
    data,
    storeLocationCandidates,
    alreadyTaken,
    plausibleLocationCol,
    false,
    col => isIdColumn(col) || isBadBreakdownCol(col) || !notProductCol(col) || col === sizeCol || col === categoryCol || col === typeCol
  );

  return { categoryCol, typeCol, sizeCol, storeLocationCol };
}

/**
 * Legacy: Returns only the "best" single breakdown column and its type.
 * Order: category -> type -> size -> payment -> fallback categorical (2-8 unique values, not id/etc)
 * Excludes id, forbidden patterns, date-like, and numeric columns, and product candidates.
 */
export function getBestBreakdownCol(
  mappedColumns: Record<string, string>,
  data: any[]
): { col: string | null, type: 'category' | 'type' | 'size' | 'payment' | 'other' | null } {
  if (!data.length) return { col: null, type: null };

  const columns = Object.keys(data[0] || {});
  const notProductCol = (col: string) => !productCandidates.some(c => normalize(col) === normalize(c));

  // 1. Category (mapped or header)
  const categoryCol = getCategoryCol(mappedColumns, data);
  if (categoryCol && notProductCol(categoryCol)) return { col: categoryCol, type: 'category' };

  // 2. Type (mapped or header)
  const typeCol = getTypeCol(mappedColumns, data);
  if (typeCol && notProductCol(typeCol)) return { col: typeCol, type: 'type' };

  // 3. Size (mapped or header)
  const sizeCol = getSizeCol(mappedColumns, data);
  if (sizeCol && notProductCol(sizeCol)) return { col: sizeCol, type: 'size' };

  // 4. Payment type
  for (const c of paymentTypeCandidates) {
    for (const col of columns) {
      if (
        col.toLowerCase().includes(c) &&
        !isIdColumn(col) &&
        !isBadBreakdownCol(col) &&
        notProductCol(col)
      ) {
        return { col, type: 'payment' };
      }
    }
  }

  // 5. Fallback: any string col with 2-8 unique values, not id/product name/quantity/etc, not date-like
  for (const col of columns) {
    if (isBadBreakdownCol(col)) continue;
    if (looksLikeDateCol(col, data)) continue;
    if (!data[0][col] || typeof data[0][col] !== "string") continue;
    if (!notProductCol(col)) continue;
    const values = data.map(row => row[col]).filter(Boolean);
    const unique = Array.from(new Set(values));
    if (unique.length >= 2 && unique.length <= 8) return { col, type: 'other' };
  }
  return { col: null, type: null };
}