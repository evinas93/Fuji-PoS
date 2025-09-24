// Server Performance Component - Following PRD format: "John: $1,234"
import React from 'react';

interface ServerStat {
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

interface ServerPerformanceProps {
  servers: ServerStat[];
  className?: string;
}

export const ServerPerformance: React.FC<ServerPerformanceProps> = ({
  servers,
  className = ''
}) => {
  if (!servers || servers.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No server data available</p>
      </div>
    );
  }

  // Sort servers by total sales (highest first)
  const sortedServers = servers
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10); // Show top 10 servers

  const totalSales = sortedServers.reduce((sum, server) => sum + server.totalSales, 0);

  return (
    <div className={className}>
      <div className="space-y-3">
        {sortedServers.map((server, index) => {
          const rank = index + 1;
          const displayName = server.fullName ||
                            `${server.firstName || ''} ${server.lastName || ''}`.trim() ||
                            server.username ||
                            'Unknown Server';

          const salesPercentage = totalSales > 0 ? (server.totalSales / totalSales) * 100 : 0;

          return (
            <div
              key={server.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  rank === 1 ? 'bg-green-500 text-white' :
                  rank === 2 ? 'bg-blue-500 text-white' :
                  rank === 3 ? 'bg-purple-500 text-white' :
                  'bg-gray-300 text-gray-700'
                }`}>
                  {rank}
                </div>

                {/* Server Info */}
                <div>
                  <p className="font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {server.totalOrders} orders • ${server.averageTicket.toFixed(0)} avg
                  </p>
                </div>
              </div>

              <div className="text-right">
                {/* Sales Amount - Following PRD format: "John: $1,234" */}
                <p className="text-lg font-bold text-gray-900">
                  ${server.totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${salesPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {salesPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Top Server</p>
            <p className="font-bold text-gray-900 truncate">
              {sortedServers[0]?.fullName ||
               `${sortedServers[0]?.firstName || ''} ${sortedServers[0]?.lastName || ''}`.trim() ||
               sortedServers[0]?.username ||
               'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Top Sales</p>
            <p className="font-bold text-gray-900">
              ${(sortedServers[0]?.totalSales || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Servers Active</p>
            <p className="font-bold text-gray-900">
              {sortedServers.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg per Server</p>
            <p className="font-bold text-gray-900">
              ${sortedServers.length > 0
                ? Math.round(totalSales / sortedServers.length).toLocaleString('en-US')
                : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerPerformance;