// Reports page for Fuji POS System MVP
import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { DailySummary } from '../components/reports/DailySummary';
import { MonthlyExport } from '../components/reports/MonthlyExport';
import { GrandTotalsExport } from '../components/reports/GrandTotalsExport';
import ReceiptsDashboard from '../components/receipts/ReceiptsDashboard';

type ReportTab = 'daily' | 'monthly' | 'grand' | 'receipts';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');

  const tabs = [
    { id: 'daily' as ReportTab, label: 'Daily Summary' },
    { id: 'monthly' as ReportTab, label: 'Monthly Export' },
    { id: 'grand' as ReportTab, label: 'Grand Totals' },
    { id: 'receipts' as ReportTab, label: 'Receipts' },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Reports</h1>
          <p className="text-gray-600">
            View daily sales, export monthly reports, and generate grand totals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'daily' && <DailySummary />}
          {activeTab === 'monthly' && <MonthlyExport />}
          {activeTab === 'grand' && <GrandTotalsExport />}
          {activeTab === 'receipts' && <ReceiptsDashboard />}
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
