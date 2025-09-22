// React hooks for analytics and reporting
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { AnalyticsService } from '../lib/services/analytics.service';

const analyticsService = new AnalyticsService();

// Hook to get today's sales overview
export function useTodaySales() {
  return useQuery({
    queryKey: ['todaySales'],
    queryFn: async () => {
      const { data, error } = await analyticsService.getTodaySales();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Update every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

// Hook to get hourly sales pattern
export function useHourlySales(date?: string) {
  return useQuery({
    queryKey: ['hourlySales', date],
    queryFn: async () => {
      const { data, error } = await analyticsService.getHourlySales(date);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get top selling items
export function useTopSellingItems(limit = 10) {
  return useQuery({
    queryKey: ['topSellingItems', limit],
    queryFn: async () => {
      const { data, error } = await analyticsService.getTopSellingItems(limit);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get server performance
export function useServerPerformance(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['serverPerformance', dateRange],
    queryFn: async () => {
      const { data, error } = await analyticsService.getServerPerformance(dateRange);
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook to generate end-of-day report
export function useEndOfDayReport(date?: string) {
  return useQuery({
    queryKey: ['endOfDayReport', date],
    queryFn: async () => {
      const { data, error } = await analyticsService.generateEndOfDayReport(date);
      if (error) throw error;
      return data;
    },
    enabled: !!date, // Only run when date is provided
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook to get sales trend analysis
export function useSalesTrend(days = 30) {
  return useQuery({
    queryKey: ['salesTrend', days],
    queryFn: async () => {
      const { data, error } = await analyticsService.getSalesTrend(days);
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook to get category performance
export function useCategoryPerformance(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['categoryPerformance', dateRange],
    queryFn: async () => {
      const { data, error } = await analyticsService.getCategoryPerformance(dateRange);
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook to get dashboard statistics
export function useDashboardStats(date?: string) {
  return useQuery({
    queryKey: ['dashboardStats', date],
    queryFn: async () => {
      const { data, error } = await analyticsService.getDashboardStats(date);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 15000, // Consider stale after 15 seconds
  });
}

// Hook to get real-time metrics
export function useRealtimeMetrics() {
  return useQuery({
    queryKey: ['realtimeMetrics'],
    queryFn: async () => {
      const { data, error } = await analyticsService.getRealtimeMetrics();
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Update every 10 seconds for real-time feel
    staleTime: 5000, // Consider stale after 5 seconds
  });
}

// Hook to get sales comparison
export function useSalesComparison() {
  return useQuery({
    queryKey: ['salesComparison'],
    queryFn: async () => {
      const { data, error } = await analyticsService.getSalesComparison();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Update every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
}

// Hook to get peak hours analysis
export function usePeakHoursAnalysis(days = 30) {
  return useQuery({
    queryKey: ['peakHoursAnalysis', days],
    queryFn: async () => {
      const { data, error } = await analyticsService.getPeakHoursAnalysis(days);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour - this data doesn't change frequently
  });
}

// Hook to get item profitability analysis
export function useItemProfitability() {
  return useQuery({
    queryKey: ['itemProfitability'],
    queryFn: async () => {
      const { data, error } = await analyticsService.getItemProfitability();
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook to get waste and void analysis
export function useWasteAnalysis(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['wasteAnalysis', dateRange],
    queryFn: async () => {
      const { data, error } = await analyticsService.getWasteAnalysis(dateRange);
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook to get customer analytics
export function useCustomerAnalytics(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['customerAnalytics', dateRange],
    queryFn: async () => {
      const { data, error } = await analyticsService.getCustomerAnalytics(dateRange);
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook to export sales data
export function useExportSalesData() {
  return useMutation({
    mutationFn: async ({ 
      dateRange, 
      format = 'json' 
    }: { 
      dateRange: { start: string; end: string }; 
      format?: 'csv' | 'json' 
    }) => {
      const { data, error } = await analyticsService.exportSalesData(dateRange, format);
      if (error) throw error;
      return data;
    },
  });
}

// Hook to get inventory impact analysis
export function useInventoryImpact(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['inventoryImpact', dateRange],
    queryFn: async () => {
      const { data, error } = await analyticsService.getInventoryImpact(dateRange);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Helper hook to format currency values
export function useFormatCurrency() {
  return useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }, []);
}

// Helper hook to format percentages
export function useFormatPercentage() {
  return useCallback((value: number, decimals = 1) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }, []);
}

// Hook to calculate period comparisons
export function usePeriodComparison() {
  return useCallback((current: number, previous: number) => {
    if (previous === 0) return { change: 0, isIncrease: false, isDecrease: false };
    
    const change = ((current - previous) / previous) * 100;
    return {
      change: Math.round(change * 100) / 100,
      isIncrease: change > 0,
      isDecrease: change < 0,
      isFlat: change === 0
    };
  }, []);
}
