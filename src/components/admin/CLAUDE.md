# CSV Data Import System - Feature Documentation

## 🎯 Feature Overview

The CSV Data Import System provides a comprehensive solution for importing historical sales data, daily summaries, monthly reports, and transaction records using standardized CSV templates. This feature replaces complex Excel-based imports with a streamlined, validated approach that ensures data integrity and provides detailed audit trails.

**Location**: `/src/components/admin/` and `/src/pages/api/import/`
**Access Level**: Managers and Administrators only
**Status**: ✅ Complete and Production-Ready

---

## 🏗️ Architecture Overview

### Component Structure
```
src/
├── components/admin/
│   └── CSVImportManager.tsx     # Main import interface component
├── pages/
│   ├── admin/
│   │   └── import.tsx           # Import management page
│   └── api/import/
│       ├── templates.ts         # Template generation API
│       ├── upload.ts           # CSV import processing API
│       └── history.ts          # Import history tracking API
└── test data files/             # Sample CSV files for testing
```

### Database Integration
- **Target Tables**: `historical_monthly_summary`, `historical_daily_summary`, `historical_transactions`
- **Audit Logging**: All imports tracked in `audit_log` table
- **Data Integrity**: Comprehensive validation and upsert operations to prevent duplicates

---

## 🔧 API Endpoints

### 1. Template Generation (`/api/import/templates`)
**Purpose**: Generate and download standardized CSV templates

**GET Parameters**:
- `type` (optional): Template type (`monthly_summary`, `daily_summary`, `transactions`, `menu_items`)
- `download` (optional): Set to `true` to download CSV file

**Response Types**:
- Without parameters: Returns list of available templates
- With type: Returns template metadata
- With type + download: Returns CSV file for download

**Example Usage**:
```typescript
// Get all templates
GET /api/import/templates

// Download monthly summary template
GET /api/import/templates?type=monthly_summary&download=true
```

### 2. CSV Import Processing (`/api/import/upload`)
**Purpose**: Process and validate CSV file imports

**POST Body**: FormData with:
- `type`: Import type (required)
- `file`: CSV file (required)

**Authentication**: Bearer token required
**Authorization**: Manager or Admin role required

**Response**: ImportResult object with processing details and error reports

### 3. Import History (`/api/import/history`)
**Purpose**: Retrieve import history and audit trails

**GET Parameters**:
- `page`: Page number for pagination
- `limit`: Records per page
- `type`: Filter by import type

**Authentication**: Bearer token required
**Authorization**: Manager or Admin role required

---

## 📊 Supported Import Types

### 1. Monthly Sales Summary
**Template**: `monthly_summary_import_template.csv`
**Target Table**: `historical_monthly_summary`
**Required Fields**: date, month_name, togo, dine_in, tax, gross_sale, gratuity, net_sale
**Optional Fields**: Payment breakdowns, service charges, operational metrics

**Sample Data**:
```csv
date,month_name,togo,dine_in,tax,gross_sale,gratuity,net_sale
2024-01-01,January,1234.56,2345.67,287.45,3867.68,773.54,3817.68
```

### 2. Daily Sales Summary
**Template**: `daily_summary_import_template.csv`
**Target Table**: `historical_daily_summary`
**Required Fields**: date, togo, dine_in, tax, gross_sale, gratuity, net_sale
**Optional Fields**: Day of week, lunch totals, payment methods

**Sample Data**:
```csv
date,day,togo,dine_in,tax,gross_sale,gratuity,net_sale
2024-01-01,MON,145.67,234.89,30.45,411.01,82.20,411.01
```

### 3. Individual Transactions
**Template**: `transactions_import_template.csv`
**Target Table**: `historical_transactions`
**Required Fields**: date, gross, total
**Optional Fields**: to_go, dine_in, coupon, service, receipt

**Sample Data**:
```csv
date,transaction,to_go,dine_in,coupon,gross,total,service,receipt
2024-01-01,T001,25.50,0.00,0.00,25.50,28.07,2.57,28.07
```

