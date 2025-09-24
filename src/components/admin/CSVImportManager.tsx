import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  errors: ValidationError[];
  summary?: {
    inserted: number;
    updated: number;
    failed: number;
  };
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ImportTemplate {
  type: string;
  name: string;
  description: string;
  fieldCount: number;
  requiredFields: number;
}

interface ImportHistory {
  id: string;
  created_at: string;
  user_name: string;
  details: {
    fileName: string;
    importType: string;
    totalRows: number;
    processedRows: number;
    errors: number;
  };
}

const CSVImportManager: React.FC = () => {
  const { getToken } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const importTypes = [
    {
      value: 'monthly_summary',
      label: 'Monthly Sales Summary',
      description: 'Import aggregated monthly sales data from historical records'
    },
    {
      value: 'daily_summary',
      label: 'Daily Sales Summary',
      description: 'Import daily sales breakdowns and operational metrics'
    },
    {
      value: 'transactions',
      label: 'Individual Transactions',
      description: 'Import detailed transaction records for comprehensive analysis'
    }
  ];

  // Load available templates - now just used for template downloads

  // Load import history
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/import/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json() as { history: ImportHistory[] };
        setHistory(data.history || []);
      } else {
        toast.error('Failed to load import history');
      }
    } catch (error) {
      toast.error('Error loading history');
      console.error('History loading error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Download template
  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/import/templates?type=${type}&download=true`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_import_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Template downloaded successfully');
      } else {
        toast.error('Failed to download template');
      }
    } catch (error) {
      toast.error('Error downloading template');
      console.error('Template download error:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedType || !selectedFile) {
      toast.error('Please select import type and file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('type', selectedType);
      formData.append('file', selectedFile);

      const token = await getToken();
      const response = await fetch('/api/import/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json() as ImportResult & { error?: string };

      if (response.ok) {
        setImportResult(result);
        setShowResults(true);
        if (result.success) {
          toast.success(`Successfully imported ${result.processedRows} records`);
        } else {
          toast.error(`Import failed with ${result.errors.length} errors`);
        }
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (error) {
      toast.error('Error during import');
      console.error('Import error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // No useEffect needed - templates are hardcoded in importTypes

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CSV Data Import</h2>
        <p className="text-gray-600">
          Import historical sales data using standardized CSV templates
        </p>
      </div>

      <div className="space-y-6">
        {/* Import Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {importTypes.map((type) => (
              <div
                key={type.value}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedType(type.value)}
              >
                <h3 className="font-medium text-gray-900">{type.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate(type.value);
                    }}
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div>
                <p className="text-green-600 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {Math.round(selectedFile.size / 1024)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-2">Select a CSV file to import</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Import Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-3">
            <Button
              onClick={handleImport}
              disabled={!selectedType || !selectedFile || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? 'Importing...' : 'Import Data'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistory(true)}
              disabled={loadingHistory}
            >
              View History
            </Button>
          </div>
        </div>
      </div>

      {/* Import Results Modal */}
      <Modal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        title="Import Results"
      >
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total Rows</p>
                <p className="text-xl font-semibold">{importResult.totalRows}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-xl font-semibold text-green-600">{importResult.processedRows}</p>
              </div>
              {importResult.skippedRows > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-xl font-semibold text-yellow-600">{importResult.skippedRows}</p>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-xl font-semibold text-red-600">{importResult.errors.length}</p>
                </div>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors</h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Field</th>
                        <th className="px-3 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importResult.errors.map((error, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{error.row}</td>
                          <td className="px-3 py-2">{error.field}</td>
                          <td className="px-3 py-2 text-red-600">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowResults(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Import History"
        size="large"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Recent CSV imports</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">File</th>
                  <th className="px-3 py-2 text-left">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-2">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">{record.user_name}</td>
                    <td className="px-3 py-2">{record.details.importType}</td>
                    <td className="px-3 py-2">{record.details.fileName}</td>
                    <td className="px-3 py-2">
                      <span className="text-green-600">{record.details.processedRows}</span>
                      {' / '}
                      <span className="text-gray-600">{record.details.totalRows}</span>
                      {record.details.errors > 0 && (
                        <span className="text-red-600"> ({record.details.errors} errors)</span>
                      )}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                      No import history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CSVImportManager;