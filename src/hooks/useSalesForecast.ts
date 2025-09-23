// React hook for AI-powered sales forecasting
import { useQuery } from '@tanstack/react-query';
import { salesForecastService, type SalesForecast } from '../lib/ai/sales-forecast.service';

export interface UseSalesForecastOptions {
  targetDate?: Date;
  daysAhead?: number;
  enabled?: boolean;
}

export function useSalesForecast(options: UseSalesForecastOptions = {}) {
  const {
    targetDate = new Date(),
    daysAhead = 7,
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['salesForecast', targetDate.toISOString(), daysAhead],
    queryFn: async () => {
      return await salesForecastService.generateForecast(targetDate, daysAhead);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useForecastAccuracy(days: number = 7) {
  return useQuery({
    queryKey: ['forecastAccuracy', days],
    queryFn: async () => {
      return await salesForecastService.getForecastAccuracy(days);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Hook for real-time forecast updates
export function useSalesForecastRealtime(options: UseSalesForecastOptions = {}) {
  const forecastQuery = useSalesForecast(options);
  const accuracyQuery = useForecastAccuracy(options.daysAhead);

  return {
    forecasts: forecastQuery.data || [],
    accuracy: accuracyQuery.data,
    isLoading: forecastQuery.isLoading || accuracyQuery.isLoading,
    error: forecastQuery.error || accuracyQuery.error,
    refetch: () => {
      forecastQuery.refetch();
      accuracyQuery.refetch();
    },
    isError: forecastQuery.isError || accuracyQuery.isError,
  };
}

// Hook for forecast insights and recommendations
export function useForecastInsights(forecasts: SalesForecast[]) {
  const insights = React.useMemo(() => {
    if (!forecasts || forecasts.length === 0) {
      return {
        totalPredictedRevenue: 0,
        averageConfidence: 0,
        trendAnalysis: 'stable',
        keyRecommendations: [],
        riskFactors: [],
        opportunities: []
      };
    }

    const totalPredictedRevenue = forecasts.reduce((sum, forecast) => sum + forecast.predictedRevenue, 0);
    const averageConfidence = forecasts.reduce((sum, forecast) => sum + forecast.confidence, 0) / forecasts.length;
    
    // Analyze trends
    const trends = forecasts.map(f => f.trend);
    const upTrends = trends.filter(t => t === 'up').length;
    const downTrends = trends.filter(t => t === 'down').length;
    const stableTrends = trends.filter(t => t === 'stable').length;
    
    let trendAnalysis: 'up' | 'down' | 'stable' = 'stable';
    if (upTrends > downTrends && upTrends > stableTrends) {
      trendAnalysis = 'up';
    } else if (downTrends > upTrends && downTrends > stableTrends) {
      trendAnalysis = 'down';
    }

    // Collect all recommendations
    const allRecommendations = forecasts.flatMap(f => f.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    // Identify risk factors
    const riskFactors = forecasts
      .filter(f => f.confidence < 0.7)
      .map(f => `Low confidence forecast for ${f.date} (${Math.round(f.confidence * 100)}%)`);

    // Identify opportunities
    const opportunities = forecasts
      .filter(f => f.predictedRevenue > f.historicalAverage * 1.2)
      .map(f => `High revenue opportunity on ${f.date}: ${Math.round(((f.predictedRevenue - f.historicalAverage) / f.historicalAverage) * 100)}% above average`);

    return {
      totalPredictedRevenue: Math.round(totalPredictedRevenue * 100) / 100,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      trendAnalysis,
      keyRecommendations: uniqueRecommendations.slice(0, 5), // Top 5 recommendations
      riskFactors,
      opportunities
    };
  }, [forecasts]);

  return insights;
}

// Import React for useMemo
import React from 'react';
