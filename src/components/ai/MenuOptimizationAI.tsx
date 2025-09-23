// AI-powered menu optimization component
import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { Button } from '../ui/Button';

interface MenuOptimizationAIProps {
  className?: string;
}

interface MenuOptimization {
  underperformingItems: Array<{
    id: string;
    name: string;
    currentPrice: number;
    suggestedPrice: number;
    reason: string;
  }>;
  popularCombinations: Array<{
    items: string[];
    frequency: number;
    suggestedPromotion: string;
  }>;
  seasonalRecommendations: Array<{
    category: string;
    suggestion: string;
    expectedImpact: string;
  }>;
}

export const MenuOptimizationAI: React.FC<MenuOptimizationAIProps> = ({ className = '' }) => {
  const { data: menuItems, isLoading } = useMenu();
  const [optimization, setOptimization] = useState<MenuOptimization | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulate AI analysis (in real implementation, this would call an AI service)
  const analyzeMenu = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI analysis results
    const mockOptimization: MenuOptimization = {
      underperformingItems: [
        {
          id: '1',
          name: 'Spicy Tuna Roll',
          currentPrice: 12.99,
          suggestedPrice: 10.99,
          reason: 'Low sales volume, high ingredient cost'
        },
        {
          id: '2',
          name: 'Tempura Shrimp',
          currentPrice: 15.99,
          suggestedPrice: 13.99,
          reason: 'Competitive pricing needed'
        }
      ],
      popularCombinations: [
        {
          items: ['California Roll', 'Miso Soup'],
          frequency: 85,
          suggestedPromotion: 'Bundle discount: 10% off when ordered together'
        },
        {
          items: ['Dragon Roll', 'Green Tea'],
          frequency: 72,
          suggestedPromotion: 'Lunch combo special'
        }
      ],
      seasonalRecommendations: [
        {
          category: 'Appetizers',
          suggestion: 'Add seasonal vegetable tempura',
          expectedImpact: '15% increase in appetizer sales'
        },
        {
          category: 'Beverages',
          suggestion: 'Introduce hot sake for winter',
          expectedImpact: '20% increase in beverage revenue'
        }
      ]
    };
    
    setOptimization(mockOptimization);
    setIsAnalyzing(false);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">🧠 AI Menu Optimization</h3>
            <p className="text-sm text-gray-500">Analyze menu performance and get AI recommendations</p>
          </div>
          <Button 
            onClick={analyzeMenu} 
            disabled={isAnalyzing}
            variant="primary"
            size="sm"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Menu'}
          </Button>
        </div>
      </div>

      <div className="p-6">
        {!optimization ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Optimize Your Menu</h4>
            <p className="text-gray-500 mb-6">
              Click "Analyze Menu" to get AI-powered insights on pricing, combinations, and seasonal opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Underperforming Items */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">💰 Pricing Optimization</h4>
              <div className="space-y-3">
                {optimization.underperformingItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">${item.currentPrice}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-green-600">${item.suggestedPrice}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Save: ${(item.currentPrice - item.suggestedPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Combinations */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">🍽️ Popular Combinations</h4>
              <div className="space-y-3">
                {optimization.popularCombinations.map((combo, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">
                        {combo.items.join(' + ')}
                      </p>
                      <span className="text-sm text-blue-600 font-medium">
                        {combo.frequency}% of orders
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">{combo.suggestedPromotion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Recommendations */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">🌟 Seasonal Opportunities</h4>
              <div className="space-y-3">
                {optimization.seasonalRecommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{rec.category}</p>
                      <span className="text-sm text-green-600 font-medium">{rec.expectedImpact}</span>
                    </div>
                    <p className="text-sm text-green-700">{rec.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button variant="primary" size="sm">
                Apply Recommendations
              </Button>
              <Button variant="secondary" size="sm">
                Export Analysis
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOptimization(null)}>
                New Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuOptimizationAI;
