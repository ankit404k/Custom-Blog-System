const validateComment = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, message: 'Comment content is required' };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length < 5) {
    return { valid: false, message: 'Comment must be at least 5 characters long' };
  }

  if (trimmedContent.length > 2000) {
    return { valid: false, message: 'Comment must not exceed 2000 characters' };
  }

  return { valid: true, content: trimmedContent };
};

const sanitizeContent = (content) => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

const detectSpam = (content) => {
  const spamKeywords = [
    'viagra', 'cialis', 'lottery', 'winner', 'click here', 'buy now',
    'limited time', 'act now', 'free money', 'earn cash', 'make money fast',
    'weight loss', 'lose weight fast', 'casino', 'poker online'
  ];

  const lowerContent = content.toLowerCase();
  
  for (const keyword of spamKeywords) {
    if (lowerContent.includes(keyword)) {
      return { isSpam: true, reason: `Detected spam keyword: ${keyword}` };
    }
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  if (urls.length > 3) {
    return { isSpam: true, reason: 'Too many URLs detected' };
  }

  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 20) {
    return { isSpam: true, reason: 'Excessive use of capital letters' };
  }

  return { isSpam: false };
};

module.exports = {
  validateComment,
  sanitizeContent,
  detectSpam,
};
