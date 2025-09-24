// Analytics Dashboard Page
import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Layout } from '../components/layout/Layout';
import { PermissionGuard } from '../components/ui/PermissionGuard';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';

const AnalyticsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Analytics Dashboard - Fuji POS</title>
        <meta name="description" content="Real-time analytics and reporting dashboard for Fuji Restaurant POS" />
      </Head>

      <Layout title="Analytics Dashboard">
        <PermissionGuard
          requiredPermissions={['read_analytics', 'read_orders']}
          fallback={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
              <p className="text-gray-600">
                You don't have permission to view analytics. Please contact your manager.
              </p>
            </div>
          }
        >
          <AnalyticsDashboard />
        </PermissionGuard>
      </Layout>
    </>
  );
};

export default AnalyticsPage;