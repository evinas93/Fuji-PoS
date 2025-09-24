import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  errors: ValidationError[];
  importId?: string;
  summary?: {
    inserted: number;
    updated: number;
    failed: number;
  };
}

// Validation functions
function validateDate(value: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}$/);
}

function validateDecimal(value: string): boolean {
  if (!value || value.trim() === '') return true; // Allow empty for optional fields
  return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
}

function validateNumber(value: string): boolean {
  if (!value || value.trim() === '') return true; // Allow empty for optional fields
  return Number.isInteger(Number(value));
}

function validateText(value: string, maxLength: number = 255): boolean {
  return typeof value === 'string' && value.length <= maxLength;
}

// Sanitization functions
function sanitizeDecimal(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : Math.round(parsed * 100) / 100; // Round to 2 decimal places
}

function sanitizeText(value: string): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

function sanitizeDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

// Monthly summary import processor
async function processMonthlyData(data: any[], supabase: any): Promise<ImportResult> {
  const errors: ValidationError[] = [];
  const processedRows: any[] = [];
  let rowIndex = 1;

  for (const row of data) {
    rowIndex++;
    const rowErrors: ValidationError[] = [];

    // Validate required fields
    if (!validateDate(row.date)) {
      rowErrors.push({ row: rowIndex, field: 'date', value: row.date, error: 'Invalid date format (YYYY-MM-DD required)' });
    }
    if (!row.month_name) {
      rowErrors.push({ row: rowIndex, field: 'month_name', value: row.month_name, error: 'Month name is required' });
    }
    if (!validateDecimal(row.togo)) {
      rowErrors.push({ row: rowIndex, field: 'togo', value: row.togo, error: 'Invalid decimal value' });
    }
    if (!validateDecimal(row.dine_in)) {
      rowErrors.push({ row: rowIndex, field: 'dine_in', value: row.dine_in, error: 'Invalid decimal value' });
    }
    if (!validateDecimal(row.gross_sale)) {
      rowErrors.push({ row: rowIndex, field: 'gross_sale', value: row.gross_sale, error: 'Invalid decimal value' });
    }

    // Validate optional decimal fields
    const decimalFields = ['tax', 'gratuity', 'coupon_subtract', 'net_sale', 'tip_cr', 'tip_cash',
                          'credt_total', 'deposited', 'cash', 'sc_merch', 'sc_owner', 'daily_earned'];
    for (const field of decimalFields) {
      if (row[field] && !validateDecimal(row[field])) {
        rowErrors.push({ row: rowIndex, field, value: row[field], error: 'Invalid decimal value' });
      }
    }

    // Validate number fields
    const numberFields = ['no_of_days_closed', 'no_of_days_month'];
    for (const field of numberFields) {
      if (row[field] && !validateNumber(row[field])) {
        rowErrors.push({ row: rowIndex, field, value: row[field], error: 'Invalid number value' });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    // Prepare row for insertion
    const cleanRow = {
      id: `monthly_${sanitizeDate(row.date)}`,
      date: sanitizeDate(row.date),
      year: new Date(row.date).getFullYear(),
      month: new Date(row.date).getMonth() + 1,
      month_name: sanitizeText(row.month_name),
      togo: sanitizeDecimal(row.togo) || 0,
      dine_in: sanitizeDecimal(row.dine_in) || 0,
      tax: sanitizeDecimal(row.tax) || 0,
      gross_sale: sanitizeDecimal(row.gross_sale) || 0,
      gratuity: sanitizeDecimal(row.gratuity) || 0,
      coupon_subtract: sanitizeDecimal(row.coupon_subtract) || 0,
      net_sale: sanitizeDecimal(row.net_sale) || 0,
      tip_cr: sanitizeDecimal(row.tip_cr) || 0,
      tip_cash: sanitizeDecimal(row.tip_cash) || 0,
      credt_total: sanitizeDecimal(row.credt_total) || 0,
      deposited: sanitizeDecimal(row.deposited) || 0,
      cash: sanitizeDecimal(row.cash) || 0,
      sc_merch: sanitizeDecimal(row.sc_merch) || 0,
      sc_owner: sanitizeDecimal(row.sc_owner) || 0,
      daily_earned: sanitizeDecimal(row.daily_earned) || 0,
      no_of_days_closed: parseInt(row.no_of_days_closed) || 0,
      no_of_days_month: parseInt(row.no_of_days_month) || 0,
    };

    processedRows.push(cleanRow);
  }

  if (errors.length > 0) {
    return {
      success: false,
      totalRows: data.length,
      processedRows: 0,
      skippedRows: data.length,
      errors
    };
  }

  // Insert data using upsert to handle duplicates
  const { data: insertResult, error: insertError } = await supabase
    .from('historical_monthly_summary')
    .upsert(processedRows, { onConflict: 'id' })
    .select('id');

  if (insertError) {
    return {
      success: false,
      totalRows: data.length,
      processedRows: 0,
      skippedRows: data.length,
      errors: [{ row: 0, field: 'database', value: '', error: insertError.message }]
    };
  }

  return {
    success: true,
    totalRows: data.length,
    processedRows: insertResult.length,
    skippedRows: 0,
    errors: [],
    summary: {
      inserted: insertResult.length,
      updated: 0,
      failed: 0
    }
  };
}

// Daily summary import processor
async function processDailyData(data: any[], supabase: any): Promise<ImportResult> {
  const errors: ValidationError[] = [];
  const processedRows: any[] = [];
  let rowIndex = 1;

  for (const row of data) {
    rowIndex++;
    const rowErrors: ValidationError[] = [];

    // Validate required fields
    if (!validateDate(row.date)) {
      rowErrors.push({ row: rowIndex, field: 'date', value: row.date, error: 'Invalid date format (YYYY-MM-DD required)' });
    }
    if (!validateDecimal(row.togo)) {
      rowErrors.push({ row: rowIndex, field: 'togo', value: row.togo, error: 'Invalid decimal value' });
    }
    if (!validateDecimal(row.dine_in)) {
      rowErrors.push({ row: rowIndex, field: 'dine_in', value: row.dine_in, error: 'Invalid decimal value' });
    }
    if (!validateDecimal(row.gross_sale)) {
      rowErrors.push({ row: rowIndex, field: 'gross_sale', value: row.gross_sale, error: 'Invalid decimal value' });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    // Prepare row for insertion
    const cleanRow = {
      id: `daily_${sanitizeDate(row.date)}`,
      date: sanitizeDate(row.date),
      day: sanitizeText(row.day),
      togo: sanitizeDecimal(row.togo) || 0,
      dine_in: sanitizeDecimal(row.dine_in) || 0,
      tax: sanitizeDecimal(row.tax) || 0,
      gross_sale: sanitizeDecimal(row.gross_sale) || 0,
      gratuity: sanitizeDecimal(row.gratuity) || 0,
      coupon_subtract: sanitizeDecimal(row.coupon_subtract) || 0,
      net_sale: sanitizeDecimal(row.net_sale) || 0,
      tip_cr: sanitizeDecimal(row.tip_cr) || 0,
      tip_cash: sanitizeDecimal(row.tip_cash) || 0,
      credt_total: sanitizeDecimal(row.credt_total) || 0,
      deposited: sanitizeDecimal(row.deposited) || 0,
      cash: sanitizeDecimal(row.cash) || 0,
      sc_merch: sanitizeDecimal(row.sc_merch) || 0,
      daily_earned: sanitizeDecimal(row.daily_earned) || 0,
      lunch: sanitizeDecimal(row.lunch) || 0,
    };

    processedRows.push(cleanRow);
  }

  if (errors.length > 0) {
    return {
      success: false,
      totalRows: data.length,
      processedRows: 0,
      skippedRows: data.length,
      errors
    };
  }

  // Insert data using upsert to handle duplicates
  const { data: insertResult, error: insertError } = await supabase
    .from('historical_daily_summary')
    .upsert(processedRows, { onConflict: 'id' })
    .select('id');

  if (insertError) {
    return {
      success: false,
      totalRows: data.length,
      processedRows: 0,
      skippedRows: data.length,
      errors: [{ row: 0, field: 'database', value: '', error: insertError.message }]
    };
  }

  return {
    success: true,
    totalRows: data.length,
    processedRows: insertResult.length,
    skippedRows: 0,
    errors: [],
    summary: {
      inserted: insertResult.length,
      updated: 0,
      failed: 0
    }
  };
}

// Transaction import processor
async function processTransactionData(data: any[], supabase: any): Promise<ImportResult> {
  const errors: ValidationError[] = [];
  const processedRows: any[] = [];
  let rowIndex = 1;

  for (const row of data) {
    rowIndex++;
    const rowErrors: ValidationError[] = [];

    // Validate required fields
    if (!validateDate(row.date)) {
      rowErrors.push({ row: rowIndex, field: 'date', value: row.date, error: 'Invalid date format (YYYY-MM-DD required)' });
    }
    if (!validateDecimal(row.gross)) {
      rowErrors.push({ row: rowIndex, field: 'gross', value: row.gross, error: 'Gross amount is required and must be valid decimal' });
    }
    if (!validateDecimal(row.total)) {
      rowErrors.push({ row: rowIndex, field: 'total', value: row.total, error: 'Total amount is required and must be valid decimal' });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    // Generate unique ID based on date and row position
    const dateStr = sanitizeDate(row.date);
    const uniqueId = `transaction_${dateStr}_${Date.now()}_${rowIndex}`;

    // Prepare row for insertion
    const cleanRow = {
      id: uniqueId,
      date: sanitizeDate(row.date),
      transaction: sanitizeText(row.transaction),
      to_go: sanitizeDecimal(row.to_go) || 0,
      dine_in: sanitizeDecimal(row.dine_in) || 0,
      coupon: sanitizeDecimal(row.coupon) || 0,
      gross: sanitizeDecimal(row.gross) || 0,
      total: sanitizeDecimal(row.total) || 0,
      service: sanitizeDecimal(row.service) || 0,
      receipt: sanitizeDecimal(row.receipt) || 0,
      sheet_name: 'csv_import',
      row_index: rowIndex,
    };

    processedRows.push(cleanRow);
  }

  if (errors.length > 0) {
    return {
      success: false,
      totalRows: data.length,
      processedRows: 0,
      skippedRows: data.length,
      errors
    };
  }

  // Insert data (no upsert for transactions as they should be unique)
  const { data: insertResult, error: insertError } = await supabase
    .from('historical_transactions')
    .insert(processedRows)
    .select('id');

  if (insertError) {
    return {
      success: false,
      totalRows: data.length,
      processedRows: 0,
      skippedRows: data.length,
      errors: [{ row: 0, field: 'database', value: '', error: insertError.message }]
    };
  }

  return {
    success: true,
    totalRows: data.length,
    processedRows: insertResult.length,
    skippedRows: 0,
    errors: [],
    summary: {
      inserted: insertResult.length,
      updated: 0,
      failed: 0
    }
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check authentication - for API routes, we need to get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - missing token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check user role (only managers can import data)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Parse form data
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const importType = fields.type?.[0];
    const csvFile = files.file?.[0];

    if (!importType || !csvFile) {
      return res.status(400).json({ error: 'Missing import type or CSV file' });
    }

    if (!['monthly_summary', 'daily_summary', 'transactions'].includes(importType)) {
      return res.status(400).json({ error: 'Invalid import type' });
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvFile.filepath, 'utf-8');
    const results: any[] = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(csvContent);
      stream
        .pipe(csvParser({
          skipEmptyLines: true,
          skipLinesWithError: true
        }))
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Remove empty rows and filter out comment lines
    const cleanResults = results.filter(row => {
      const firstValue = Object.values(row)[0] as string;
      return firstValue && !firstValue.startsWith('#');
    });

    if (cleanResults.length === 0) {
      return res.status(400).json({ error: 'No valid data rows found in CSV file' });
    }

    // Process data based on import type
    let result: ImportResult;
    switch (importType) {
      case 'monthly_summary':
        result = await processMonthlyData(cleanResults, supabase);
        break;
      case 'daily_summary':
        result = await processDailyData(cleanResults, supabase);
        break;
      case 'transactions':
        result = await processTransactionData(cleanResults, supabase);
        break;
      default:
        return res.status(400).json({ error: 'Invalid import type' });
    }

    // Log import activity
    await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'csv_import',
        table_name: importType === 'monthly_summary' ? 'historical_monthly_summary' :
                   importType === 'daily_summary' ? 'historical_daily_summary' :
                   'historical_transactions',
        details: {
          fileName: csvFile.originalFilename,
          importType,
          totalRows: result.totalRows,
          processedRows: result.processedRows,
          errors: result.errors.length
        }
      });

    return res.status(200).json(result);

  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}