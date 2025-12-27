/**
 * Analytics utility functions for calculations and formatting
 */

/**
 * Calculate engagement rate
 * @param {number} views - Total views
 * @param {number} engagement - Total engagement (likes + comments)
 * @returns {number} Engagement rate as percentage
 */
const calculateEngagementRate = (views, engagement) => {
  if (!views || views === 0) return 0;
  return ((engagement / views) * 100).toFixed(2);
};

/**
 * Calculate activity level based on last login and post count
 * @param {Date|string} lastLogin - Last login date
 * @param {number} postCount - Number of posts created
 * @returns {string} Activity level: 'active', 'inactive', 'dormant'
 */
const calculateActivityLevel = (lastLogin, postCount = 0) => {
  if (!lastLogin) return 'dormant';
  
  const now = new Date();
  const loginDate = new Date(lastLogin);
  const daysSinceLogin = Math.floor((now - loginDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLogin <= 7) return 'active';
  if (daysSinceLogin <= 30) return 'inactive';
  return 'dormant';
};

/**
 * Format raw metrics data for frontend consumption
 * @param {Object} rawData - Raw analytics data
 * @returns {Object} Formatted metrics
 */
const formatMetrics = (rawData) => {
  return {
    ...rawData,
    formatted: {
      views: formatNumber(rawData.views || 0),
      likes: formatNumber(rawData.likes || 0),
      comments: formatNumber(rawData.comments || 0),
      engagement: formatNumber(rawData.total_engagement || 0),
      engagementRate: `${rawData.engagement_rate || 0}%`
    },
    trends: calculateTrend(rawData)
  };
};

/**
 * Format large numbers with K, M suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Generate trend data for charts
 * @param {Array} data - Array of data points
 * @param {string} period - Time period: 'daily', 'weekly', 'monthly'
 * @returns {Array} Formatted trend data
 */
const generateTrendData = (data, period = 'daily') => {
  const labels = [];
  const values = [];
  
  data.forEach(item => {
    const date = new Date(item.date);
    if (period === 'daily') {
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    } else if (period === 'weekly') {
      labels.push(`Week ${getWeekNumber(date)}`);
    } else {
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    values.push(item.count || item.views || item.likes || item.comments || 0);
  });
  
  return { labels, values };
};

/**
 * Get week number from date
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} Change with direction and percentage
 */
const calculateChange = (current, previous) => {
  if (previous === 0) {
    return {
      value: current,
      change: 0,
      percentage: 0,
      direction: 'neutral'
    };
  }
  
  const change = current - previous;
  const percentage = ((change / previous) * 100).toFixed(1);
  
  return {
    value: current,
    change,
    percentage: parseFloat(percentage),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  };
};

/**
 * Calculate trend based on historical data
 * @param {Object} data - Data object with current and previous values
 * @returns {Object} Trend information
 */
const calculateTrend = (data) => {
  const trends = {};
  
  const metrics = ['views', 'likes', 'comments', 'posts', 'users'];
  
  metrics.forEach(metric => {
    const current = data[`total_${metric}`] || data[metric] || data[metric];
    const previous = data[`previous_${metric}`] || 0;
    
    if (current !== undefined) {
      trends[metric] = calculateChange(current, previous);
    }
  });
  
  return trends;
};

/**
 * Group data by time period
 * @param {Array} data - Array of data with dates
 * @param {string} period - Group by: 'hour', 'day', 'week', 'month'
 * @returns {Object} Grouped data
 */
const groupByPeriod = (data, period = 'day') => {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item.created_at);
    let key;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        break;
      case 'week':
        key = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped[key]) {
      grouped[key] = { date: key, count: 0 };
    }
    grouped[key].count += (item.count || 1);
  });
  
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Calculate average from array
 * @param {Array} values - Array of numbers
 * @returns {number} Average value
 */
const calculateAverage = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + (val || 0), 0);
  return (sum / values.length).toFixed(2);
};

/**
 * Calculate median from array
 * @param {Array} values - Array of numbers
 * @returns {number} Median value
 */
const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
  }
  return sorted[mid];
};

/**
 * Calculate percentile from array
 * @param {Array} values - Array of numbers
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Percentile value
 */
const calculatePercentile = (values, percentile = 50) => {
  if (!values || values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'relative'
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'relative':
      return getRelativeTime(d);
    default:
      return d.toISOString().split('T')[0];
  }
};

/**
 * Get relative time string
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diff / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

/**
 * Generate color for charts based on value
 * @param {number} value - Value to base color on
 * @param {number} max - Maximum value for scaling
 * @returns {string} CSS color
 */
const generateChartColor = (value, max = 100) => {
  const intensity = Math.min(value / max, 1);
  const hue = 200 - (intensity * 40); // Blue to purple range
  return `hsla(${hue}, 70%, 50%, 0.8)`;
};

/**
 * Aggregate data by multiple dimensions
 * @param {Array} data - Array of data objects
 * @param {Array} dimensions - Array of field names to group by
 * @returns {Array} Aggregated data
 */
const aggregateByDimensions = (data, dimensions) => {
  const aggregated = {};
  
  data.forEach(item => {
    const key = dimensions.map(dim => item[dim]).join('|');
    
    if (!aggregated[key]) {
      aggregated[key] = { ...item, count: 0 };
      dimensions.forEach(dim => aggregated[key][dim] = item[dim]);
    }
    
    aggregated[key].count += 1;
  });
  
  return Object.values(aggregated);
};

/**
 * Calculate growth rate
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number} Growth rate as percentage
 */
const calculateGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(2);
};

/**
 * Validate analytics data
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
const validateAnalyticsData = (data) => {
  const errors = [];
  
  if (typeof data.views !== 'number' || data.views < 0) {
    errors.push('Invalid views count');
  }
  
  if (typeof data.likes !== 'number' || data.likes < 0) {
    errors.push('Invalid likes count');
  }
  
  if (typeof data.comments !== 'number' || data.comments < 0) {
    errors.push('Invalid comments count');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  calculateEngagementRate,
  calculateActivityLevel,
  formatMetrics,
  formatNumber,
  generateTrendData,
  calculateChange,
  calculateTrend,
  groupByPeriod,
  calculateAverage,
  calculateMedian,
  calculatePercentile,
  formatDate,
  getRelativeTime,
  generateChartColor,
  aggregateByDimensions,
  calculateGrowthRate,
  validateAnalyticsData
};
