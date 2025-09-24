import { NextApiRequest, NextApiResponse } from 'next';

interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'date' | 'decimal';
  required: boolean;
  description: string;
  example?: string;
}

interface CSVTemplate {
  name: string;
  description: string;
  fields: TemplateField[];
}

// Template definitions for different import types
const TEMPLATES: Record<string, CSVTemplate> = {
  monthly_summary: {
    name: 'Monthly Sales Summary',
    description: 'Import monthly aggregated sales data',
    fields: [
      { name: 'date', type: 'date', required: true, description: 'Month date (YYYY-MM-01)', example: '2024-01-01' },
      { name: 'month_name', type: 'text', required: true, description: 'Month name', example: 'January' },
      { name: 'togo', type: 'decimal', required: true, description: 'To-go sales amount', example: '1234.56' },
      { name: 'dine_in', type: 'decimal', required: true, description: 'Dine-in sales amount', example: '2345.67' },
      { name: 'tax', type: 'decimal', required: true, description: 'Tax collected', example: '287.45' },
      { name: 'gross_sale', type: 'decimal', required: true, description: 'Gross sales total', example: '3867.68' },
      { name: 'gratuity', type: 'decimal', required: true, description: 'Gratuity amount', example: '773.54' },
      { name: 'coupon_subtract', type: 'decimal', required: false, description: 'Coupon discounts', example: '50.00' },
      { name: 'net_sale', type: 'decimal', required: true, description: 'Net sales after discounts', example: '3817.68' },
      { name: 'tip_cr', type: 'decimal', required: false, description: 'Credit card tips', example: '650.00' },
      { name: 'tip_cash', type: 'decimal', required: false, description: 'Cash tips', example: '123.54' },
      { name: 'credt_total', type: 'decimal', required: false, description: 'Credit card total', example: '3200.00' },
      { name: 'deposited', type: 'decimal', required: false, description: 'Cash deposited', example: '617.68' },
      { name: 'cash', type: 'decimal', required: false, description: 'Cash sales', example: '617.68' },
      { name: 'sc_merch', type: 'decimal', required: false, description: 'Merchant service charge', example: '112.00' },
      { name: 'sc_owner', type: 'decimal', required: false, description: 'Owner service charge', example: '0.00' },
      { name: 'daily_earned', type: 'decimal', required: false, description: 'Daily earnings calculated', example: '3705.68' },
      { name: 'no_of_days_closed', type: 'number', required: false, description: 'Number of closed days', example: '4' },
      { name: 'no_of_days_month', type: 'number', required: false, description: 'Working days in month', example: '27' },
    ]
  },

  daily_summary: {
    name: 'Daily Sales Summary',
    description: 'Import daily aggregated sales data',
    fields: [
      { name: 'date', type: 'date', required: true, description: 'Sales date (YYYY-MM-DD)', example: '2024-01-15' },
      { name: 'day', type: 'text', required: false, description: 'Day of week', example: 'MON' },
      { name: 'togo', type: 'decimal', required: true, description: 'To-go sales amount', example: '145.67' },
      { name: 'dine_in', type: 'decimal', required: true, description: 'Dine-in sales amount', example: '234.89' },
      { name: 'tax', type: 'decimal', required: true, description: 'Tax collected', example: '30.45' },
      { name: 'gross_sale', type: 'decimal', required: true, description: 'Gross sales total', example: '411.01' },
      { name: 'gratuity', type: 'decimal', required: true, description: 'Gratuity amount', example: '82.20' },
      { name: 'coupon_subtract', type: 'decimal', required: false, description: 'Coupon discounts', example: '0.00' },
      { name: 'net_sale', type: 'decimal', required: true, description: 'Net sales after discounts', example: '411.01' },
      { name: 'tip_cr', type: 'decimal', required: false, description: 'Credit card tips', example: '70.00' },
      { name: 'tip_cash', type: 'decimal', required: false, description: 'Cash tips', example: '12.20' },
      { name: 'credt_total', type: 'decimal', required: false, description: 'Credit card total', example: '350.00' },
      { name: 'deposited', type: 'decimal', required: false, description: 'Cash deposited', example: '61.01' },
      { name: 'cash', type: 'decimal', required: false, description: 'Cash sales', example: '61.01' },
      { name: 'sc_merch', type: 'decimal', required: false, description: 'Merchant service charge', example: '12.25' },
      { name: 'daily_earned', type: 'decimal', required: false, description: 'Daily earnings', example: '398.76' },
      { name: 'lunch', type: 'decimal', required: false, description: 'Lunch sales', example: '150.00' },
    ]
  },

  transactions: {
    name: 'Individual Transactions',
    description: 'Import individual transaction records',
    fields: [
      { name: 'date', type: 'date', required: true, description: 'Transaction date (YYYY-MM-DD)', example: '2024-01-15' },
      { name: 'transaction', type: 'text', required: false, description: 'Transaction identifier', example: 'T001' },
      { name: 'to_go', type: 'decimal', required: false, description: 'To-go amount', example: '25.50' },
      { name: 'dine_in', type: 'decimal', required: false, description: 'Dine-in amount', example: '45.75' },
      { name: 'coupon', type: 'decimal', required: false, description: 'Coupon discount', example: '5.00' },
      { name: 'gross', type: 'decimal', required: true, description: 'Gross transaction amount', example: '71.25' },
      { name: 'total', type: 'decimal', required: true, description: 'Final transaction total', example: '78.07' },
      { name: 'service', type: 'decimal', required: false, description: 'Service charge', example: '2.49' },
      { name: 'receipt', type: 'decimal', required: false, description: 'Receipt total', example: '78.07' },
    ]
  },

  menu_items: {
    name: 'Menu Items',
    description: 'Import menu items and pricing',
    fields: [
      { name: 'name', type: 'text', required: true, description: 'Item name', example: 'California Roll' },
      { name: 'category', type: 'text', required: true, description: 'Menu category', example: 'sushi_rolls' },
      { name: 'description', type: 'text', required: false, description: 'Item description', example: 'Fresh crab, avocado, cucumber' },
      { name: 'base_price', type: 'decimal', required: true, description: 'Base price', example: '12.95' },
      { name: 'lunch_price', type: 'decimal', required: false, description: 'Lunch price', example: '9.95' },
      { name: 'dinner_price', type: 'decimal', required: false, description: 'Dinner price', example: '12.95' },
      { name: 'glass_price', type: 'decimal', required: false, description: 'Glass price (beverages)', example: '8.00' },
      { name: 'bottle_price', type: 'decimal', required: false, description: 'Bottle price (beverages)', example: '28.00' },
      { name: 'availability', type: 'text', required: false, description: 'Available (true/false)', example: 'true' },
      { name: 'allergens', type: 'text', required: false, description: 'Allergen warnings', example: 'shellfish, gluten' },
    ]
  }
};

function generateCSVTemplate(template: CSVTemplate): string {
  // Generate header row
  const headers = template.fields.map(field => field.name);

  // Generate example row
  const exampleRow = template.fields.map(field => field.example || '');

  // Generate description row (as comments)
  const descriptionRow = template.fields.map(field => `# ${field.description}`);

  return [
    `# ${template.name}`,
    `# ${template.description}`,
    `# Required fields: ${template.fields.filter(f => f.required).map(f => f.name).join(', ')}`,
    '#',
    descriptionRow.join(','),
    headers.join(','),
    exampleRow.join(',')
  ].join('\n');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, download } = req.query;

    // If no type specified, return list of available templates
    if (!type) {
      const templateList = Object.keys(TEMPLATES).map(key => ({
        type: key,
        name: TEMPLATES[key].name,
        description: TEMPLATES[key].description,
        fieldCount: TEMPLATES[key].fields.length,
        requiredFields: TEMPLATES[key].fields.filter(f => f.required).length
      }));

      return res.status(200).json({ templates: templateList });
    }

    // Validate template type
    if (typeof type !== 'string' || !TEMPLATES[type]) {
      return res.status(400).json({
        error: 'Invalid template type',
        availableTypes: Object.keys(TEMPLATES)
      });
    }

    const template = TEMPLATES[type];

    // If download requested, return CSV file
    if (download === 'true') {
      const csvContent = generateCSVTemplate(template);
      const fileName = `${type}_import_template.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(csvContent);
    }

    // Return template metadata
    return res.status(200).json({
      template: {
        type,
        ...template,
        example_csv_url: `/api/import/templates?type=${type}&download=true`
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}