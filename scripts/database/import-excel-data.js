// Import Excel data into Supabase tables
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importExcelData() {
  console.log('📊 Importing Excel Data to Supabase...\n');

  try {
    // Read Excel files
    const salesSummaryPath = path.join(__dirname, '..', 'ref', 'Grand_Totals_Sales_Summary.xlsx');
    const monthlySalesPath = path.join(__dirname, '..', 'ref', 'Month_Year_SALES.xlsx');

    console.log('1. Reading Excel files...');
    
    // Check if files exist
    if (!fs.existsSync(salesSummaryPath)) {
      console.log('❌ Grand_Totals_Sales_Summary.xlsx not found');
      return;
    }
    
    if (!fs.existsSync(monthlySalesPath)) {
      console.log('❌ Month_Year_SALES.xlsx not found');
      return;
    }

    // Read the Excel files
    const salesSummaryWorkbook = XLSX.readFile(salesSummaryPath);
    const monthlySalesWorkbook = XLSX.readFile(monthlySalesPath);

    // Get the first sheet from each workbook
    const salesSummarySheet = salesSummaryWorkbook.Sheets[salesSummaryWorkbook.SheetNames[0]];
    const monthlySalesSheet = monthlySalesWorkbook.Sheets[monthlySalesWorkbook.SheetNames[0]];

    // Convert to JSON
    const salesSummaryData = XLSX.utils.sheet_to_json(salesSummarySheet);
    const monthlySalesData = XLSX.utils.sheet_to_json(monthlySalesSheet);

    console.log(`   ✅ Found ${salesSummaryData.length} rows in Grand_Totals_Sales_Summary.xlsx`);
    console.log(`   ✅ Found ${monthlySalesData.length} rows in Month_Year_SALES.xlsx`);

    // Process and insert Grand Totals data
    console.log('\n2. Processing Grand Totals data...');
    const grandTotalsData = salesSummaryData.map(row => ({
      period_type: 'total',
      period_value: row.Period || 'All Time',
      total_sales: parseFloat(row['Total Sales']) || 0,
      total_tax: parseFloat(row['Total Tax']) || 0,
      total_gratuity: parseFloat(row['Total Gratuity']) || 0,
      net_sales: parseFloat(row['Net Sales']) || 0,
      cash_sales: parseFloat(row['Cash Sales']) || 0,
      credit_sales: parseFloat(row['Credit Sales']) || 0,
      total_orders: parseInt(row['Total Orders']) || 0,
      average_ticket: parseFloat(row['Average Ticket']) || 0
    }));

    // Clear existing data first
    await supabase.from('grand_totals').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: grandTotalsError } = await supabase
      .from('grand_totals')
      .insert(grandTotalsData);

    if (grandTotalsError) {
      console.log('   ❌ Grand totals insertion failed:', grandTotalsError.message);
    } else {
      console.log('   ✅ Grand totals inserted successfully');
    }

    // Process and insert Monthly Sales data
    console.log('\n3. Processing Monthly Sales data...');
    const monthlySalesProcessed = monthlySalesData
      .filter(row => {
        const monthYear = row['Month/Year'] || row['Month Year'] || row['Month_Year'];
        return monthYear && monthYear.toString().trim() !== '';
      })
      .map(row => ({
        month_year: row['Month/Year'] || row['Month Year'] || row['Month_Year'],
        total_sales: parseFloat(row['Total Sales']) || 0,
        total_tax: parseFloat(row['Total Tax']) || 0,
        total_gratuity: parseFloat(row['Total Gratuity']) || 0,
        net_sales: parseFloat(row['Net Sales']) || 0,
        cash_sales: parseFloat(row['Cash Sales']) || 0,
        credit_sales: parseFloat(row['Credit Sales']) || 0,
        total_orders: parseInt(row['Total Orders']) || 0,
        average_ticket: parseFloat(row['Average Ticket']) || 0
      }));

    // Clear existing data first
    await supabase.from('monthly_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: monthlySalesError } = await supabase
      .from('monthly_sales')
      .insert(monthlySalesProcessed);

    if (monthlySalesError) {
      console.log('   ❌ Monthly sales insertion failed:', monthlySalesError.message);
    } else {
      console.log('   ✅ Monthly sales inserted successfully');
    }

    console.log('\n🎉 Excel data import complete!');
    
    // Verify the data
    const { data: grandTotals } = await supabase
      .from('grand_totals')
      .select('*');
    
    const { data: monthlySales } = await supabase
      .from('monthly_sales')
      .select('*');

    console.log(`✅ Imported ${grandTotals?.length || 0} grand totals records`);
    console.log(`✅ Imported ${monthlySales?.length || 0} monthly sales records`);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.log('\n📝 Make sure you have the xlsx package installed:');
    console.log('npm install xlsx');
  }
}

importExcelData();
