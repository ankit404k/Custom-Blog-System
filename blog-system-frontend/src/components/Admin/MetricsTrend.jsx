import React from 'react';

/**
 * Metrics Trend Component
 * Displays a metric with its trend indicator
 */
const MetricsTrend = ({ label, current, previous, format = 'number', showPercentage = true }) => {
  const calculateChange = () => {
    if (!previous || previous === 0) {
      return {
        value: 0,
        percentage: 0,
        direction: 'neutral'
      };
    }
    
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    
    return {
      value: change,
      percentage: parseFloat(percentage),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const formatValue = (value) => {
    if (format === 'number') {
      return value.toLocaleString();
    } else if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    return value;
  };

  const trend = calculateChange();

  const getTrendColor = () => {
    if (trend.direction === 'up') return 'text-green-600 bg-green-50';
    if (trend.direction === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = () => {
    if (trend.direction === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    }
    if (trend.direction === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900">{formatValue(current)}</span>
        {previous !== undefined && showPercentage && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend.percentage)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsTrend;
