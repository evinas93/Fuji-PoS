// AI-powered sales forecast dashboard component
import React from 'react';
import { useSalesForecastRealtime, useForecastInsights } from '../../hooks/useSalesForecast';
import { Button } from '../ui/Button';

interface AIForecastDashboardProps {
  className?: string;
}

export const AIForecastDashboard: React.FC<AIForecastDashboardProps> = ({ className = '' }) => {
  const { forecasts, accuracy, isLoading, error, refetch } = useSalesForecastRealtime({
    daysAhead: 7,
  });

  const insights = useForecastInsights(Array.isArray(forecasts) ? forecasts : []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">AI Forecast Error</h3>
        <p className="text-red-600 mb-4">
          Unable to generate sales forecast. Please check your data and try again.
        </p>
        <Button onClick={() => refetch()} variant="secondary" size="sm">
          Retry Forecast
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">🤖 AI Sales Forecast</h3>
            <p className="text-sm text-gray-500">
              Next 7 days prediction with {insights.averageConfidence}% confidence
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {Boolean(accuracy && typeof accuracy === 'object' && 'accuracy' in accuracy) && (
              <div className="text-sm text-gray-500">
                Accuracy: <span className="font-medium">{(accuracy as any).accuracy}%</span>
              </div>
            )}
            <Button onClick={() => refetch()} variant="secondary" size="sm">
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Predicted Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${insights.totalPredictedRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Trend Analysis</p>
                <p className="text-2xl font-bold text-green-900 capitalize">
                  {insights.trendAnalysis}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">AI Confidence</p>
                <p className="text-2xl font-bold text-purple-900">{insights.averageConfidence}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Forecasts */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Daily Forecasts</h4>
          <div className="space-y-3">
            {Array.isArray(forecasts) &&
              forecasts.map((forecast, index) => (
                <div
                  key={forecast.date}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {new Date(forecast.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(forecast.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        vs. avg: ${forecast.historicalAverage.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${forecast.predictedRevenue.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            forecast.trend === 'up'
                              ? 'bg-green-100 text-green-800'
                              : forecast.trend === 'down'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {forecast.trend === 'up' ? '↗' : forecast.trend === 'down' ? '↘' : '→'}{' '}
                          {forecast.trend}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(forecast.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* AI Recommendations */}
        {insights.keyRecommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">🤖 AI Recommendations</h4>
            <div className="space-y-2">
              {insights.keyRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {insights.opportunities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">🚀 Growth Opportunities</h4>
            <div className="space-y-2">
              {insights.opportunities.map((opportunity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💡</span>
                  </div>
                  <p className="text-sm text-green-800">{opportunity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {insights.riskFactors.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">⚠️ Risk Factors</h4>
            <div className="space-y-2">
              {insights.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">⚠</span>
                  </div>
                  <p className="text-sm text-yellow-800">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIForecastDashboard;