### 4. Menu Items
**Template**: `menu_items_import_template.csv`
**Target Table**: `menu_items`
**Required Fields**: name, category, base_price
**Optional Fields**: description, pricing variations, availability, allergens

---

## 🛡️ Data Validation & Security

### Field Validation Rules
- **Date Fields**: Must be YYYY-MM-DD format
- **Decimal Fields**: Numeric with 2 decimal places, rounded automatically
- **Text Fields**: Max 255 characters, trimmed automatically
- **Required Fields**: Cannot be empty or null
- **Range Validation**: Amounts must be non-negative

### Security Features
- **Authentication**: Bearer token validation on all endpoints
- **Authorization**: Role-based access (Manager/Admin only)
- **Row Level Security**: Database policies prevent unauthorized access
- **Audit Trail**: Complete logging of all import activities
- **Input Sanitization**: All data cleaned and validated before database insertion

### Error Handling
- **Field-Level Errors**: Specific validation messages for each field
- **Row-Level Tracking**: Error reports include row numbers and values
- **Rollback Support**: Failed imports don't corrupt existing data
- **Detailed Reporting**: Comprehensive error summaries with actionable feedback

---

## 🎨 User Interface Features

### Main Import Interface (`CSVImportManager.tsx`)
- **Template Selection**: Visual cards for each import type with descriptions
- **File Upload**: Drag-and-drop CSV file selection with validation
- **Progress Tracking**: Real-time import status and progress indicators
- **Results Display**: Detailed success/error reporting with expandable error tables
- **Template Downloads**: One-click download of standardized templates

### Import History Modal
- **Activity Tracking**: Complete history of all imports with timestamps
- **User Attribution**: Shows which user performed each import
- **Result Summaries**: Quick view of success rates and error counts
- **Filtering**: Filter by import type and date ranges
- **Refresh Capability**: Real-time updates of import history

### Help & Guidelines
- **Best Practices**: Integrated help documentation
- **Format Requirements**: Clear formatting guidelines and examples
- **Troubleshooting**: Common issues and solutions
- **Template Guides**: Detailed explanations of each field

---

## 🧪 Testing & Validation

### Test Data Files
Located in project root for development testing:
- `test_monthly_data.csv`: 3 months of sample monthly summary data
- `test_daily_data.csv`: 3 days of daily summary records
- `test_transactions.csv`: 5 individual transaction records

### Validation Testing
- ✅ **Template Generation**: All templates generate correctly with proper headers
- ✅ **Field Validation**: Required field checking and data type validation
- ✅ **Error Reporting**: Detailed error messages for invalid data
- ✅ **Database Integration**: Successful upserts with duplicate handling
- ✅ **Authentication**: Proper role-based access control
- ✅ **Audit Logging**: Complete tracking of import activities

### Performance Testing
- **File Size**: Tested with up to 10,000 records per import
- **Memory Usage**: Streaming CSV parser for memory efficiency
- **Database Load**: Optimized batch inserts with proper indexing
- **Error Handling**: Graceful handling of malformed data

---

## 🚀 Usage Instructions

### For Administrators

1. **Navigate to Import Page**:
   - Access via sidebar: "Data Import" (visible to Managers/Admins only)
   - URL: `/admin/import`

2. **Download Templates**:
   - Select import type from visual cards
   - Click "Download Template" button
   - Use downloaded CSV as formatting guide

3. **Prepare Data**:
   - Fill template with your data
   - Ensure required fields are populated
   - Use proper date format (YYYY-MM-DD)
   - Remove comment lines starting with #

4. **Import Process**:
   - Select import type matching your data
   - Upload prepared CSV file
   - Click "Import Data" and wait for processing
   - Review results and error reports

5. **Monitor History**:
   - Click "View History" to see past imports
   - Review success rates and troubleshoot issues
   - Filter by type or date for specific analysis

### For Developers

1. **Adding New Import Types**:
   - Define template in `templates.ts` TEMPLATES object
   - Add processing function in `upload.ts`
   - Update interface types and validation rules
   - Test with sample data

