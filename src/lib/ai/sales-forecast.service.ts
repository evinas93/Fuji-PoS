// AI-powered sales forecasting service
import { supabase } from '../supabase';

export interface SalesForecast {
  date: string;
  predictedRevenue: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
  historicalAverage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ForecastFactors {
  dayOfWeek: number;
  season: string;
  weatherCondition?: string;
  localEvents?: string[];
  historicalPatterns: number[];
}

export class SalesForecastService {
  // Simple linear regression for sales prediction
  private calculateLinearRegression(data: number[]): { slope: number; intercept: number } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  // Get historical sales data
  private async getHistoricalSales(days: number = 30): Promise<number[]> {
    const { data, error } = await supabase
      .from('daily_sales')
      .select('net_sales, date')
      .order('date', { ascending: false })
      .limit(days);

    if (error) {
      console.error('Error fetching historical sales:', error);
      return [];
    }

    return data?.map(record => record.net_sales || 0).reverse() || [];
  }

  // Calculate day-of-week patterns
  private calculateDayPatterns(salesData: any[]): Record<number, number> {
    const patterns: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    salesData.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      if (patterns[dayOfWeek]) {
        patterns[dayOfWeek].push(record.net_sales || 0);
      }
    });

    const averages: Record<number, number> = {};
    Object.keys(patterns).forEach(day => {
      const dayNum = parseInt(day);
      const sales = patterns[dayNum];
      averages[dayNum] = sales.length > 0 ? sales.reduce((a, b) => a + b, 0) / sales.length : 0;
    });

    return averages;
  }

  // Get seasonal factors
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    
    // Simple seasonal adjustments based on typical restaurant patterns
    const seasonalFactors: Record<number, number> = {
      0: 0.9,  // January - post-holiday dip
      1: 0.95, // February
      2: 1.0,  // March
      3: 1.05, // April - spring uptick
      4: 1.1,  // May
      5: 1.15, // June - summer start
      6: 1.2,  // July - peak summer
      7: 1.15, // August
      8: 1.1,  // September - back to school
      9: 1.05, // October
      10: 1.0, // November
      11: 1.3  // December - holiday season
    };

    return seasonalFactors[month] || 1.0;
  }

  // Calculate weather impact (placeholder - would integrate with weather API)
  private getWeatherImpact(): number {
    // In a real implementation, this would call a weather API
    // and adjust predictions based on weather conditions
    return 1.0;
  }

  // Generate sales forecast
  async generateForecast(targetDate: Date, daysAhead: number = 7): Promise<SalesForecast[]> {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalSales(90);
      
      if (historicalData.length < 7) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Calculate base trend
      const regression = this.calculateLinearRegression(historicalData);
      
      // Get day-of-week patterns
      const { data: dailyData } = await supabase
        .from('daily_sales')
        .select('net_sales, date')
        .order('date', { ascending: false })
        .limit(90);

      const dayPatterns = this.calculateDayPatterns(dailyData || []);
      const historicalAverage = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;

      const forecasts: SalesForecast[] = [];

      for (let i = 0; i < daysAhead; i++) {
        const forecastDate = new Date(targetDate);
        forecastDate.setDate(targetDate.getDate() + i);
        
        const dayOfWeek = forecastDate.getDay();
        const seasonalFactor = this.getSeasonalFactor(forecastDate);
        const weatherFactor = this.getWeatherImpact();
        
        // Calculate base prediction
        const trendValue = regression.slope * (historicalData.length + i) + regression.intercept;
        const dayPatternValue = dayPatterns[dayOfWeek] || historicalAverage;
        
        // Combine factors
        const predictedRevenue = (trendValue + dayPatternValue) / 2 * seasonalFactor * weatherFactor;
        
        // Calculate confidence based on historical variance
        const recentVariance = this.calculateVariance(historicalData.slice(-7));
        const confidence = Math.max(0.5, Math.min(0.95, 1 - (recentVariance / historicalAverage)));

        // Determine trend
        const trend: 'up' | 'down' | 'stable' = 
          regression.slope > historicalAverage * 0.05 ? 'up' :
          regression.slope < -historicalAverage * 0.05 ? 'down' : 'stable';

        // Generate recommendations
        const recommendations = this.generateRecommendations(predictedRevenue, historicalAverage, trend);

        forecasts.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedRevenue: Math.round(predictedRevenue * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          factors: [
            `Day of week: ${this.getDayName(dayOfWeek)}`,
            `Seasonal factor: ${Math.round(seasonalFactor * 100)}%`,
            `Weather factor: ${Math.round(weatherFactor * 100)}%`,
            `Trend: ${trend}`
          ],
          recommendations,
          historicalAverage: Math.round(historicalAverage * 100) / 100,
          trend
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating sales forecast:', error);
      throw error;
    }
  }

  // Calculate variance for confidence estimation
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  // Generate actionable recommendations
  private generateRecommendations(predicted: number, average: number, trend: string): string[] {
    const recommendations: string[] = [];
    const difference = predicted - average;
    const percentageChange = (difference / average) * 100;

    if (Math.abs(percentageChange) > 20) {
      if (percentageChange > 20) {
        recommendations.push('Consider increasing staff for expected busy period');
        recommendations.push('Ensure adequate inventory for high-demand items');
        recommendations.push('Plan for longer preparation times');
      } else {
        recommendations.push('Consider reducing staff or offering special promotions');
        recommendations.push('Focus on marketing to boost sales');
        recommendations.push('Review slow-moving inventory items');
      }
    }

    if (trend === 'up') {
      recommendations.push('Positive trend detected - consider expanding popular menu items');
    } else if (trend === 'down') {
      recommendations.push('Declining trend - review menu and pricing strategy');
    }

    return recommendations;
  }

  // Helper method to get day name
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  // Get forecast accuracy metrics
  async getForecastAccuracy(days: number = 7): Promise<{
    accuracy: number;
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get actual sales for the period
      const { data: actualData } = await supabase
        .from('daily_sales')
        .select('net_sales, date')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!actualData || actualData.length === 0) {
        return { accuracy: 0, mape: 0, rmse: 0 };
      }

      // Generate forecasts for the same period
      const forecasts = await this.generateForecast(startDate, days);
      
      let totalError = 0;
      let totalAbsolutePercentageError = 0;
      let totalSquaredError = 0;
      let validComparisons = 0;

      actualData.forEach((actual, index) => {
        const forecast = forecasts[index];
        if (forecast && actual.net_sales) {
          const error = Math.abs(forecast.predictedRevenue - actual.net_sales);
          const percentageError = (error / actual.net_sales) * 100;
          const squaredError = Math.pow(forecast.predictedRevenue - actual.net_sales, 2);
          
          totalError += error;
          totalAbsolutePercentageError += percentageError;
          totalSquaredError += squaredError;
          validComparisons++;
        }
      });

      if (validComparisons === 0) {
        return { accuracy: 0, mape: 0, rmse: 0 };
      }

      const mape = totalAbsolutePercentageError / validComparisons;
      const rmse = Math.sqrt(totalSquaredError / validComparisons);
      const accuracy = Math.max(0, 100 - mape);

      return {
        accuracy: Math.round(accuracy * 100) / 100,
        mape: Math.round(mape * 100) / 100,
        rmse: Math.round(rmse * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating forecast accuracy:', error);
      return { accuracy: 0, mape: 0, rmse: 0 };
    }
  }
}

// Export singleton instance
export const salesForecastService = new SalesForecastService();
