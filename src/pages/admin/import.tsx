import React from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../../components/layout/Layout';
import CSVImportManager from '../../components/admin/CSVImportManager';
import { PermissionGuard } from '../../components/ui/PermissionGuard';

const ImportPage: React.FC = () => {
  return (
    <Layout>
      <PermissionGuard requiredRoles={['admin', 'manager']}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Data Import Management
            </h1>
            <p className="text-lg text-gray-600">
              Import historical sales data and menu items using standardized CSV templates
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Import Interface */}
            <div className="lg:col-span-2">
              <CSVImportManager />
            </div>

            {/* Help and Guidelines */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Import Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Download the appropriate template before importing</li>
                  <li>• Ensure all required fields are populated</li>
                  <li>• Use the exact date format: YYYY-MM-DD</li>
                  <li>• Decimal values should use period (.) as separator</li>
                  <li>• Remove any comment lines starting with #</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  Data Types Supported
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-yellow-900">Monthly Summary</h4>
                    <p className="text-yellow-800">Aggregated monthly sales data with totals and breakdowns</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-900">Daily Summary</h4>
                    <p className="text-yellow-800">Daily sales breakdowns with operational metrics</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-900">Transactions</h4>
                    <p className="text-yellow-800">Individual transaction records for detailed analysis</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Best Practices
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Test with a small sample first</li>
                  <li>• Review the import results carefully</li>
                  <li>• Keep backup copies of your source data</li>
                  <li>• Monitor import history for trends</li>
                  <li>• Contact support if you encounter issues</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Need Help?
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Having trouble with your CSV import? Check these resources:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Review the error messages in import results</li>
                  <li>• Compare your CSV with the template format</li>
                  <li>• Check the import history for successful patterns</li>
                  <li>• Verify your data meets validation requirements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </Layout>
  );
};

export default ImportPage;

// Only authenticated managers/admins can access this page
export const getServerSideProps: GetServerSideProps = async (context) => {
  // This will be handled by the PermissionGuard component
  return {
    props: {}
  };
};