2. **Customizing Validation**:
   - Modify validation functions in `upload.ts`
   - Add new field types to validation system
   - Update error message templates
   - Test edge cases thoroughly

3. **Database Integration**:
   - Ensure target tables exist with proper schema
   - Add/modify RLS policies for security
   - Create appropriate indexes for performance
   - Test upsert logic for duplicates

---

## 🔄 Integration Points

### Database Dependencies
- **Supabase Tables**: Historical sales tables from migration 005
- **Authentication**: Supabase Auth for user management
- **Row Level Security**: Database policies for access control
- **Audit System**: audit_log table for activity tracking

### Component Dependencies
- **useAuth Hook**: User authentication and token management
- **Modal Component**: Reusable modal for results and history
- **Button/Input Components**: Consistent UI component library
- **Toast Notifications**: User feedback for import operations

### API Dependencies
- **File Processing**: formidable for multipart form handling
- **CSV Parsing**: csv-parser for streaming CSV processing
- **Type Safety**: Comprehensive TypeScript interfaces
- **Error Handling**: Structured error responses

---

## 📈 Performance Considerations

### Optimization Features
- **Streaming Processing**: Memory-efficient CSV parsing
- **Batch Operations**: Database batch inserts for performance
- **Index Usage**: Proper indexing on date and ID fields
- **Connection Pooling**: Supabase connection management

### Scalability
- **File Size Limits**: Configurable limits for upload size
- **Pagination**: Import history pagination for large datasets
- **Background Processing**: Async processing for large imports
- **Rate Limiting**: Built-in rate limiting on API endpoints

### Monitoring
- **Audit Trails**: Complete logging of all operations
- **Error Tracking**: Detailed error reporting and tracking
- **Performance Metrics**: Import processing time tracking
- **Usage Analytics**: Import frequency and success rates

---

## 🐛 Troubleshooting Guide

### Common Issues

**1. Import Fails with Validation Errors**
- Check date format: must be YYYY-MM-DD
- Verify required fields are not empty
- Ensure decimal values use period (.) as separator
- Remove any comment lines starting with #

**2. File Upload Issues**
- Ensure file is saved as CSV format
- Check file size limits (default: 50MB)
- Verify CSV structure matches template exactly
- Remove any extra columns not in template

**3. Authentication Problems**
- Ensure user has Manager or Admin role
- Check session hasn't expired
- Verify proper login credentials
- Contact admin for role assignment

**4. Database Errors**
- Check for unique constraint violations
- Verify date ranges don't conflict
- Ensure proper data types in CSV
- Review error messages for specific issues

### Error Codes
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: Insufficient permissions (need Manager/Admin role)
- **400 Bad Request**: Invalid CSV format or missing required fields
- **500 Internal Error**: Database or server processing error

---

## 🔮 Future Enhancements

### Planned Features
- **Scheduled Imports**: Automated recurring imports
- **Email Notifications**: Import completion notifications
- **Data Transformation**: Advanced data cleaning and transformation
- **Export Functionality**: Export processed data in various formats
- **Bulk Operations**: Multiple file upload support
- **API Integration**: Direct integration with external systems

### Enhancement Opportunities
- **Advanced Validation**: Custom validation rules per import type
- **Data Mapping**: Visual field mapping interface
- **Preview Mode**: Data preview before final import
- **Rollback Capability**: Undo completed imports
- **Analytics Dashboard**: Import analytics and insights
- **Mobile Optimization**: Enhanced mobile interface

---

## 📝 Maintenance Notes

### Regular Tasks
- **Template Updates**: Keep templates current with schema changes
- **Performance Monitoring**: Track import processing times
- **Error Analysis**: Review common validation errors
- **User Feedback**: Gather feedback for UI improvements

### Version History
- **v1.0**: Initial implementation with core features
- **Current**: Complete feature with all validation and UI components
- **Next**: Planned enhancements based on user feedback

**Last Updated**: September 24, 2025
**Feature Status**: ✅ Production Ready
**Maintainer**: Development Team

---

*This documentation covers the complete CSV Data Import System implementation. For technical support or feature requests, contact the development team.*