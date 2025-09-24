// Server Analysis Component for Historical Analytics
import React from 'react';

interface ServerData {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  totalGratuity?: number;
  hoursWorked?: number;
}

interface ServerAnalysisProps {
  data: ServerData[];
  dateRange: { start: string; end: string };
  title?: string;
  className?: string;
}

export const ServerAnalysis: React.FC<ServerAnalysisProps> = ({
  data,
  dateRange,
  title = 'Server Analysis',
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No server data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Sort servers by total sales
  const sortedServers = [...data].sort((a, b) => b.totalSales - a.totalSales);

  // Calculate totals for percentages
  const totalSales = sortedServers.reduce((sum, server) => sum + server.totalSales, 0);
  const totalOrders = sortedServers.reduce((sum, server) => sum + server.totalOrders, 0);
  const totalGratuity = sortedServers.reduce((sum, server) => sum + (server.totalGratuity || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getServerName = (server: ServerData) => {
    return server.fullName ||
           `${server.firstName || ''} ${server.lastName || ''}`.trim() ||
           server.username ||
           'Unknown Server';
  };

  const getServerColor = (index: number) => {
    const colors = [
      'bg-green-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  const getPerformanceBadge = (server: ServerData, index: number) => {
    const avgTicket = server.averageTicket;
    const overallAvg = totalOrders > 0 ? totalSales / totalOrders : 0;

    if (index === 0) return { text: '🏆 Top Performer', class: 'bg-yellow-100 text-yellow-800' };
    if (avgTicket > overallAvg * 1.2) return { text: '⭐ High Ticket', class: 'bg-blue-100 text-blue-800' };
    if (server.totalOrders > totalOrders / sortedServers.length * 1.5) return { text: '📈 High Volume', class: 'bg-green-100 text-green-800' };
    return { text: '👍 Good', class: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">
          Server performance for selected period
        </p>
      </div>

      <div className="p-6">
        {/* Top Performers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {sortedServers.slice(0, 3).map((server, index) => {
            const salesPercentage = totalSales > 0 ? (server.totalSales / totalSales) * 100 : 0;
            const badge = getPerformanceBadge(server, index);

            return (
              <div key={server.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${getServerColor(index)} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-lg font-bold">
                        {getServerName(server).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{getServerName(server)}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(server.totalSales)}
                    </p>
                    <p className="text-sm text-gray-500">{salesPercentage.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-medium text-gray-900">{server.totalOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Ticket:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(server.averageTicket)}</span>
                  </div>
                  {server.totalGratuity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tips:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(server.totalGratuity)}</span>
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`${getServerColor(index)} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${salesPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sales Distribution Chart */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Sales Distribution</h4>
          <div className="flex rounded-lg overflow-hidden h-8">
            {sortedServers.map((server, index) => {
              const percentage = totalSales > 0 ? (server.totalSales / totalSales) * 100 : 0;
              return (
                <div
                  key={server.id}
                  className={`${getServerColor(index)} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                  title={`${getServerName(server)}: ${percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>

        {/* Detailed Performance Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Server
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tips
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedServers.map((server, index) => {
                const percentage = totalSales > 0 ? (server.totalSales / totalSales) * 100 : 0;
                const badge = getPerformanceBadge(server, index);

                return (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${getServerColor(index)} rounded-full flex items-center justify-center mr-3`}>
                          <span className="text-white text-sm font-bold">
                            {getServerName(server).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getServerName(server)}</div>
                          <div className="text-sm text-gray-500">#{index + 1} by sales</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(server.totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {server.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(server.averageTicket)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(server.totalGratuity || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`${getServerColor(index)} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Top Server</p>
            <p className="font-bold text-gray-900 truncate">
              {getServerName(sortedServers[0]) || 'N/A'}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Active Servers</p>
            <p className="font-bold text-gray-900">
              {sortedServers.length}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Avg per Server</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(sortedServers.length > 0 ? totalSales / sortedServers.length : 0)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Overall Avg Ticket</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Total Tips</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(totalGratuity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerAnalysis;